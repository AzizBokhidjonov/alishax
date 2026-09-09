import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { Scope } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/common/SelectField";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import {
  assignRoleSchema,
  overrideSchema,
  type AssignRoleFormValues,
  type OverrideFormValues,
} from "@/components/forms/schemas";
import { roleLabelKey } from "@/config/permissions";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { useBranchOptions } from "@/features/settings/api";
import { useAssignUserRole, useRoles, useSetOverride } from "../api";
import { DatePicker } from "@/components/common/DateField";

const SCOPES: Scope[] = ["all", "branch", "own_group", "today", "self"];

export function AssignRoleDialog({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const roles = useRoles();
  const branches = useBranchOptions();
  const assign = useAssignUserRole(userId);

  const form = useEntityForm<AssignRoleFormValues>({
    schema: assignRoleSchema,
    defaults: () => ({ roleId: "" }),
    onSubmit: async (values) => {
      await assign.mutateAsync(values);
    },
  });

  const { watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          {t("users.roles.add")}
        </Button>
      }
      title={t("users.roles.title")}
      submitLabel={t("common.actions.assign")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <SelectField
          label={t("users.roles.role")}
          value={watch("roleId")}
          onChange={(value) => setValue("roleId", value, { shouldValidate: true })}
          options={(roles.data ?? []).map((role) => ({
            value: role.id,
            label: t(roleLabelKey(role.code), { defaultValue: role.nameUz || role.code }),
          }))}
          error={error("roleId")}
        />
        <SelectField
          label={t("users.roles.branch")}
          value={watch("branchId") ?? ""}
          onChange={(value) => setValue("branchId", value)}
          options={branches}
        />
      </div>
    </FormDialog>
  );
}

export function OverrideDialog({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const setOverride = useSetOverride(userId);

  const form = useEntityForm<OverrideFormValues>({
    schema: overrideSchema,
    defaults: () => ({
      key: "",
      scope: "all" as Scope,
      effect: "grant" as const,
      reason: "",
    }),
    onSubmit: async (values) => {
      await setOverride.mutateAsync(values);
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          {t("users.overrides.add")}
        </Button>
      }
      title={t("users.overrides.add")}
      submitLabel={t("common.actions.save")}
      description={t("users.overrides.hint")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <Field label={t("users.overrides.key")} error={error("key")}>
          <Input className="h-11" placeholder="child:read" {...register("key")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label={t("users.overrides.scope")}
            value={watch("scope")}
            onChange={(value) => setValue("scope", value as Scope, { shouldValidate: true })}
            options={SCOPES.map((scope) => ({
              value: scope,
              label: t(`domain.scopes.${scope}`),
            }))}
          />
          <SelectField
            label={t("users.overrides.effect")}
            value={watch("effect")}
            onChange={(value) =>
              setValue("effect", value as OverrideFormValues["effect"], { shouldValidate: true })
            }
            options={[
              { value: "grant", label: t("users.overrides.grant") },
              { value: "deny", label: t("users.overrides.deny") },
            ]}
          />
        </div>
        <Field label={t("users.overrides.validUntil")} error={error("validUntil")}>
          <DatePicker
            value={watch("validUntil") ?? ""}
            onChange={(value) => setValue("validUntil", value, { shouldValidate: true })}
          />
        </Field>
        <Field label={t("users.overrides.reason")} error={error("reason")}>
          <Textarea rows={2} {...register("reason")} />
        </Field>
      </div>
    </FormDialog>
  );
}
