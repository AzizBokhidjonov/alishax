import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { authApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/FormDialog";
import { useErrorToast } from "@/lib/query";
import { focusRing } from "@/lib/utils";

/** `POST /auth/reset-password` — havoladagi kod bilan yangi parol o'rnatiladi. */
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const showError = useErrorToast();

  const tooShort = newPassword.length > 0 && newPassword.length < 10;

  const submit = async () => {
    setPending(true);
    try {
      await authApi.resetPassword({ token: token.trim(), newPassword });
      toast.success(t("auth.passwordChanged"));
      navigate({ to: "/kirish", replace: true });
    } catch (error) {
      showError(error);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Link
          to="/kirish"
          className={`mb-6 inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground ${focusRing}`}
        >
          <ArrowLeft className="h-4 w-4" /> {t("auth.loginTitle")}
        </Link>
        <h1 className="text-2xl font-extrabold">{t("auth.resetTitle")}</h1>

        <div className="mt-6 space-y-4">
          <Field label={t("auth.resetToken")}>
            <Input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="h-11"
              autoComplete="one-time-code"
            />
          </Field>
          {/*
            Xato matni `Field` orqali maydonga `aria-describedby` bilan
            bog'lanadi va maydonga `aria-invalid` qo'yiladi.
          */}
          <Field label={t("auth.newPassword")} error={tooShort ? t("auth.minPassword") : undefined}>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="h-11"
              autoComplete="new-password"
            />
          </Field>
          <Button
            className="h-11 w-full"
            disabled={!token.trim() || newPassword.length < 10 || pending}
            onClick={() => void submit()}
          >
            {t("common.actions.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
