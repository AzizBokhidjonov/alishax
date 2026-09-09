import { useTranslation } from "react-i18next";
import { RefreshCcw } from "lucide-react";
import type { Child, ChildStatus } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { childStatusSchema, type ChildStatusFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { todayIso } from "@/lib/dates";
import { useSetChildStatus } from "../api";
import { DatePicker } from "@/components/common/DateField";

const STATUSES: ChildStatus[] = [
  "applicant",
  "active",
  "temporarily_absent",
  "suspended",
  "graduated",
  "withdrawn",
  "archived",
];

/** Holat alohida amal orqali o'zgaradi va sabab bilan tarixga yoziladi (B5). */
export function ChildStatusDialog({ child }: { child: Child }) {
  const { t } = useTranslation();
  const setStatus = useSetChildStatus(child.id);

  const form = useEntityForm<ChildStatusFormValues>({
    schema: childStatusSchema,
    defaults: () => ({ status: child.status, effectiveDate: todayIso(), reason: undefined }),
    onSubmit: async (values) => {
      await setStatus.mutateAsync(values);
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button variant="outline" className="h-11">
          <RefreshCcw className="mr-2 h-4 w-4" />
          {t("children.status.change")}
        </Button>
      }
      title={t("children.status.change")}
      submitLabel={t("common.actions.change")}
      description={t("children.status.hint")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <SelectField
          label={t("common.labels.status")}
          value={watch("status")}
          onChange={(value) => setValue("status", value as ChildStatus, { shouldValidate: true })}
          options={STATUSES.map((status) => ({
            value: status,
            label: t(`domain.childStatus.${status}`),
          }))}
          error={error("status")}
        />
        <Field label={t("children.status.effectiveDate")} error={error("effectiveDate")}>
          <DatePicker
            value={watch("effectiveDate") ?? ""}
            onChange={(value) => setValue("effectiveDate", value, { shouldValidate: true })}
          />
        </Field>
        <Field label={t("children.status.reason")} error={error("reason")}>
          <Textarea rows={3} {...register("reason")} />
        </Field>
      </div>
    </FormDialog>
  );
}
