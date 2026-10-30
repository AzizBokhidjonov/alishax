import { useTranslation } from "react-i18next";
import type { PaymentFormValues } from "@/components/forms/schemas";
import { Money } from "@/components/common/Money";
import { toTiyin } from "@/lib/money";
import { formatDateTime, localInputToIso } from "@/lib/dates";

export function PaymentReview({
  values,
  childName,
  payerName,
  manual,
}: {
  values: PaymentFormValues;
  childName: string;
  payerName: string;
  manual: boolean;
}) {
  const { t } = useTranslation();
  const rows = [
    [t("payments.form.child"), childName || t("flows.unknownName")],
    [t("payments.form.payer"), payerName || t("flows.noPayer")],
    [t("payments.form.method"), t(`domain.paymentMethod.${values.method}`)],
    [t("payments.form.paidAt"), formatDateTime(localInputToIso(values.paidAt))],
  ];
  return (
    <section className="space-y-4" aria-label={t("flows.review")}>
      <p className="text-sm text-muted-foreground">{t("flows.reviewHint")}</p>
      <Money value={toTiyin(values.amountSom)} className="text-3xl font-bold" />
      <dl className="space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-wrap justify-between gap-2 border-b border-border pb-2"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="rounded-xl bg-secondary p-3 text-sm">
        {t(manual ? "payments.form.allocationsManual" : "flows.allocationHint")}
      </p>
      {values.note ? <p className="break-words text-sm">{values.note}</p> : null}
    </section>
  );
}
