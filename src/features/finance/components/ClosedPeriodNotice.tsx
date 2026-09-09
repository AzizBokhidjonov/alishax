import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { useClosedPeriod } from "../use-closed-period";

/**
 * Yopiq davr haqidagi ogohlantirish. Nima uchun bloklanganini va kim
 * ocha olishini aytadi — boshi berk ko'cha bo'lmasin (§4.7).
 */
export function ClosedPeriodNotice({ date }: { date?: string }) {
  const { t } = useTranslation();
  const { closed, label } = useClosedPeriod(date);

  if (!closed) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-st-danger-border bg-st-danger-soft p-3 text-sm text-st-danger-fg">
      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{t("periods.closedWall", { period: label })}</span>
    </div>
  );
}
