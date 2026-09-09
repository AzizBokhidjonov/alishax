import { useTranslation } from "react-i18next";
import { PenLine } from "lucide-react";
import type { CorrectableField } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import {
  attendanceCorrectionSchema,
  type AttendanceCorrectionFormValues,
} from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { useCorrectAttendance } from "../api";

const FIELDS: CorrectableField[] = ["status", "checkInAt", "checkOutAt", "pickupPersonId"];

/** Tuzatish audit qilinadi va sabab kamida 10 belgidan iborat bo'lishi shart. */
export function CorrectionDialog({ attendanceId }: { attendanceId: string }) {
  const { t } = useTranslation();
  const correct = useCorrectAttendance();

  const form = useEntityForm<AttendanceCorrectionFormValues>({
    schema: attendanceCorrectionSchema,
    defaults: () => ({ field: "status" as CorrectableField, newValue: "", reason: "" }),
    onSubmit: async (values) => {
      await correct.mutateAsync({ id: attendanceId, dto: values });
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
          <PenLine className="mr-1 h-4 w-4" />
          {t("attendance.corrections.add")}
        </Button>
      }
      title={t("attendance.corrections.add")}
      submitLabel={t("common.actions.save")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <SelectField
          label={t("attendance.corrections.field")}
          value={watch("field")}
          onChange={(value) =>
            setValue("field", value as CorrectableField, { shouldValidate: true })
          }
          options={FIELDS.map((field) => ({
            value: field,
            label: t(`attendance.corrections.fields.${field}`),
          }))}
          error={error("field")}
        />
        <Field label={t("attendance.corrections.newValue")} error={error("newValue")}>
          <Input className="h-11" {...register("newValue")} />
        </Field>
        <Field label={t("attendance.corrections.reason")} error={error("reason")}>
          <Textarea rows={3} {...register("reason")} />
        </Field>
      </div>
    </FormDialog>
  );
}
