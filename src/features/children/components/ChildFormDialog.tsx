import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Child } from "@/api";
import { FormDialog } from "@/components/forms/FormDialog";
import { childSchema, type ChildFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { todayIso } from "@/lib/dates";
import { useBranchOptions } from "@/features/settings/api";
import { useCreateChild, useUpdateChild } from "../api";
import { ChildFormFields } from "./ChildFormFields";

interface ChildFormDialogProps {
  child?: Child;
  trigger: ReactNode;
}

export function ChildFormDialog({ child, trigger }: ChildFormDialogProps) {
  const { t } = useTranslation();
  const branches = useBranchOptions();
  const create = useCreateChild();
  const update = useUpdateChild();

  const entity = useMemo<Partial<ChildFormValues> | null>(
    () =>
      child
        ? {
            branchId: child.branchId,
            firstName: child.firstName,
            lastName: child.lastName,
            middleName: child.middleName,
            birthDate: child.birthDate?.slice(0, 10),
            gender: child.gender,
            address: child.address,
            enrollmentDate: child.enrollmentDate?.slice(0, 10),
            contractNumber: child.contractNumber,
            registrationNumber: child.registrationNumber,
            note: child.note,
          }
        : null,
    [child],
  );

  const form = useEntityForm<ChildFormValues>({
    schema: childSchema,
    entity,
    defaults: () => ({
      branchId: branches[0]?.value ?? "",
      firstName: "",
      lastName: "",
      birthDate: "",
      enrollmentDate: todayIso(),
    }),
    onSubmit: async (values) => {
      if (child) await update.mutateAsync({ id: child.id, dto: values });
      else await create.mutateAsync(values);
    },
  });

  const { formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={trigger}
      title={child ? t("children.edit") : t("children.add")}
      isEditing={form.isEditing}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
      contentClassName="max-w-lg"
    >
      <ChildFormFields form={form.form} error={error} branches={branches} />
    </FormDialog>
  );
}
