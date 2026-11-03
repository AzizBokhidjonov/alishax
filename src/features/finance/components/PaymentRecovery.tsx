import { useTranslation } from "react-i18next";
import { tiyinToSomInput } from "@/lib/money";
import { isoToLocalInput } from "@/lib/dates";
import type { PaymentRecoveryRecord } from "../payment-recovery-store";
import { PaymentReview } from "./PaymentReview";

export function PaymentRecovery({
  record,
  error,
}: {
  record: PaymentRecoveryRecord | null;
  error: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <p
        role="alert"
        className="rounded-xl border border-st-warn-border bg-st-warn-soft p-3 text-sm text-st-warn-fg"
      >
        {t(error ? "recovery.storageError" : "recovery.paymentPending")}
      </p>
      {record ? (
        <>
          <PaymentReview
            values={{
              ...record.dto,
              amountSom: tiyinToSomInput(record.dto.amountTiyin),
              paidAt: isoToLocalInput(record.dto.paidAt),
            }}
            childName={record.childName}
            payerName={record.payerName}
            manual={!!record.dto.allocations}
            allocations={record.dto.allocations ?? []}
            chargeLabels={record.chargeLabels}
          />
          <p className="text-sm text-muted-foreground">{t("recovery.paymentSavedLocally")}</p>
          <p className="break-all text-xs text-muted-foreground">
            {t("recovery.requestKey")}: {record.key}
          </p>
        </>
      ) : null}
    </div>
  );
}
