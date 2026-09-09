import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Group } from "@/api";
import { Input } from "@/components/ui/input";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { SelectField } from "@/components/common/SelectField";
import { groupSchema, type GroupFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { useBranchOptions } from "@/features/settings/api";
import { useCreateGroup, useUpdateGroup } from "../api";
import { TimeInput } from "@/components/common/DateField";

export function GroupFormDialog({ group, trigger }: { group?: Group; trigger: ReactNode }) {
  const { t } = useTranslation();
  const branches = useBranchOptions();
  const create = useCreateGroup();
  const update = useUpdateGroup();

  const form = useEntityForm<GroupFormValues>({
    schema: groupSchema,
    entity: group
      ? {
          branchId: group.branchId,
          name: group.name,
          ageMinMonths: group.ageMinMonths,
          ageMaxMonths: group.ageMaxMonths,
          capacity: group.capacity,
          open: group.workingHours?.open,
          close: group.workingHours?.close,
          status: group.status,
        }
      : null,
    defaults: () => ({
      branchId: branches[0]?.value ?? "",
      name: "",
      capacity: 20,
    }),
    onSubmit: async (values) => {
      const dto = {
        branchId: values.branchId,
        name: values.name,
        ageMinMonths: values.ageMinMonths,
        ageMaxMonths: values.ageMaxMonths,
        capacity: values.capacity,
        workingHours:
          values.open && values.close ? { open: values.open, close: values.close } : undefined,
      };
      if (group) await update.mutateAsync({ id: group.id, dto: { ...dto, status: values.status } });
      else await create.mutateAsync(dto);
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={trigger}
      title={group ? t("groups.edit") : t("groups.add")}
      isEditing={form.isEditing}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label={t("groups.form.branch")}
          value={watch("branchId")}
          onChange={(value) => setValue("branchId", value, { shouldValidate: true })}
          options={branches}
          error={error("branchId")}
          className="sm:col-span-2"
        />
        <Field label={t("groups.form.name")} error={error("name")} className="sm:col-span-2">
          <Input className="h-11" {...register("name")} />
        </Field>
        <Field label={t("groups.form.ageMinMonths")} error={error("ageMinMonths")}>
          <Input type="number" className="h-11" {...register("ageMinMonths")} />
        </Field>
        <Field label={t("groups.form.ageMaxMonths")} error={error("ageMaxMonths")}>
          <Input type="number" className="h-11" {...register("ageMaxMonths")} />
        </Field>
        <Field label={t("groups.form.capacity")} error={error("capacity")}>
          <Input type="number" className="h-11" {...register("capacity")} />
        </Field>
        {group ? (
          <SelectField
            label={t("groups.form.status")}
            value={watch("status") ?? "active"}
            onChange={(value) => setValue("status", value as GroupFormValues["status"])}
            options={[
              { value: "active", label: t("settings.branches.active") },
              { value: "archived", label: t("domain.childStatus.archived") },
            ]}
          />
        ) : null}
        <Field label={t("groups.form.workingHoursOpen")} error={error("open")}>
          <TimeInput
            value={watch("open") ?? ""}
            onChange={(value) => setValue("open", value, { shouldValidate: true })}
          />
        </Field>
        <Field label={t("groups.form.workingHoursClose")} error={error("close")}>
          <TimeInput
            value={watch("close") ?? ""}
            onChange={(value) => setValue("close", value, { shouldValidate: true })}
          />
        </Field>
      </div>
    </FormDialog>
  );
}
