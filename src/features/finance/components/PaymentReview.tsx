import { useTranslation } from "react-i18next";
import type { PaymentFormValues } from "@/components/forms/schemas";
import { Money } from "@/components/common/Money";
import { addTiyin, subtractTiyin, toTiyin } from "@/lib/money";
import { formatDateTime, localInputToIso } from "@/lib/dates";

export function PaymentReview({
  values,
  childName,
  payerName,
  manual,
  allocations = [],
  chargeLabels = {},
}: {
  values: PaymentFormValues;
  childName: string;
  payerName: string;
  manual: boolean;
  allocations?: { chargeId: string; amountTiyin: string }[];
  chargeLabels?: Record<string, string>;
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
      {manual ? (
        <dl aria-label={t("recovery.allocationReview")} className="space-y-2">
          {allocations.map((item) => (
            <div
              key={item.chargeId}
              className="flex flex-wrap justify-between gap-2 border-b border-border pb-2"
            >
              <dt className="min-w-0 break-words">
                {chargeLabels[item.chargeId] ||
                  t("recovery.chargeReference", { id: item.chargeId })}
              </dt>
              <dd>
                <Money value={item.amountTiyin} />
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-2">
            <dt>{t("payments.form.allocated")}</dt>
            <dd>
              <Money value={addTiyin(...allocations.map((item) => item.amountTiyin))} />
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>{t("payments.form.toAdvance")}</dt>
            <dd>
              <Money
                value={subtractTiyin(
                  toTiyin(values.amountSom),
                  addTiyin(...allocations.map((item) => item.amountTiyin)),
                )}
              />
            </dd>
          </div>
        </dl>
      ) : null}
      {values.note ? <p className="break-words text-sm">{values.note}</p> : null}
    </section>
  );
}
