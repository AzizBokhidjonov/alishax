import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useErrorToast } from "@/lib/query";
import { downloadFile } from "@/lib/files";

/**
 * Fayl havolasi. Imzolangan URL yo'q — server har so'rovda ruxsatni
 * tekshiradi, shuning uchun fayl autentifikatsiyalangan so'rov bilan
 * olinadi va sun'iy `<a download>` orqali saqlanadi (§4.4).
 */
export function FileLink({
  fileId,
  label,
  fileName,
  size = "sm",
}: {
  fileId?: string | null;
  label?: string;
  /** `Content-Disposition` bo'lmasa ishlatiladigan nom. */
  fileName?: string;
  size?: "sm" | "default";
}) {
  const { t } = useTranslation();
  const showError = useErrorToast();
  const [busy, setBusy] = useState(false);

  if (!fileId) return <span className="text-muted-foreground">—</span>;

  const save = async () => {
    setBusy(true);
    try {
      await downloadFile(fileId, fileName);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size={size} variant="ghost" disabled={busy} onClick={() => void save()}>
      {busy ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-1 h-4 w-4" />
      )}
      {label ?? t("common.actions.download")}
    </Button>
  );
}
