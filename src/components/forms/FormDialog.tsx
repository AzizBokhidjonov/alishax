import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  onSubmit: () => void;
  canSubmit: boolean;
  pending?: boolean;
  /**
   * Tahrirlash rejimimi. `useEntityForm().isEditing` shu yerga beriladi va
   * tugma matnini belgilaydi: yangi yozuvda «Qo'shish», tahrirlashda
   * «Saqlash». Boshqa amallar (biriktirish, ko'chirish, to'lash) uchun
   * `submitLabel` ni to'g'ridan-to'g'ri bering.
   */
  isEditing?: boolean;
  submitLabel?: string;
  contentClassName?: string;
  /** Tugmalar qatorining chap tomoni — o'chirish kabi ikkilamchi amallar uchun. */
  footerStart?: ReactNode;
}

/**
 * Barcha forma dialoglari uchun umumiy qobiq: sarlavha, tana va tugmalar.
 *
 * Sarlavha va tugmalar qatori JOYIDA QOLADI, faqat maydonlar skroll qilinadi.
 * Ilgari butun dialog skroll qilinardi: uzun formada (masalan bola kartasi)
 * pastga tushganda «Saqlash» ham, sarlavha ham ko'rinmay ketardi va
 * foydalanuvchi qaysi yozuvni tahrirlayotganini yo'qotardi.
 */
export function FormDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  onSubmit,
  canSubmit,
  pending,
  isEditing = false,
  submitLabel,
  contentClassName = "max-w-md",
  footerStart,
}: FormDialogProps) {
  const { t } = useTranslation();
  const defaultLabel = isEditing ? t("common.actions.save") : t("common.actions.add");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("flex max-h-[90vh] flex-col gap-0 p-0", contentClassName)}>
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit && !pending) onSubmit();
          }}
        >
          <fieldset disabled={pending} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-5">
            {children}
          </fieldset>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-secondary/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
            {footerStart ? <div className="sm:mr-auto">{footerStart}</div> : null}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={!canSubmit || pending} className="min-w-28">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitLabel ?? defaultLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Yorliq, maydon va xato matnini birga ko'rsatadigan o'ram.
 *
 * Maydon bitta element bo'lsa, unga avtomatik `id` beriladi va yorliq shu
 * `id` ga bog'lanadi — yorliqni bosganda maydon faollashadi. Xato bo'lsa
 * maydonga `aria-invalid` qo'yiladi (chegarasi qizil bo'ladi) va xato matni
 * `aria-describedby` orqali maydonga bog'lanadi, shunda ekran o'quvchi uni
 * maydon bilan birga o'qiydi.
 */
export function Field({
  label,
  error,
  hint,
  className,
  htmlFor,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  htmlFor?: string;
  /** Yorliq yonida majburiyligini bildiruvchi belgi. */
  required?: boolean;
  children: ReactNode;
}) {
  const generatedId = useId();
  const control = isValidElement(children)
    ? (children as ReactElement<Record<string, unknown>>)
    : null;

  // `htmlFor` berilgan bo'lsa, `id` ni chaqiruvchi o'zi qo'ygan (masalan maydon
  // qo'shimcha o'ram ichida turganda). Bunday holda `id` ni singdirmaymiz —
  // aks holda o'ramga ham, maydonga ham bir xil `id` tushib qolardi.
  const existingId = typeof control?.props.id === "string" ? control.props.id : undefined;
  const callerOwnsId = htmlFor !== undefined;
  const controlId = htmlFor ?? existingId ?? (control ? generatedId : undefined);
  const hintId = hint && !error ? `${generatedId}-hint` : undefined;
  const errorId = error ? `${generatedId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={controlId}>
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-st-danger-fg">
            *
          </span>
        ) : null}
      </Label>
      {control
        ? cloneElement(control, {
            ...(callerOwnsId ? {} : { id: controlId }),
            "aria-invalid": error ? true : control.props["aria-invalid"],
            "aria-describedby": describedBy ?? control.props["aria-describedby"],
          })
        : children}
      {hintId ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {/*
        Xato matni paydo bo'lganda sekin tushadi — u to'satdan chiqib
        maydonlarni siltab yubormasin.
      */}
      {errorId ? (
        <p
          id={errorId}
          className="animate-in fade-in-0 slide-in-from-top-1 text-xs font-medium text-st-danger-fg duration-200"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Forma ichidagi bo'lim sarlavhasi. Uzun formalarni ma'noli guruhlarga
 * bo'ladi — bola kartasidagi 11 ta maydon bitta tekis ro'yxat bo'lib
 * qolmasin.
 */
export function FormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="flex items-center gap-3 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
        <span aria-hidden className="h-px flex-1 bg-border" />
      </h3>
      {children}
    </section>
  );
}
