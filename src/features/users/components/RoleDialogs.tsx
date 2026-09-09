import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Copy } from "lucide-react";
import type { Role } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import { roleSchema, type RoleFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { useCloneRole, useCreateRole, useUpdateRole } from "../api";

export function RoleFormDialog({ role, trigger }: { role?: Role; trigger: ReactNode }) {
  const { t } = useTranslation();
  const create = useCreateRole();
  const update = useUpdateRole();

  const form = useEntityForm<RoleFormValues>({
    schema: roleSchema,
    entity: role
      ? {
          code: role.code,
          nameUz: role.nameUz,
          nameRu: role.nameRu,
          description: role.description,
        }
      : null,
    defaults: () => ({ code: "", nameUz: "", nameRu: "" }),
    onSubmit: async (values) => {
      if (role) {
        await update.mutateAsync({
          id: role.id,
          dto: {
            nameUz: values.nameUz,
            nameRu: values.nameRu,
            description: values.description,
          },
        });
      } else {
        await create.mutateAsync({ ...values, permissions: [] });
      }
    },
  });

  const { register, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={trigger}
      title={role ? t("roles.edit") : t("roles.add")}
      isEditing={form.isEditing}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <Field label={t("roles.form.code")} error={error("code")}>
          <Input className="h-11" disabled={Boolean(role)} {...register("code")} />
        </Field>
        <Field label={t("roles.form.nameUz")} error={error("nameUz")}>
          <Input className="h-11" {...register("nameUz")} />
        </Field>
        <Field label={t("roles.form.nameRu")} error={error("nameRu")}>
          <Input className="h-11" {...register("nameRu")} />
        </Field>
        <Field label={t("roles.form.description")} error={error("description")}>
          <Textarea rows={2} {...register("description")} />
        </Field>
      </div>
    </FormDialog>
  );
}

export function CloneRoleDialog({ role }: { role: Role }) {
  const { t } = useTranslation();
  const clone = useCloneRole();

  const form = useEntityForm<RoleFormValues>({
    schema: roleSchema,
    defaults: () => ({
      code: `${role.code}_copy`,
      nameUz: `${role.nameUz} (copy)`,
      nameRu: `${role.nameRu} (copy)`,
    }),
    onSubmit: async (values) => {
      await clone.mutateAsync({
        id: role.id,
        dto: { code: values.code, nameUz: values.nameUz, nameRu: values.nameRu },
      });
    },
  });

  const { register, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button size="sm" variant="ghost">
          <Copy className="mr-1 h-4 w-4" />
          {t("roles.clone.action")}
        </Button>
      }
      title={t("roles.clone.title")}
      submitLabel={t("common.actions.copy")}
      description={t("roles.clone.hint")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <Field label={t("roles.form.code")} error={error("code")}>
          <Input className="h-11" {...register("code")} />
        </Field>
        <Field label={t("roles.form.nameUz")} error={error("nameUz")}>
          <Input className="h-11" {...register("nameUz")} />
        </Field>
        <Field label={t("roles.form.nameRu")} error={error("nameRu")}>
          <Input className="h-11" {...register("nameRu")} />
        </Field>
      </div>
    </FormDialog>
  );
}
