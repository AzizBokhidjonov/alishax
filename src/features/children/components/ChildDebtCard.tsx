import { useTranslation } from "react-i18next";
import type { ChildDebt } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/common/Money";
import { DebtReminderDialog } from "@/features/finance/components/DebtReminderDialog";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { addTiyin, toBigInt } from "@/lib/money";

const AGEING = ["notOverdue", "d1_7", "d8_30", "d30plus"] as const;

/** Muddat guruhlari rangi §2.2 jadvalidagidek: yangi qarz sokin, eskisi qizil. */
const AGEING_BAR: Record<(typeof AGEING)[number], string> = {
  notOverdue: "bg-st-neutral-fg",
  d1_7: "bg-st-warn-fg",
  d8_30: "bg-st-warn-fg/80",
  d30plus: "bg-st-danger-fg",
};

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-1.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Money value={value ?? "0"} className="text-sm font-medium" hideCurrency />
    </div>
  );
}

interface ChildDebtCardProps {
  debt: ChildDebt;
  childId: string;
  childName?: string;
}

/**
 * Bolaning qarz kartasi (§7.3).
 *
 * `GET /debts/:childId` oltita ko'rsatkich va muddat bo'yicha taqsimotni
 * qaytaradi — hammasi ko'rsatiladi, aks holda buxgalter «joriy qarz qayerdan
 * chiqdi» degan savolga javob topolmaydi.
 */
export function ChildDebtCard({ debt, childId, childName }: ChildDebtCardProps) {
  const { t } = useTranslation();
  const { can } = usePermissions();

  const ageing = debt.ageing;
  const ageingTotal = ageing
    ? toBigInt(addTiyin(ageing.notOverdue, ageing.d1_7, ageing.d8_30, ageing.d30plus))
    : 0n;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{t("debts.card.title")}</CardTitle>
        {can(P.notificationSend) && toBigInt(debt.currentDebt) > 0n ? (
          <DebtReminderDialog targets={[{ childId, childName, currentDebt: debt.currentDebt }]} />
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <Money value={debt.currentDebt} className="text-2xl font-bold" colored />
        </div>

        <div>
          <Row label={t("debts.card.currentCharge")} value={debt.currentCharge} />
          <Row label={t("debts.card.previousDebt")} value={debt.previousDebt} />
          <Row label={t("debts.card.totalPaid")} value={debt.totalPaid} />
          <Row label={t("debts.card.advanceBalance")} value={debt.advanceBalance} />
          <Row label={t("debts.card.overdueAmount")} value={debt.overdueAmount} />
        </div>

        {ageing && ageingTotal > 0n ? (
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">{t("debts.card.ageing")}</div>
            <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
              {AGEING.map((bucket) => {
                const part = toBigInt(ageing[bucket]);
                if (part <= 0n) return null;
                // Foizni butun sonlarda hisoblaymiz — pul float'ga o'tmaydi.
                const percent = Number((part * 1000n) / ageingTotal) / 10;
                return (
                  <div
                    key={bucket}
                    className={AGEING_BAR[bucket]}
                    style={{ width: `${percent}%` }}
                    title={t(`domain.ageing.${bucket}`)}
                  />
                );
              })}
            </div>
            <ul className="space-y-0.5 text-xs">
              {AGEING.filter((bucket) => toBigInt(ageing[bucket]) > 0n).map((bucket) => (
                <li key={bucket} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${AGEING_BAR[bucket]}`} />
                    {t(`domain.ageing.${bucket}`)}
                  </span>
                  <Money value={ageing[bucket]} hideCurrency />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
