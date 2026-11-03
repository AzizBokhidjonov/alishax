import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";

/** Yopishdan oldin tasdiq; brauzer yangilansa ham saqlanmagan ish haqida ogohlantiradi. */
export function useDraftProtection(
  active: boolean,
  dirty: boolean,
  message = "recovery.discard",
  busy = false,
) {
  const { t } = useTranslation();
  const router = useRouter({ warn: false });
  useEffect(() => {
    if (!active || (!dirty && !busy)) return;
    return router?.history.block({
      blockerFn: () => busy || !window.confirm(t(message)),
      enableBeforeUnload: false,
    });
  }, [router, active, dirty, busy, t, message]);
  useEffect(() => {
    if (!active || (!dirty && !busy)) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [active, dirty, busy]);
  return () => !dirty || window.confirm(t(message));
}
