import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
  const showError = useErrorToast();

  const submit = async () => {
    setPending(true);
    try {
      await authApi.forgotPassword(login.trim());
      toast.success(t("auth.forgotSent"));
      setOpen(false);
      setLogin("");
    } catch (error) {
      showError(error);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <DialogDescription>{t("auth.forgotHint")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="forgot-login">{t("auth.loginField")}</Label>
          <Input
            id="forgot-login"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            className="h-11"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button disabled={!login.trim() || pending} onClick={() => void submit()}>
            {t("common.actions.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
