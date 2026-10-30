import type { UseFormReturn } from "react-hook-form";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/forms/FormDialog";
import { FileUploadField } from "@/components/common/FileUploadField";
import type { PaymentFormValues } from "@/components/forms/schemas";
import { useFieldError } from "@/hooks/use-field-error";
import { PaymentAllocations, type AllocationMap } from "./PaymentAllocations";

export function PaymentOptionalFields({
  form,
  manual,
  setManual,
  allocations,
  setAllocations,
}: {
  form: UseFormReturn<PaymentFormValues>;
  manual: boolean;
  setManual: (value: boolean) => void;
  allocations: AllocationMap;
  setAllocations: (value: AllocationMap) => void;
}) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { register, watch, setValue, formState } = form;
  const error = useFieldError(formState.errors);
  const selectedChild = watch("childId");
  const allocationId = useId();
  return (
    <details className="rounded-xl border border-border p-3">
      <summary className="cursor-pointer py-1 font-medium">{t("flows.optional")}</summary>
      <div className="space-y-3 pt-3">
        <Field label={t("payments.form.receiptNo")} error={error("receiptNo")}>
          <Input className="h-11" {...register("receiptNo")} />
        </Field>
        <Field label={t("payments.form.bankRef")} error={error("bankRef")}>
          <Input className="h-11" {...register("bankRef")} />
        </Field>

        {can(P.fileManage) ? (
          <FileUploadField
            label={t("payments.form.attachment")}
            value={watch("attachmentFileId")}
            onChange={(fileId) => setValue("attachmentFileId", fileId)}
          />
        ) : null}

        {can(P.chargeRead) ? (
          <div className="space-y-2 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor={allocationId}>{t("payments.form.allocationsTitle")}</Label>
              <Switch id={allocationId} checked={manual} onCheckedChange={setManual} />
            </div>
            {manual && selectedChild ? (
              <PaymentAllocations
                childId={selectedChild}
                amountSom={watch("amountSom")}
                allocations={allocations}
                onChange={setAllocations}
              />
            ) : (
              <p className="text-xs text-muted-foreground">{t("payments.form.allocationsHint")}</p>
            )}
          </div>
        ) : null}

        <Field label={t("payments.form.note")} error={error("note")}>
          <Textarea rows={2} {...register("note")} />
        </Field>
      </div>
    </details>
  );
}
