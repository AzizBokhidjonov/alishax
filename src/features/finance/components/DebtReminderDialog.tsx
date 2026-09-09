import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BellRing } from "lucide-react";
import { childrenApi, notificationsApi, type NotificationChannel, type Tiyin } from "@/api";
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
import { SelectField } from "@/components/common/SelectField";
import { Money } from "@/components/common/Money";
import { NOTIFICATION_RATE_LIMIT } from "@/config/constants";
import { formatTiyin } from "@/lib/money";
import { newIdempotencyKey } from "@/lib/idempotency";
import { useErrorToast } from "@/lib/query";

const CHANNELS: NotificationChannel[] = ["telegram", "sms", "internal", "email"];

export interface DebtorTarget {
  childId: string;
  childName?: string;
  currentDebt: Tiyin;
}

/** To'lovchi vasiysi aniqlangan bola — xabar shunga ketadi. */
interface ResolvedTarget extends DebtorTarget {
  guardianId?: string;
  guardianName?: string;
}

interface DebtReminderDialogProps {
  targets: DebtorTarget[];
  trigger?: ReactNode;
}

/**
 * Qarz eslatmasi (§7.3) — `debt_reminder` shabloni bilan.
 *
 * Har bir bolaning summasi har xil, `POST /notifications/send` esa bitta
 * `data` obyektini oladi — shuning uchun bolalar bo'yicha ketma-ket
 * yuboriladi. Server tenant bo'yicha daqiqasiga {{NOTIFICATION_RATE_LIMIT}}
 * ta xabar qabul qiladi, shuning uchun bir martada shuncha bola tanlanadi va
 * bu 429 sifatida kutilmaganda chiqmasdan oldindan aytiladi.
 */
export function DebtReminderDialog({ targets, trigger }: DebtReminderDialogProps) {
  const { t } = useTranslation();
  const showError = useErrorToast();

  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<NotificationChannel>("telegram");
  const [resolved, setResolved] = useState<ResolvedTarget[] | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(0);

  /*
    Qarzlar ro'yxatida to'lovchi vasiy yo'q — u bolaning vasiylari ichidan
    `isPayer` bo'yicha topiladi. Vasiysi topilmagan bolalar alohida
    ko'rsatiladi: ular jim qolib ketmasin.
  */
  useEffect(() => {
    if (!open) return;
    let active = true;
    setResolved(null);

    void Promise.all(
      targets.slice(0, NOTIFICATION_RATE_LIMIT).map(async (target) => {
        try {
          const links = await childrenApi.guardians(target.childId);
          const payer = links.find((link) => link.isPayer) ?? links[0];
          return {
            ...target,
            guardianId: payer?.guardianId,
            guardianName: payer?.fullName ?? payer?.guardian?.fullName,
          };
        } catch {
          return { ...target };
        }
      }),
    ).then((rows) => {
      if (active) setResolved(rows);
    });

    return () => {
      active = false;
    };
  }, [open, targets]);

  const reachable = (resolved ?? []).filter((row) => row.guardianId);
  const unreachable = (resolved ?? []).filter((row) => !row.guardianId);
  const skippedByLimit = Math.max(0, targets.length - NOTIFICATION_RATE_LIMIT);

  const send = useCallback(async () => {
    setSending(true);
    setSent(0);
    try {
      for (const row of reachable) {
        await notificationsApi.send(
          {
            templateKey: "debt_reminder",
            channel,
            recipients: [{ guardianId: row.guardianId! }],
            data: {
              childName: row.childName ?? "",
              amount: formatTiyin(row.currentDebt),
            },
            entityId: row.childId,
          },
          // Har bir qabul qiluvchi — alohida amal, alohida kalit.
          newIdempotencyKey(),
        );
        setSent((count) => count + 1);
      }
      setOpen(false);
    } catch (error) {
      // `RATE_LIMITED` ham shu yerga tushadi va o'z tarjimasi bilan chiqadi.
      showError(error);
    } finally {
      setSending(false);
    }
  }, [channel, reachable, showError]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" disabled={targets.length === 0}>
            <BellRing className="mr-2 h-4 w-4" />
            {t("debts.remind.action")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("debts.remind.title")}</DialogTitle>
          <DialogDescription>{t("debts.remind.hint")}</DialogDescription>
        </DialogHeader>

        <SelectField
          label={t("notifications.columns.channel")}
          value={channel}
          onChange={(value) => setChannel(value as NotificationChannel)}
          options={CHANNELS.map((item) => ({
            value: item,
            label: t(`domain.channel.${item}`),
          }))}
        />

        {resolved === null ? (
          <p className="text-sm text-muted-foreground">{t("common.state.loading")}</p>
        ) : (
          <div className="space-y-2 text-sm">
            {/* Sanoq — noto'g'ri auditoriyaga yuborishdan saqlaydigan asosiy narsa. */}
            <p className="font-medium">{t("debts.remind.count", { count: reachable.length })}</p>

            {unreachable.length > 0 ? (
              <div className="rounded-xl border border-st-warn-border bg-st-warn-soft p-3 text-st-warn-fg">
                {t("debts.remind.noPayer", { count: unreachable.length })}
              </div>
            ) : null}

            {skippedByLimit > 0 ? (
              <div className="rounded-xl border border-st-info-border bg-st-info-soft p-3 text-st-info-fg">
                {t("debts.remind.rateLimit", {
                  limit: NOTIFICATION_RATE_LIMIT,
                  skipped: skippedByLimit,
                })}
              </div>
            ) : null}

            <ul className="max-h-48 space-y-1 overflow-auto">
              {reachable.map((row) => (
                <li key={row.childId} className="flex justify-between gap-3">
                  <span className="truncate">
                    {row.childName} · {row.guardianName ?? row.guardianId}
                  </span>
                  <Money value={row.currentDebt} hideCurrency />
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button disabled={sending || reachable.length === 0} onClick={() => void send()}>
            {sending
              ? t("debts.remind.sending", { sent, total: reachable.length })
              : t("common.actions.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
