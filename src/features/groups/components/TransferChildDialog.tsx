import { useTranslation } from "react-i18next";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { transferChildSchema, type TransferChildFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { todayIso } from "@/lib/dates";
import { useGroupOptions, useTransferChild } from "../api";
import { DatePicker } from "@/components/common/DateField";

/** Bolani boshqa guruhga ko'chirish — sana va sabab bilan tarixga yoziladi. */
export function TransferChildDialog({
  groupId,
  childId,
  childName,
}: {
  groupId: string;
  childId: string;
  childName: string;
}) {
  const { t } = useTranslation();
  const groups = useGroupOptions();
  const transfer = useTransferChild(groupId);

  const form = useEntityForm<TransferChildFormValues>({
    schema: transferChildSchema,
    defaults: () => ({ childId, toGroupId: "", effectiveDate: todayIso() }),
    onSubmit: async (values) => {
      await transfer.mutateAsync({ dto: values });
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button size="sm" variant="ghost">
          <ArrowRightLeft className="mr-1 h-4 w-4" />
          {t("common.actions.transfer")}
        </Button>
      }
      title={`${t("groups.transfer.title")} — ${childName}`}
      submitLabel={t("common.actions.transfer")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <SelectField
          label={t("groups.transfer.toGroup")}
          value={watch("toGroupId")}
          onChange={(value) => setValue("toGroupId", value, { shouldValidate: true })}
          options={groups.filter((group) => group.value !== groupId)}
          error={error("toGroupId")}
        />
        <Field label={t("groups.assign.effectiveDate")} error={error("effectiveDate")}>
          <DatePicker
            value={watch("effectiveDate") ?? ""}
            onChange={(value) => setValue("effectiveDate", value, { shouldValidate: true })}
          />
        </Field>
        <Field label={t("groups.transfer.reason")} error={error("reason")}>
          <Textarea rows={2} {...register("reason")} />
        </Field>
      </div>
    </FormDialog>
  );
}
