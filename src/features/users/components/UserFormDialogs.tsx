import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { User } from "@/api";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/common/SelectField";
import { FormDialog, Field } from "@/components/forms/FormDialog";
import {
  userSchema,
  userUpdateSchema,
  type UserFormValues,
  type UserUpdateFormValues,
} from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { useBranchOptions } from "@/features/settings/api";
import { useCreateUser, useRoles, useUpdateUser } from "../api";

export function UserFormDialog({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
  const branches = useBranchOptions();
  const roles = useRoles();
  const create = useCreateUser();

  const form = useEntityForm<UserFormValues>({
    schema: userSchema,
    defaults: () => ({
      fullName: "",
      phone: "",
      password: "",
      roleId: "",
      branchIds: branches[0] ? [branches[0].value] : [],
    }),
    onSubmit: async (values) => {
      await create.mutateAsync(values);
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={trigger}
      title={t("users.add")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <Field label={t("users.form.fullName")} error={error("fullName")}>
          <Input className="h-11" {...register("fullName")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("users.form.phone")} error={error("phone")}>
            <Input className="h-11" {...register("phone")} />
          </Field>
          <Field label={t("users.form.email")} error={error("email")}>
            <Input className="h-11" {...register("email")} />
          </Field>
          <Field label={t("users.form.username")} error={error("username")}>
            <Input className="h-11" {...register("username")} />
          </Field>
          <Field
            label={t("users.form.password")}
            hint={t("users.form.passwordHint")}
            error={error("password")}
          >
            <Input type="password" className="h-11" {...register("password")} />
          </Field>
        </div>
        <SelectField
          label={t("users.form.role")}
          value={watch("roleId")}
          onChange={(value) => setValue("roleId", value, { shouldValidate: true })}
          options={(roles.data ?? []).map((role) => ({
            value: role.id,
            label: role.nameUz || role.code,
          }))}
          error={error("roleId")}
        />
        <SelectField
          label={t("users.form.branches")}
          value={watch("branchIds")[0] ?? ""}
          onChange={(value) => setValue("branchIds", [value], { shouldValidate: true })}
          options={branches}
          error={error("branchIds")}
        />
      </div>
    </FormDialog>
  );
}

/**
 * Xodim ma'lumotlarini tahrirlash (§10.1).
 *
 * `PATCH /users/:id` faqat shaxsiy maydonlarni oladi: rol va filial alohida
 * boshqariladi (rollar bo'limida), parol esa bo'sh qoldirilsa o'zgarmaydi.
 */
export function UserEditDialog({ user, trigger }: { user: User; trigger: ReactNode }) {
  const { t } = useTranslation();
  const update = useUpdateUser();

  const form = useEntityForm<UserUpdateFormValues>({
    schema: userUpdateSchema,
    defaults: () => ({
      fullName: user.fullName,
      phone: user.phone ?? "",
      email: user.email ?? "",
      language: user.language,
      password: "",
    }),
    onSubmit: async (values) => {
      await update.mutateAsync({
        id: user.id,
        dto: {
          fullName: values.fullName,
          phone: values.phone,
          email: values.email,
          language: values.language,
          password: values.password,
        },
      });
    },
  });

  const { register, watch, setValue, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <FormDialog
      open={form.open}
      onOpenChange={form.setOpen}
      trigger={trigger}
      title={t("users.edit")}
      submitLabel={t("common.actions.save")}
      onSubmit={form.submit}
      canSubmit={form.canSubmit}
      pending={form.pending}
    >
      <div className="space-y-3">
        <Field label={t("users.form.fullName")} error={error("fullName")}>
          <Input className="h-11" {...register("fullName")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("users.form.phone")} error={error("phone")}>
            <Input className="h-11" {...register("phone")} />
          </Field>
          <Field label={t("users.form.email")} error={error("email")}>
            <Input className="h-11" {...register("email")} />
          </Field>
        </div>
        <SelectField
          label={t("common.language.title")}
          value={watch("language") ?? "uz"}
          onChange={(value) => setValue("language", value as "uz" | "ru", { shouldValidate: true })}
          options={[
            { value: "uz", label: t("common.language.uz") },
            { value: "ru", label: t("common.language.ru") },
          ]}
        />
        <Field
          label={t("users.form.newPassword")}
          hint={t("users.form.newPasswordHint")}
          error={error("password")}
        >
          <Input
            type="password"
            className="h-11"
            autoComplete="new-password"
            {...register("password")}
          />
        </Field>
      </div>
    </FormDialog>
  );
}
