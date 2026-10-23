import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { BlockContent, LandingBlock } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { emptyContent, fieldsFor, isSupportedType, pruneContent } from "../block-schema";
import { contentFieldErrors, stripContentPrefix } from "../content-errors";
import { useCreateBlock, useUpdateBlock } from "../api";
import { ContentEditor } from "./ContentFields";

interface BlockFormDialogProps {
  type: string;
  locales: string[];
  /** Katalogdagi maydonlar — chizish shu ro'yxat bilan cheklanadi. */
  catalogFields?: string[];
  /** Berilsa — tahrirlash, aks holda yangi blok. */
  block?: LandingBlock;
  trigger?: ReactNode;
  /**
   * Tashqaridan boshqarish. «Blok qo'shish» menyusi uchun kerak: oyna
   * menyuning ICHIDA turolmaydi — menyu yopilganda Radix o'z tarkibini
   * yechadi va u bilan birga oyna ham yo'qoladi.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Blok formasi.
 *
 * `content` BUTUNLAY almashtiriladi (§10.5), shuning uchun forma to'liq
 * obyektni yuboradi. Yuborishdan oldin bo'sh matn va bo'sh ro'yxatlar
 * tozalanadi: server ixtiyoriy maydonning YO'Q bo'lishini qabul qiladi,
 * bo'sh satrni esa qiymat deb oladi va u chop etilgan saytda bo'sh sarlavha
 * bo'lib chiqadi.
 */
export function BlockFormDialog({
  type,
  locales,
  catalogFields,
  block,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: BlockFormDialogProps) {
  const { t } = useTranslation();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const [content, setContent] = useState<BlockContent>(block?.content ?? emptyContent(type));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useCreateBlock();
  const update = useUpdateBlock();
  const pending = create.isPending || update.isPending;
  const fields = fieldsFor(type, catalogFields);

  const submit = () => {
    const payload = (pruneContent(content) ?? {}) as BlockContent;
    const onError = (error: unknown) => setErrors(stripContentPrefix(contentFieldErrors(error)));
    const onSuccess = () => {
      setErrors({});
      setOpen(false);
    };

    if (block) update.mutate({ id: block.id, dto: { content: payload } }, { onSuccess, onError });
    /*
      `isVisible` ANIQ yuboriladi. Server standarti `true`, lekin yangi blok
      qo'shishdan maqsad uni KO'RSATISH — bu standartga suyanib qo'yiladigan
      narsa emas. Baribir qoralama: chop etilgunga qadar saytga chiqmaydi.
    */ else create.mutate({ type, content: payload, isVisible: true }, { onSuccess, onError });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          // Har ochilishda joriy holatdan boshlanadi — eski tahrir qolib ketmasin.
          setContent(block?.content ?? emptyContent(type));
          setErrors({});
        }
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="flex max-h-[92vh] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle>{t(`website.types.${type}`, { defaultValue: type })}</DialogTitle>
          <DialogDescription>{t("website.blocks.formHint")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {isSupportedType(type) ? (
            <ContentEditor
              fields={fields}
              locales={locales}
              value={content as Record<string, unknown>}
              onChange={setContent}
              errors={errors}
            />
          ) : (
            /*
              Server yangi tur qo'shgan, frontend uni hali bilmaydi. Bu xato
              emas — shunchaki forma yo'q. Blokni ko'rsatamiz, lekin tahrirni
              taklif qilmaymiz: noto'g'ri shakl `422` bo'lib qaytadi.
            */
            <p className="text-sm text-muted-foreground">{t("website.blocks.unsupported")}</p>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button disabled={pending || !isSupportedType(type)} onClick={submit}>
            {t("common.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
