import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useErrorToast } from "@/lib/query";

/** Parolni tiklash so'rovi. Javob har doim bir xil — hisob borligi oshkor qilinmaydi. */
export function ForgotPasswordDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const busy = useRef(false);
  const showError = useErrorToast();

  const submit = async () => {
    if (busy.current || !login.trim()) return;
    busy.current = true;
    setPending(true);
    try {
      await authApi.forgotPassword(login.trim());
      setSent(true);
      setLogin("");
    } catch (error) {
      showError(error);
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSent(false);
      }}
    >
      <DialogTrigger asChild>
        {/*
          `link` varianti matnni `text-primary` qiladi. Ilgari ustidan
          `text-muted-foreground` yozilgan edi va ikkala ko'rsatma bir-birini
          bekor qilardi — parolni tiklash muhim amal, u ko'rinib tursin.
        */}
        <Button variant="link">{t("auth.forgot")}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("auth.forgotTitle")}</DialogTitle>
          <DialogDescription>{t(sent ? "auth.forgotSent" : "auth.forgotHint")}</DialogDescription>
        </DialogHeader>
        {!sent && (
          <div className="space-y-2">
            <Label htmlFor="forgot-login">{t("auth.loginField")}</Label>
            <Input
              id="forgot-login"
              value={login}
              disabled={pending}
              onChange={(event) => setLogin(event.target.value)}
              className="h-11"
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.actions.cancel")}
          </Button>
          {sent ? (
            <Button asChild>
              <Link to="/parolni-tiklash">{t("auth.enterResetCode")}</Link>
            </Button>
          ) : (
            <Button disabled={!login.trim() || pending} onClick={() => void submit()}>
              {t("common.actions.send")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
