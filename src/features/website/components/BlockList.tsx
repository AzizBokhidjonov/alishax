import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import type { BlockTypeCatalog, LandingBlock } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import { blockPreviewText, isBlockVisible, isSupportedType } from "../block-schema";
import { useDeleteBlock, useReorderBlocks, useUpdateBlock } from "../api";
import { BlockFormDialog } from "./BlockFormDialog";

interface BlockListProps {
  blocks: LandingBlock[];
  catalog?: BlockTypeCatalog;
  locales: string[];
}

/**
 * Sahifa bloklari — ko'rinadigan tartibda.
 *
 * Tartib strelkalar bilan o'zgaradi, sudrash bilan emas: ro'yxat qisqa,
 * amal esa klaviatura va ekran o'quvchi uchun ham ishlashi kerak. Har bir
 * siljish `PUT /landing/blocks/reorder` ga BARCHA bloklarni yangi
 * pozitsiyasi bilan yuboradi — server buni bitta tranzaksiyada qo'llaydi
 * (§4).
 */
export function BlockList({ blocks, catalog, locales }: BlockListProps) {
  const { t } = useTranslation();
  /** Qaysi tur qo'shilmoqda — menyu tanlovi shu yerda saqlanadi. */
  const [adding, setAdding] = useState<string | null>(null);
  const update = useUpdateBlock();
  const remove = useDeleteBlock();
  const reorder = useReorderBlocks();

  const fieldsOf = (type: string) => catalog?.types.find((item) => item.type === type)?.fields;

  const move = (index: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    reorder.mutate({ blocks: next.map((block, position) => ({ id: block.id, position })) });
  };

  const types = catalog?.types.map((item) => item.type) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t("website.blocks.hint")}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-11">
              <Plus className="mr-2 h-4 w-4" />
              {t("website.blocks.add")}
            </Button>
          </DropdownMenuTrigger>
          {/* Menyu SERVER katalogidan quriladi — yangi tur reliz talab qilmaydi (§3). */}
          <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto">
            {types.map((type) => (
              <DropdownMenuItem key={type} onSelect={() => setAdding(type)}>
                {t(`website.types.${type}`, { defaultValue: type })}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/*
        Yangi blok oynasi menyudan TASHQARIDA turadi: menyu yopilganda uning
        tarkibi yechiladi va ichidagi oyna ham yo'qolib ketardi.
      */}
      {adding ? (
        <BlockFormDialog
          key={adding}
          type={adding}
          locales={locales}
          catalogFields={fieldsOf(adding)}
          open
          onOpenChange={(next) => {
            if (!next) setAdding(null);
          }}
        />
      ) : null}

      {blocks.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title={t("website.blocks.empty")}
          description={t("website.blocks.emptyHint")}
        />
      ) : (
        <div className="space-y-2">
          {blocks.map((block, index) => {
            const preview = blockPreviewText(block.content, locales);
            const visible = isBlockVisible(block);
            return (
              <Card
                key={block.id}
                /* Yashirilgan blok ko'zga ko'rinib turishi kerak — u chop etilmaydi (§4). */
                className={cn(!visible && "border-dashed bg-secondary/40 opacity-75")}
              >
                <CardContent className="flex flex-wrap items-center gap-3 p-3">
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0 || reorder.isPending}
                      aria-label={t("website.blocks.moveUp")}
                      onClick={() => move(index, index - 1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === blocks.length - 1 || reorder.isPending}
                      aria-label={t("website.blocks.moveDown")}
                      onClick={() => move(index, index + 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="min-w-48 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">
                        {t(`website.types.${block.type}`, { defaultValue: block.type })}
                      </span>
                      {!visible ? <Badge tone="neutral">{t("website.blocks.hidden")}</Badge> : null}
                      {!isSupportedType(block.type) ? (
                        <Badge tone="warn">{t("website.blocks.unsupportedShort")}</Badge>
                      ) : null}
                    </div>
                    {preview ? (
                      <p className="truncate text-sm text-muted-foreground">{preview}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={visible ? t("website.blocks.hide") : t("website.blocks.show")}
                      onClick={() => update.mutate({ id: block.id, dto: { isVisible: !visible } })}
                    >
                      {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>

                    <BlockFormDialog
                      type={block.type}
                      locales={locales}
                      catalogFields={fieldsOf(block.type)}
                      block={block}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Pencil className="mr-1 h-4 w-4" />
                          {t("common.actions.edit")}
                        </Button>
                      }
                    />

                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                      title={t("website.blocks.delete")}
                      /* O'chirish jonli saytga TEGMAYDI — u keyingi chop etishda ketadi (§10.2). */
                      description={t("website.blocks.deleteHint")}
                      destructive
                      onConfirm={() => remove.mutate(block.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
