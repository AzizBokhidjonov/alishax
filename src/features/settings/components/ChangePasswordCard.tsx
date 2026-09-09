import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { authApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/FormDialog";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/components/forms/schemas";
import { useEntityForm } from "@/hooks/use-entity-form";
import { useFieldError } from "@/hooks/use-field-error";
import { useErrorToast } from "@/lib/query";

/** O'z parolini almashtirish (`POST /auth/change-password`). */
export function ChangePasswordCard() {
  const { t } = useTranslation();
  const showError = useErrorToast();

  const form = useEntityForm<ChangePasswordFormValues>({
    schema: changePasswordSchema,
    defaults: () => ({ currentPassword: "", newPassword: "" }),
    onSubmit: async (values) => {
      try {
        await authApi.changePassword(values);
        toast.success(t("auth.passwordChanged"));
        form.form.reset({ currentPassword: "", newPassword: "" });
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  const { register, formState } = form.form;
  const error = useFieldError(formState.errors);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-base">{t("auth.changePassword")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label={t("auth.currentPassword")} error={error("currentPassword")}>
          <Input type="password" className="h-11" {...register("currentPassword")} />
        </Field>
        <Field
          label={t("auth.newPassword")}
          hint={t("auth.minPassword")}
          error={error("newPassword")}
        >
          <Input type="password" className="h-11" {...register("newPassword")} />
        </Field>
        <div className="flex justify-end">
          <Button className="h-11" disabled={!form.canSubmit} onClick={() => form.submit()}>
            {t("common.actions.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
