import { useTranslation } from "react-i18next";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { PickupGuardianPicker } from "@/components/common/EntityPicker";
import { FileUploadField } from "@/components/common/FileUploadField";
import { pickupPersonSchema, type PickupPersonFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { todayIso } from "@/lib/dates";
import { useCreatePickupPerson } from "../api";
import { DatePicker } from "@/components/common/DateField";

/** Doimiy yoki muddatli olib ketuvchi qo'shish (B10). */
export function PickupPersonForm({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const create = useCreatePickupPerson(childId);

  const form = useEntityForm<PickupPersonFormValues>({
    schema: pickupPersonSchema,
    defaults: () => ({
      fullName: "",
      permissionType: "permanent" as const,
      validFrom: todayIso(),
    }),
    onSubmit: async (values) => {
      await create.mutateAsync(values);
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);
  const permissionType = watch("permissionType");

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button className="h-11">
          <UserPlus className="mr-2 h-4 w-4" />
          {t("pickup.persons.add")}
        </Button>
      }
      title={t("pickup.persons.add")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
      contentClassName="max-w-lg"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t("pickup.persons.fullName")}
          error={error("fullName")}
          className="sm:col-span-2"
        >
          <Input className="h-11" {...register("fullName")} />
        </Field>
        <Field label={t("pickup.persons.relationship")} error={error("relationship")}>
          <Input className="h-11" {...register("relationship")} />
        </Field>
        <Field label={t("pickup.persons.phone")} error={error("phone")}>
          <Input className="h-11" {...register("phone")} />
        </Field>
        <Field label={t("pickup.persons.idDocType")} error={error("idDocType")}>
          <Input className="h-11" {...register("idDocType")} />
        </Field>
        <Field label={t("pickup.persons.idDocNumber")} error={error("idDocNumber")}>
          <Input className="h-11" {...register("idDocNumber")} />
        </Field>

        <SelectField
          label={t("pickup.persons.permissionType")}
          value={permissionType}
          onChange={(value) =>
            setValue("permissionType", value as PickupPersonFormValues["permissionType"], {
              shouldValidate: true,
            })
          }
          options={[
            { value: "permanent", label: t("domain.permissionType.permanent") },
            { value: "temporary", label: t("domain.permissionType.temporary") },
          ]}
        />
        <Field label={t("pickup.persons.validFrom")} error={error("validFrom")}>
          <DatePicker
            value={watch("validFrom") ?? ""}
            onChange={(value) => setValue("validFrom", value, { shouldValidate: true })}
          />
        </Field>
        {permissionType === "temporary" ? (
          <Field label={t("pickup.persons.validTo")} error={error("validTo")}>
            <DatePicker
              value={watch("validTo") ?? ""}
              onChange={(value) => setValue("validTo", value, { shouldValidate: true })}
            />
          </Field>
        ) : null}

        <div className="sm:col-span-2">
          <PickupGuardianPicker
            childId={childId}
            permission="pickup:manage"
            label={t("pickup.persons.grantedBy")}
            value={watch("grantedByGuardianId") ?? ""}
            onChange={(value) => setValue("grantedByGuardianId", value)}
          />
        </div>

        <div className="sm:col-span-2">
          <FileUploadField
            label={t("pickup.persons.photo")}
            value={watch("photoFileId")}
            onChange={(fileId) => setValue("photoFileId", fileId)}
            entityType="pickup_person"
            entityId={childId}
            accept="image/jpeg,image/png,image/webp"
          />
        </div>

        <Field label={t("pickup.persons.note")} error={error("note")} className="sm:col-span-2">
          <Textarea rows={2} {...register("note")} />
        </Field>
      </div>
    </FormDialog>
  );
}
