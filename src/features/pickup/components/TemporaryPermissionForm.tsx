import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { GuardianPicker } from "@/components/common/EntityPicker";
import {
  temporaryPermissionSchema,
  type TemporaryPermissionFormValues,
} from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { todayIso } from "@/lib/dates";
import { useCreateTemporaryPermission, usePickupPersons } from "../api";
import { DatePicker } from "@/components/common/DateField";

/** Muddatli ruxsat: ro'yxatdagi odam yoki bir martalik yangi odam uchun. */
export function TemporaryPermissionForm({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const persons = usePickupPersons(childId);
  const create = useCreateTemporaryPermission(childId);

  const form = useEntityForm<TemporaryPermissionFormValues>({
    schema: temporaryPermissionSchema,
    defaults: () => ({
      childId,
      validFrom: todayIso(),
      validTo: todayIso(),
      reason: "",
    }),
    onSubmit: async (values) => {
      await create.mutateAsync(values);
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);
  const pickupPersonId = watch("pickupPersonId");

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button variant="outline" className="h-11">
          <Clock className="mr-2 h-4 w-4" />
          {t("pickup.temporary.add")}
        </Button>
      }
      title={t("pickup.temporary.title")}
      submitLabel={t("common.actions.grant")}
      description={t("pickup.temporary.hint")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <SelectField
          label={t("pickup.temporary.existingPerson")}
          value={pickupPersonId ?? ""}
          onChange={(value) => setValue("pickupPersonId", value)}
          options={(persons.data ?? []).map((person) => ({
            value: person.id,
            label: person.fullName,
          }))}
        />

        {!pickupPersonId ? (
          <div className="space-y-3 rounded-xl border border-dashed border-border p-3">
            <p className="text-xs text-muted-foreground">{t("pickup.temporary.oneTimePerson")}</p>
            <Field label={t("pickup.persons.fullName")} error={error("fullName")}>
              <Input className="h-11" {...register("fullName")} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("pickup.persons.phone")} error={error("phone")}>
                <Input className="h-11" {...register("phone")} />
              </Field>
              <Field label={t("pickup.persons.idDocNumber")} error={error("idDocNumber")}>
                <Input className="h-11" {...register("idDocNumber")} />
              </Field>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("pickup.persons.validFrom")} error={error("validFrom")}>
            <DatePicker
              value={watch("validFrom") ?? ""}
              onChange={(value) => setValue("validFrom", value, { shouldValidate: true })}
            />
          </Field>
          <Field label={t("pickup.persons.validTo")} error={error("validTo")}>
            <DatePicker
              value={watch("validTo") ?? ""}
              onChange={(value) => setValue("validTo", value, { shouldValidate: true })}
            />
          </Field>
        </div>

        <GuardianPicker
          label={t("pickup.persons.grantedBy")}
          value={watch("grantedByGuardianId") ?? ""}
          onChange={(value) => setValue("grantedByGuardianId", value)}
        />

        <Field label={t("common.labels.reason")} error={error("reason")}>
          <Textarea rows={2} {...register("reason")} />
        </Field>
      </div>
    </FormDialog>
  );
}
