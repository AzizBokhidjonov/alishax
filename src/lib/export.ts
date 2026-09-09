import { toast } from "sonner";
import { openBlob, reportsApi, saveBlob, type ExportResult } from "@/api";
import { EXPORT_POLL_LIMIT, EXPORT_POLL_MS } from "@/config/constants";
import { downloadFile, openFile } from "./files";

/**
 * Asinxron eksport (Dizayn qo'llanmasi §4.5).
 *
 *   GET /reports/... ?format=xlsx
 *     ├─ 200 + fayl   -> darhol saqlanadi
 *     └─ 202 {jobId}  -> `GET /exports/:id` har ~2s so'raladi
 *                        processing -> jarayon toasti ochiq turadi
 *                        ready      -> `downloadUrl` = /files/{id}, u ham
 *                                      autentifikatsiyalangan (§4.4)
 *                        failed     -> xato + qayta urinish tugmasi
 *
 * Kutish komponentda emas, shu modulda ketadi — foydalanuvchi boshqa
 * sahifaga o'tsa ham eksport tayyor bo'lgach toast chiqadi. `sonner`
 * global bo'lgani uchun bu montajga bog'liq emas.
 */

export interface ExportLabels {
  /** «Eksport tayyorlanmoqda…» */
  pending: string;
  /** «Eksport tayyor» */
  ready: string;
  /** «Eksport bajarilmadi» */
  failed: string;
  /** «Yuklab olish» — tayyor toastdagi amal. */
  download: string;
  /** «Qayta urinish» — xato toastdagi amal. */
  retry: string;
}

/**
 * `downloadUrl` ichidan `fileId` ni ajratadi. Havola `/files/{id}` ko'rinishida
 * bo'ladi va u ham himoyalangan — shuning uchun `window.open` emas, `fetch`.
 */
function fileIdFrom(downloadUrl: string): string {
  const match = downloadUrl.match(/\/files\/([^/?#]+)/);
  if (match?.[1]) return match[1];
  // Kutilmagan shakl — oxirgi bo'lakni identifikator deb olamiz.
  return downloadUrl.split("?")[0].split("/").filter(Boolean).pop() ?? downloadUrl;
}

async function pollJob(jobId: string): Promise<string | null> {
  for (let attempt = 0; attempt < EXPORT_POLL_LIMIT; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, EXPORT_POLL_MS));
    const job = await reportsApi.job(jobId);
    if (job.status === "ready" && job.downloadUrl) return job.downloadUrl;
    if (job.status === "failed") return null;
  }
  return null;
}

/**
 * Eksportni boshlaydi va oxirigacha olib boradi.
 *
 * Faylni darhol qaytargan so'rov saqlanadi; navbatga tushgani esa fonda
 * kuzatiladi va tayyor bo'lgach «Yuklab olish» amali bilan toast chiqadi.
 */
export async function runExport(
  request: () => Promise<ExportResult>,
  fileName: string,
  labels: ExportLabels,
  /** `open` — kvitansiya kabi ko'rish uchun mo'ljallangan fayllar uchun. */
  mode: "save" | "open" = "save",
): Promise<void> {
  const result = await request();

  if (result.kind === "file") {
    if (mode === "open") openBlob(result.blob);
    else saveBlob(result.blob, result.fileName ?? fileName);
    toast.success(labels.ready);
    return;
  }

  const toastId = `export-${result.jobId}`;
  toast.loading(labels.pending, { id: toastId, duration: Infinity });

  const retry = () => {
    toast.dismiss(toastId);
    void runExport(request, fileName, labels, mode);
  };

  try {
    const downloadUrl = await pollJob(result.jobId);
    if (!downloadUrl) {
      toast.error(labels.failed, {
        id: toastId,
        duration: 10_000,
        action: { label: labels.retry, onClick: retry },
      });
      return;
    }

    const fileId = fileIdFrom(downloadUrl);
    toast.success(labels.ready, {
      id: toastId,
      duration: 30_000,
      action: {
        label: labels.download,
        onClick: () => void (mode === "open" ? openFile(fileId) : downloadFile(fileId, fileName)),
      },
    });
  } catch {
    toast.error(labels.failed, {
      id: toastId,
      duration: 10_000,
      action: { label: labels.retry, onClick: retry },
    });
  }
}
