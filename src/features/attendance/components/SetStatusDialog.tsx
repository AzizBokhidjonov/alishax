import { useTranslation } from "react-i18next";
import { CalendarX } from "lucide-react";
import type { AbsenceStatus } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { ChildPicker } from "@/components/common/EntityPicker";
import {
  attendanceStatusSchema,
  type AttendanceStatusFormValues,
} from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { todayIso } from "@/lib/dates";
import { useSetAttendanceStatus } from "../api";
import { DatePicker } from "@/components/common/DateField";

const STATUSES: AbsenceStatus[] = ["absent", "sick", "vacation", "excused"];

/** Kelmagan bolaga sabab qo'yish (`POST /attendance/status`). */
export function SetStatusDialog({
  childId,
  date,
  trigger,
}: {
  childId?: string;
  date?: string;
  trigger?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const setStatus = useSetAttendanceStatus();

  const form = useEntityForm<AttendanceStatusFormValues>({
    schema: attendanceStatusSchema,
    defaults: () => ({
      childId: childId ?? "",
      date: date ?? todayIso(),
      status: "absent" as AbsenceStatus,
    }),
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
        trigger ?? (
          <Button variant="outline" className="h-11">
            <CalendarX className="mr-2 h-4 w-4" />
            {t("attendance.setStatus")}
          </Button>
        )
      }
      title={t("attendance.setStatus")}
      submitLabel={t("common.actions.save")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        {childId ? null : (
          <ChildPicker
            label={t("common.labels.child")}
            value={watch("childId")}
            onChange={(value) => setValue("childId", value, { shouldValidate: true })}
            error={error("childId")}
          />
        )}
        <Field label={t("common.labels.date")} error={error("date")}>
          <DatePicker
            value={watch("date") ?? ""}
            onChange={(value) => setValue("date", value, { shouldValidate: true })}
          />
        </Field>
        <SelectField
          label={t("common.labels.status")}
          value={watch("status")}
          onChange={(value) => setValue("status", value as AbsenceStatus, { shouldValidate: true })}
          options={STATUSES.map((status) => ({
            value: status,
            label: t(`domain.attendanceStatus.${status}`),
          }))}
          error={error("status")}
        />
        <Field label={t("common.labels.note")} error={error("note")}>
          <Textarea rows={2} {...register("note")} />
        </Field>
      </div>
    </FormDialog>
  );
}
