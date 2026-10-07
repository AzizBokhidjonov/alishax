import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LogOut } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { PickupRecipientPicker } from "@/features/pickup/components/PickupRecipientPicker";
import { PickupVerdict } from "@/features/pickup/components/PickupVerdict";
import { usePickupCheckOut } from "@/features/pickup/use-pickup-checkout";

interface CheckOutDialogProps {
  childId: string;
  childName: string;
  /** Kartochkada tugma to'liq kenglikni egallaydi. */
  className?: string;
}

/**
 * Chiqish — kunning eng xavfli qarori, shuning uchun IKKI QADAM (§5.2):
 * avval «kim olib ketyapti», keyin serverning hukmi. Bir teginishli chiqish
 * ataylab yo'q.
 *
 * Oyna o'z mantig'ini yuritmaydi: tanlash, tekshirish va tasdiqlash
 * «Olib ketish nazorati» sahifasi bilan BITTA kod (`usePickupCheckOut`,
 * `PickupRecipientPicker`, `PickupVerdict`). Ilgari bu yerda hammasining
 * kichraytirilgan nusxasi turardi — 56px surat va kichkina lavha. Ikki
 * joyda ikki xil ko'rinish bo'lsa, birida qabul qilingan qaror ikkinchisida
 * boshqacha o'qiladi.
 */
export function CheckOutDialog({ childId, childName, className }: CheckOutDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const flow = usePickupCheckOut(childId, {
    childName,
    enabled: open,
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) flow.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className={className}>
          <LogOut className="mr-1 h-4 w-4" />
          {t("attendance.checkOut")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{childName}</DialogTitle>
          <DialogDescription>{t("pickup.verify.hint")}</DialogDescription>
        </DialogHeader>

        {!flow.recipient ? (
          // 1-qadam: kim olib ketyapti.
          <PickupRecipientPicker
            childId={childId}
            value={flow.recipient}
            onChange={flow.selectRecipient}
            className="max-h-96 overflow-y-auto"
          />
        ) : (
          // 2-qadam: serverning hukmi — surat, band va sabab.
          <div className="flex flex-col items-center gap-3 text-center">
            <PickupVerdict
              childId={childId}
              recipient={flow.recipient}
              data={flow.verdict}
              isLoading={flow.verify.isLoading}
              error={flow.verifyError}
            />

            {/* Izoh faqat ruxsat bo'lganda kerak — rad etilganda u chalg'itadi. */}
            {flow.allowed ? (
              <Textarea
                rows={2}
                className="w-full"
                placeholder={t("attendance.noteOptional")}
                value={flow.note}
                onChange={(event) => flow.setNote(event.target.value)}
              />
            ) : null}
          </div>
        )}

        <DialogFooter>
          {flow.recipient ? (
            <>
              <Button variant="ghost" onClick={flow.reset}>
                {t("common.actions.back")}
              </Button>
              <Button disabled={!flow.allowed || flow.pending} onClick={flow.submit}>
                {t("attendance.checkOut")}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.actions.cancel")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
