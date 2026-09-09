import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ExportResult } from "@/api";
import { runExport } from "@/lib/export";
import { useErrorToast } from "@/lib/query";

/**
 * Eksport uchun yagona kirish nuqtasi (§4.5).
 *
 * `busy` faqat birinchi so'rov davomida yonadi — navbatga tushgan eksport
 * fonda kuzatiladi va sahifani bloklamaydi, foydalanuvchi boshqa joyga
 * o'tishi mumkin.
 */
export function useExport(): {
  start: (
    request: () => Promise<ExportResult>,
    fileName: string,
    mode?: "save" | "open",
  ) => Promise<void>;
  busy: boolean;
} {
  const { t } = useTranslation();
  const showError = useErrorToast();
  const [busy, setBusy] = useState(false);

  const start = useCallback(
    async (request: () => Promise<ExportResult>, fileName: string, mode?: "save" | "open") => {
      setBusy(true);
      try {
        // Matnlar shu yerda tarjima qilinadi: kutish fonda ketadi va
        // komponent yechilgach `t` ga murojaat qilib bo'lmaydi.
        await runExport(
          request,
          fileName,
          {
            pending: t("common.export.pending"),
            ready: t("common.export.ready"),
            failed: t("common.export.failed"),
            download: t("common.actions.download"),
            retry: t("common.actions.retry"),
          },
          mode,
        );
      } catch (error) {
        showError(error);
      } finally {
        setBusy(false);
      }
    },
    [showError, t],
  );

  return { start, busy };
}
