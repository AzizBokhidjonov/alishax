import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { PaymentMethod } from "@/api";
import { isApiError } from "@/api/error";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/forms/FormDialog";
import { paymentSchema, type PaymentFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { isoToLocalInput, localInputToIso } from "@/lib/dates";
import { useClosedPeriod } from "../use-closed-period";
import { toTiyin } from "@/lib/money";
import { useCreatePayment } from "../api";
import type { AllocationMap } from "./PaymentAllocations";
import { validPaymentAllocation } from "../payment-allocation";
import { PaymentReview } from "./PaymentReview";
import { PaymentEntryFields } from "./PaymentEntryFields";
import { PaymentRecovery } from "./PaymentRecovery";
import {
  reservePaymentRecovery,
  completePaymentRecovery,
  claimPaymentAttempt,
  rejectInitialPaymentRecovery,
  usePaymentRecovery,
} from "../payment-recovery-store";

export function PaymentFormDialog(props: { childId?: string; childName?: string }) {
  const recovery = usePaymentRecovery();
  return <PaymentSessionDialog key={recovery.scopeId} {...props} />;
}

function PaymentSessionDialog({ childId, childName }: { childId?: string; childName?: string }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const create = useCreatePayment();
  const recovery = usePaymentRecovery();
  const locked = !!recovery.record || recovery.error;
  const [review, setReview] = useState(false);
  const [selectedName, setSelectedName] = useState(childName ?? "");
  const [payerName, setPayerName] = useState("");
  const [manual, setManual] = useState(false);
  const [allocations, setAllocations] = useState<AllocationMap>({});
  const [chargeLabels, setChargeLabels] = useState<Record<string, string>>({});
  const [retrying, setRetrying] = useState(false);
  const retryLock = useRef(false);
  const allocationList = Object.entries(allocations)
    .filter(([, amount]) => amount.trim() !== "")
    .map(([chargeId, amount]) => ({ chargeId, amountTiyin: toTiyin(amount) }));
  const form = useEntityForm<PaymentFormValues>({
    schema: paymentSchema,
    protectDraft: !locked,
    defaults: () => ({
      childId: childId ?? "",
      amountSom: "",
      method: "cash" as PaymentMethod,
      paidAt: isoToLocalInput(new Date().toISOString()),
    }),
    onSubmit: async (values) => {
      const record = await reservePaymentRecovery(
        {
          childId: values.childId,
          payerGuardianId: values.payerGuardianId,
          amountTiyin: toTiyin(values.amountSom),
          method: values.method,
          paidAt: localInputToIso(values.paidAt),
          receiptNo: values.receiptNo,
          bankRef: values.bankRef,
          attachmentFileId: values.attachmentFileId,
          note: values.note,
          allocations: can(P.chargeRead) && manual ? allocationList : undefined,
        },
        selectedName,
        payerName,
        chargeLabels,
      );
      try {
        await create.mutateAsync(await claimPaymentAttempt(record));
      } catch (error) {
        // Birinchi 422 tekshiruv/rollback natijasi; noaniq urinishdan keyingi 422 bunga kirmaydi.
        if (isApiError(error) && error.status === 422 && error.code === "VALIDATION_FAILED") {
          await rejectInitialPaymentRecovery(record);
          setReview(false);
        }
        throw error;
      }
      await completePaymentRecovery(record);
    },
  });
  const paidDate = (form.form.watch("paidAt") ?? "").slice(0, 10);
  const { closed: periodClosed } = useClosedPeriod(paidDate);
  const validAllocations =
    !manual || validPaymentAllocation(form.form.watch("amountSom"), allocations);
  const retry = async () => {
    if (!recovery.record || retryLock.current || !recovery.enabled || recovery.error) return;
    retryLock.current = true;
    setRetrying(true);
    try {
      await create.mutateAsync(await claimPaymentAttempt(recovery.record));
      await completePaymentRecovery(recovery.record);
      form.form.reset();
      form.setOpen(false);
    } catch {
      /* Asl so'rov saqlanadi; umumiy mutatsiya tarjima qilingan xatoni ko'rsatadi. */
    } finally {
      retryLock.current = false;
      setRetrying(false);
    }
  };
  return (
    <FormDialog
      open={form.open}
      onOpenChange={(next) => {
        if (form.pending || retryLock.current) return;
        if (locked && !next) form.form.reset();
        form.setOpen(next);
        if (next) {
          setReview(false);
          setManual(false);
          setAllocations({});
          setChargeLabels({});
          setPayerName("");
          setSelectedName(childName ?? "");
        }
      }}
      trigger={
        <Button className="h-11">
          <Plus className="mr-2 h-4 w-4" />
          {t("payments.add")}
        </Button>
      }
      title={t("payments.add")}
      onSubmit={
        locked
          ? retry
          : review
            ? form.submit
            : () => {
                void form.form.trigger().then((valid) => {
                  if (valid) setReview(true);
                });
              }
      }
      submitLabel={t(locked ? "recovery.retryPayment" : review ? "flows.record" : "flows.review")}
      footerStart={
        review && !locked ? (
          <Button
            type="button"
            variant="outline"
            disabled={form.pending}
            onClick={() => setReview(false)}
          >
            {t("common.actions.edit")}
          </Button>
        ) : undefined
      }
      canSubmit={
        locked
          ? !!recovery.record && recovery.enabled && !recovery.error
          : form.canSubmit && !periodClosed && validAllocations && recovery.enabled
      }
      pending={form.pending || retrying}
      contentClassName="max-w-lg"
    >
      {locked ? (
        <PaymentRecovery record={recovery.record} error={recovery.error} />
      ) : review ? (
        <PaymentReview
          values={form.form.getValues()}
          childName={selectedName}
          payerName={payerName}
          manual={manual}
          allocations={manual ? allocationList : []}
          chargeLabels={chargeLabels}
        />
      ) : (
        <PaymentEntryFields
          form={form.form}
          childId={childId}
          childName={childName}
          selectedName={selectedName}
          setSelectedName={setSelectedName}
          payerName={payerName}
          setPayerName={setPayerName}
          manual={manual}
          setManual={setManual}
          allocations={allocations}
          setAllocations={setAllocations}
          setChargeLabels={setChargeLabels}
          validAllocations={validAllocations}
        />
      )}
    </FormDialog>
  );
}
