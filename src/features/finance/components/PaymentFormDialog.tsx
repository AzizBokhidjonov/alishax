import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { PaymentMethod } from "@/api";
import { Button } from "@/components/ui/button";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { MoneyInput } from "@/components/common/MoneyInput";
import { ChildPicker, PayerPicker } from "@/components/common/EntityPicker";
import { paymentSchema, type PaymentFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { isoToLocalInput, localInputToIso } from "@/lib/dates";
import { useClosedPeriod } from "../use-closed-period";
import { ClosedPeriodNotice } from "./ClosedPeriodNotice";
import { useIdempotencyKey } from "@/lib/idempotency";
import { toTiyin } from "@/lib/money";
import { useCreatePayment } from "../api";
import { type AllocationMap } from "./PaymentAllocations";
import { DateTimePicker } from "@/components/common/DateField";

import { PaymentOptionalFields } from "./PaymentOptionalFields";
import { PaymentBalance } from "./PaymentBalance";
import { validPaymentAllocation } from "../payment-allocation";
import { PaymentReview } from "./PaymentReview";

const METHODS: PaymentMethod[] = ["cash", "bank", "card", "online", "other"];

export function PaymentFormDialog({
  childId,
  childName,
}: {
  childId?: string;
  childName?: string;
}) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const create = useCreatePayment();
  const idempotency = useIdempotencyKey();
  const [review, setReview] = useState(false);
  const [selectedName, setSelectedName] = useState(childName ?? "");
  const [payerName, setPayerName] = useState("");
  const [manual, setManual] = useState(false);
  const [allocations, setAllocations] = useState<AllocationMap>({});

  const form = useEntityForm<PaymentFormValues>({
    schema: paymentSchema,
    defaults: () => ({
      childId: childId ?? "",
      amountSom: "",
      method: "cash" as PaymentMethod,
      paidAt: isoToLocalInput(new Date().toISOString()),
    }),
    onSubmit: async (values) => {
      const list = Object.entries(allocations)
        .filter(([, amount]) => amount.trim() !== "")
        .map(([chargeId, amount]) => ({ chargeId, amountTiyin: toTiyin(amount) }));

      try {
        await create.mutateAsync({
          dto: {
            childId: values.childId,
            payerGuardianId: values.payerGuardianId,
            amountTiyin: toTiyin(values.amountSom),
            method: values.method,
            paidAt: localInputToIso(values.paidAt),
            receiptNo: values.receiptNo,
            bankRef: values.bankRef,
            attachmentFileId: values.attachmentFileId,
            note: values.note,
            allocations: can(P.chargeRead) && manual && list.length > 0 ? list : undefined,
          },
          idempotencyKey: idempotency.get(),
        });
      } catch (error) {
        setReview(false);
        throw error;
      }
      idempotency.reset();
      setAllocations({});
      setManual(false);
    },
  });

  const { watch, setValue, formState } = form.form;
  // `datetime-local` qiymatining sana qismi davrni aniqlaydi.
  const paidDate = (watch("paidAt") ?? "").slice(0, 10);
  const { closed: periodClosed } = useClosedPeriod(paidDate);
  const error = useFieldError(formState.errors);
  const selectedChild = watch("childId");
  const validAllocations = !manual || validPaymentAllocation(watch("amountSom"), allocations);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={(next) => {
        form.setOpen(next);
        if (next) {
          idempotency.get();
          setReview(false);
          setManual(false);
          setAllocations({});
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
        review
          ? form.submit
          : () => {
              void form.form.trigger().then((valid) => {
                if (valid) setReview(true);
              });
            }
      }
      submitLabel={t(review ? "flows.record" : "flows.review")}
      footerStart={
        review ? (
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
      canSubmit={form.canSubmit && !periodClosed && validAllocations}
      pending={form.pending}
      contentClassName="max-w-lg"
    >
      {review ? (
        <PaymentReview
          values={form.form.getValues()}
          childName={selectedName}
          payerName={payerName}
          manual={manual}
        />
      ) : (
        <div className="space-y-3">
          {childId ? (
            <p className="font-semibold">{childName ?? t("flows.unknownName")}</p>
          ) : (
            <ChildPicker
              permission="payment:create"
              onSelectLabel={setSelectedName}
              selectedLabel={selectedName}
              label={t("payments.form.child")}
              value={selectedChild}
              onChange={(value) => {
                setValue("childId", value, { shouldValidate: true });
                setValue("payerGuardianId", undefined);
                setPayerName("");
                setAllocations({});
                setManual(false);
              }}
              error={error("childId")}
            />
          )}
          <PayerPicker
            label={t("payments.form.payer")}
            onSelectLabel={setPayerName}
            selectedLabel={payerName}
            error={error("payerGuardianId")}
            childId={selectedChild}
            value={watch("payerGuardianId") ?? ""}
            onChange={(value) => setValue("payerGuardianId", value)}
          />

          {can(P.debtRead) ? (
            <PaymentBalance
              childId={selectedChild}
              onUse={(value) => setValue("amountSom", value, { shouldValidate: true })}
            />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <MoneyInput
              label={t("payments.form.amount")}
              value={watch("amountSom")}
              onChange={(value) => setValue("amountSom", value, { shouldValidate: true })}
              error={error("amountSom")}
            />
            <SelectField
              label={t("payments.form.method")}
              value={watch("method")}
              onChange={(value) =>
                setValue("method", value as PaymentMethod, { shouldValidate: true })
              }
              options={METHODS.map((method) => ({
                value: method,
                label: t(`domain.paymentMethod.${method}`),
              }))}
              error={error("method")}
            />
            <Field
              className="sm:col-span-2"
              label={t("payments.form.paidAt")}
              error={error("paidAt")}
            >
              <DateTimePicker
                value={watch("paidAt") ?? ""}
                onChange={(value) => setValue("paidAt", value, { shouldValidate: true })}
              />
            </Field>
            <ClosedPeriodNotice date={paidDate} />
          </div>
          <PaymentOptionalFields
            form={form.form}
            manual={manual}
            setManual={setManual}
            allocations={allocations}
            setAllocations={setAllocations}
          />
          {!validAllocations ? (
            <p role="alert" className="text-sm text-st-danger-fg">
              {t("flows.invalidAllocations")}
            </p>
          ) : null}
        </div>
      )}
    </FormDialog>
  );
}
