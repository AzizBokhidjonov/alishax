import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-context";

export function SessionCheck() {
  const { t } = useTranslation();
  const { status, retrySession, cancelSession } = useAuth();
  const failed = status === "error";
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <div role={failed ? "alert" : "status"}>
          <h1 className="text-xl font-semibold">
            {t(failed ? "auth.sessionCheckFailed" : "auth.sessionChecking")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(failed ? "auth.sessionCheckHint" : "auth.sessionWaitHint")}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {failed && (
            <Button onClick={() => void retrySession()}>{t("common.actions.retry")}</Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/kirish" onClick={cancelSession}>
              {t("auth.goToLogin")}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
