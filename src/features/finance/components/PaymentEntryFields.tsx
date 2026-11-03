import { useTranslation } from "react-i18next";
import type { UseFormReturn } from "react-hook-form";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import type { PaymentMethod } from "@/api";
import { Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { MoneyInput } from "@/components/common/MoneyInput";
import { ChildPicker, PayerPicker } from "@/components/common/EntityPicker";
import { DateTimePicker } from "@/components/common/DateField";
import type { PaymentFormValues } from "@/components/forms/schemas";
import { useFieldError } from "@/hooks/use-field-error";
import { ClosedPeriodNotice } from "./ClosedPeriodNotice";
import { PaymentBalance } from "./PaymentBalance";
import { PaymentOptionalFields } from "./PaymentOptionalFields";
import type { AllocationMap } from "./PaymentAllocations";

const METHODS: PaymentMethod[] = ["cash", "bank", "card", "online", "other"];
export function PaymentEntryFields({
  form,
  childId,
  childName,
  selectedName,
  setSelectedName,
  payerName,
  setPayerName,
  manual,
  setManual,
  allocations,
  setAllocations,
  setChargeLabels,
  validAllocations,
}: {
  form: UseFormReturn<PaymentFormValues>;
  childId?: string;
  childName?: string;
  selectedName: string;
  setSelectedName: (value: string) => void;
  payerName: string;
  setPayerName: (value: string) => void;
  manual: boolean;
  setManual: (value: boolean) => void;
  allocations: AllocationMap;
  setAllocations: (value: AllocationMap) => void;
  setChargeLabels: (value: Record<string, string>) => void;
  validAllocations: boolean;
}) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { watch, setValue, formState } = form;
  const error = useFieldError(formState.errors);
  const selectedChild = watch("childId");
  const update = { shouldValidate: true, shouldDirty: true };
  return (
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
            setValue("childId", value, update);
            setValue("payerGuardianId", undefined, update);
            setPayerName("");
            setAllocations({});
            setChargeLabels({});
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
        onChange={(value) => setValue("payerGuardianId", value, update)}
      />
      {can(P.debtRead) ? (
        <PaymentBalance
          childId={selectedChild}
          onUse={(value) => setValue("amountSom", value, update)}
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <MoneyInput
          label={t("payments.form.amount")}
          value={watch("amountSom")}
          onChange={(value) => setValue("amountSom", value, update)}
          error={error("amountSom")}
        />
        <SelectField
          label={t("payments.form.method")}
          value={watch("method")}
          onChange={(value) => setValue("method", value as PaymentMethod, update)}
          options={METHODS.map((method) => ({
            value: method,
            label: t(`domain.paymentMethod.${method}`),
          }))}
          error={error("method")}
        />
        <Field className="sm:col-span-2" label={t("payments.form.paidAt")} error={error("paidAt")}>
          <DateTimePicker
            value={watch("paidAt") ?? ""}
            onChange={(value) => setValue("paidAt", value, update)}
          />
        </Field>
        <ClosedPeriodNotice date={(watch("paidAt") ?? "").slice(0, 10)} />
      </div>
      <PaymentOptionalFields
        form={form}
        manual={manual}
        setManual={setManual}
        allocations={allocations}
        setAllocations={setAllocations}
        setChargeLabels={setChargeLabels}
      />
      {!validAllocations ? (
        <p role="alert" className="text-sm text-st-danger-fg">
          {t(
            Object.values(allocations).some((value) => value.trim())
              ? "flows.invalidAllocations"
              : "recovery.manualRequired",
          )}
        </p>
      ) : null}
    </div>
  );
}
