import { useCallback, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ConfirmDialogProps {
  trigger: ReactNode;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  /** Sabab maydonini ko'rsatadi va uni majburiy qiladi. */
  requireReason?: boolean;
  reasonLabel?: string;
  /** Sababning eng qisqa uzunligi (masalan davomat tuzatishida 10). */
  reasonMinLength?: number;
  /** Maxsus (audit yoziladigan) amal — qo'shimcha ogohlantirish. */
  sensitive?: boolean;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: (reason: string) => void | Promise<unknown>;
}

/**
 * Tasdiqlash oynasi. Maxsus amallar (to'lovni bekor qilish, davrni qayta
 * ochish, chegirma) uchun sabab majburiy — u audit jurnaliga tushadi.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  requireReason,
  reasonLabel,
  reasonMinLength = 1,
  sensitive,
  destructive,
  pending,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const reasonTooShort = requireReason && reason.trim().length < reasonMinLength;

  const handleConfirm = useCallback(async () => {
    if (reasonTooShort) return;
    await onConfirm(reason.trim());
    setReason("");
    setOpen(false);
  }, [onConfirm, reason, reasonTooShort]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReason("");
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {sensitive ? (
          <div className="flex gap-2 rounded-xl border border-st-warn-border bg-st-warn-soft p-3 text-sm text-st-warn-fg">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("common.confirm.sensitiveText")}</span>
          </div>
        ) : null}

        {requireReason ? (
          <div className="space-y-1">
            <Label htmlFor="confirm-reason">{reasonLabel ?? t("common.labels.reason")}</Label>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
            />
            {reasonTooShort ? (
              <p className="text-xs text-st-danger-fg">
                {reasonMinLength > 1
                  ? t("common.validation.minLength", { count: reasonMinLength })
                  : t("common.confirm.reasonRequired")}
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={reasonTooShort || pending}
            onClick={() => void handleConfirm()}
          >
            {confirmLabel ?? t("common.actions.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
