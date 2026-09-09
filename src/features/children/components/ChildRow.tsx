import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Eye, HeartPulse, Pencil, Trash2 } from "lucide-react";
import type { Child } from "@/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AuthAvatarImage } from "@/components/common/AuthImage";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChildStatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Money } from "@/components/common/Money";
import { ageFromBirth } from "@/lib/dates";
import { cn, focusRing } from "@/lib/utils";
import { ChildFormDialog } from "./ChildFormDialog";

interface ChildRowProps {
  child: Child;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

/** Jadvaldagi bitta bola. Callback'lar barqaror — `memo` shu sababli ishlaydi. */
export const ChildRow = memo(function ChildRow({
  child,
  canEdit,
  canDelete,
  onDelete,
}: ChildRowProps) {
  const { t } = useTranslation();
  const fullName = `${child.lastName} ${child.firstName}`;
  const age = ageFromBirth(child.birthDate);
  const hasDebt = Boolean((child.debtTiyin && child.debtTiyin !== "0") || child.hasDebt);

  /*
    Qatorlarda kirish animatsiyasi yo'q — ataylab. U montajda ishlaydi,
    montaj esa har bir qaytishda takrorlanadi: keshdan darhol chizilgan
    jadval ham har safar qaytadan yuklanayotgandek ko'rinardi.
  */
  return (
    <TableRow className="group/row">
      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-transparent transition-all duration-200 group-hover/row:ring-brand/40">
            <AuthAvatarImage fileId={child.photoFileId} src={child.photoUrl} />
            <AvatarFallback className="bg-brand-soft text-sm font-bold text-brand-ink">
              {child.firstName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {/*
                Ilgari ism oddiy matn edi va bolani ochish uchun faqat
                o'ngdagi ko'z ikonkasini bosish kerak bo'lardi.
              */}
              <Link
                to="/bolalar/$id"
                params={{ id: child.id }}
                className={cn(
                  "truncate rounded-sm font-semibold decoration-brand decoration-2 underline-offset-4 transition-colors hover:underline",
                  focusRing,
                )}
              >
                {fullName}
              </Link>
              {child.hasMedicalAlert ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-st-danger-soft">
                      <HeartPulse
                        className="h-3.5 w-3.5 text-st-danger-fg"
                        aria-label={t("children.alertBadge")}
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{t("children.alertBadge")}</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            {child.contractNumber ? (
              <div className="truncate text-xs tabular-nums text-muted-foreground">
                {child.contractNumber}
              </div>
            ) : null}
          </div>
        </div>
      </TableCell>

      <TableCell className="tabular-nums text-muted-foreground">
        {age === null ? "—" : t("children.ageYears", { count: age })}
      </TableCell>

      <TableCell>
        {child.groupName ? (
          /* Uzun guruh nomi o'ralib ketsin — `nowrap` jadvalning eng kichik
             kengligini oshirib, tor ekranda skrollni keltirib chiqarardi. */
          <span className="inline-flex items-center rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold">
            {child.groupName}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">{t("children.noGroup")}</span>
        )}
      </TableCell>

      <TableCell>
        <ChildStatusBadge status={child.status} />
      </TableCell>

      <TableCell className="text-right">
        {child.debtTiyin && child.debtTiyin !== "0" ? (
          <Money value={child.debtTiyin} className="font-bold tabular-nums text-st-danger-fg" />
        ) : hasDebt ? (
          <span className="text-sm font-semibold text-st-danger-fg">{t("children.debtBadge")}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell className="text-right">
        {/*
          Ikonkali tugmalar bola ismi bilan nomlanadi — aks holda ekran
          o'quvchi 20 qatorda 60 ta bir xil nomsiz tugma e'lon qiladi.
          Ular sichqoncha qatordan tashqarida bo'lganda so'niq turadi va
          qator ustiga kelganda to'liq ko'rinadi; klaviatura bilan yurganda
          (`focus-within`) ham to'liq ko'rinadi.
        */}
        <div className="inline-flex gap-0.5 opacity-60 transition-opacity duration-200 group-hover/row:opacity-100 group-focus-within/row:opacity-100">
          <Button size="icon" variant="ghost" asChild className="h-9 w-9 rounded-lg">
            <Link
              to="/bolalar/$id"
              params={{ id: child.id }}
              aria-label={`${t("common.actions.view")} — ${fullName}`}
            >
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {canEdit ? (
            <ChildFormDialog
              child={child}
              trigger={
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`${t("common.actions.edit")} — ${fullName}`}
                  className="h-9 w-9 rounded-lg"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
          ) : null}
          {canDelete ? (
            <ConfirmDialog
              trigger={
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`${t("common.actions.delete")} — ${fullName}`}
                  className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              title={t("children.deleteTitle")}
              description={t("children.deleteText", { name: fullName })}
              confirmLabel={t("common.actions.delete")}
              destructive
              onConfirm={() => onDelete(child.id)}
            />
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
});
