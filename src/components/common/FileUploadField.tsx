import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { ALLOWED_MIME, MAX_UPLOAD_MB, filesApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useErrorToast } from "@/lib/query";
import { focusRing } from "@/lib/utils";

interface FileUploadFieldProps {
  label?: string;
  value?: string;
  onChange: (fileId: string | undefined) => void;
  entityType?: string;
  entityId?: string;
  accept?: string;
  disabled?: boolean;
}

/**
 * Fayl oqimi: yuklash -> `fileId` -> uni ota yozuvga biriktirish (B20).
 * Cheklovlar server bilan bir xil: {{mb}} MB va MIME ro'yxati.
 */
export function FileUploadField({
  label,
  value,
  onChange,
  entityType,
  entityId,
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  disabled,
}: FileUploadFieldProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  /** Shu seansda yuklangan fayllar — faqat ularni o'chirish mumkin. */
  const uploadedHere = useRef(new Set<string>());
  const [fileName, setFileName] = useState<string | null>(null);
  const showError = useErrorToast();

  const handleSelect = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        toast.error(t("common.file.tooLarge", { mb: MAX_UPLOAD_MB }));
        return;
      }
      if (file.type && !ALLOWED_MIME.includes(file.type)) {
        toast.error(t("common.file.wrongType"));
        return;
      }
      setUploading(true);
      try {
        const uploaded = await filesApi.upload(file, entityId ? entityType : undefined, entityId);
        uploadedHere.current.add(uploaded.fileId);
        onChange(uploaded.fileId);
        setFileName(file.name);
        toast.success(t("common.file.uploaded"));
      } catch (error) {
        showError(error);
      } finally {
        setUploading(false);
      }
    },
    [entityId, entityType, onChange, showError, t],
  );

  /*
    Yuklangan, lekin hali yozuvga biriktirilmagan fayl serverda qolib
    ketmasin: shu seansda yuklangan bo'lsa, o'chirilganda serverdan ham
    olib tashlanadi. Ilgari biriktirilgan faylga tegilmaydi — u boshqa
    yozuvga tegishli bo'lishi mumkin.
  */
  const discard = useCallback(async () => {
    const current = value;
    onChange(undefined);
    setFileName(null);
    if (!current || !uploadedHere.current.has(current)) return;
    uploadedHere.current.delete(current);
    try {
      await filesApi.remove(current);
    } catch {
      // O'chirib bo'lmasa ham forma to'siqsiz davom etadi — bu tozalash amali.
    }
  }, [onChange, value]);

  return (
    <div className="space-y-1">
      {label ? <Label>{label}</Label> : null}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => void handleSelect(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="mr-2 h-4 w-4" />
          {uploading ? t("common.file.uploading") : t("common.actions.upload")}
        </Button>
        {value ? (
          <span className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
            <span className="truncate">{fileName ?? value}</span>
            <button
              type="button"
              className={`rounded-sm text-muted-foreground hover:text-destructive ${focusRing}`}
              onClick={() => void discard()}
              aria-label={t("common.actions.remove")}
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {t("common.file.limits", { mb: MAX_UPLOAD_MB })}
          </span>
        )}
      </div>
    </div>
  );
}
