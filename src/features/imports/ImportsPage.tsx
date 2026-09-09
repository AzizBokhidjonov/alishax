import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle, Download, Upload } from "lucide-react";
import { importsApi, saveBlob, type ImportEntity, type ImportJob } from "@/api";
import { IMPORT_POLL_LIMIT, IMPORT_POLL_MS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterBar } from "@/components/common/FilterBar";
import { SelectField } from "@/components/common/SelectField";
import { ImportResultCard } from "./components/ImportResultCard";
import { useExport } from "@/hooks/use-export";
import { useErrorToast } from "@/lib/query";

const ENTITIES: ImportEntity[] = [
  "children",
  "guardians",
  "groups",
  "users",
  "opening_balances",
  "expenses",
];

/**
 * Import ustasi (B21): shablon → tekshirish (qatorlar bo'yicha xatolar) →
 * tasdiqlash. `opening_balances` qarzdorlikni shakllantiradi — alohida
 * ogohlantirish ko'rsatiladi.
 */
export function ImportsPage() {
  const { t } = useTranslation();
  const showError = useErrorToast();
  const exporter = useExport();
  const fileRef = useRef<HTMLInputElement>(null);

  const [entity, setEntity] = useState<ImportEntity>("children");
  const [job, setJob] = useState<ImportJob | null>(null);
  const [skipInvalid, setSkipInvalid] = useState(false);
  const [busy, setBusy] = useState(false);

  /*
    Xatoli qatorlar bo'lsa, ularni tashlab ketish ATAYLAB tanlanishi kerak:
    aks holda tasdiqlash to'siladi va nima uchunligi aytiladi.
  */
  const invalidRows = job?.failed ?? job?.errors?.length ?? 0;
  const validRows = Math.max(0, (job?.totalRows ?? 0) - invalidRows);
  const commitBlocked = invalidRows > 0 && !skipInvalid;

  const downloadTemplate = () =>
    exporter.start(() => importsApi.downloadTemplate(entity), `${entity}-template.xlsx`);

  const validate = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const result = await importsApi.validate(entity, file);
      setJob(result);
      toast.success(t("imports.validated"));
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  /*
    Katta faylda tasdiqlash bir zumda tugamaydi: server `processing`
    qaytaradi va natija keyin tayyor bo'ladi. Shuning uchun `GET /imports/:id`
    holat `completed` yoki `failed` bo'lguncha so'raladi (B21) — aks holda
    «bajarildi» deb aytilardi-yu, aslida ish davom etardi.
  */
  const waitForJob = async (id: string) => {
    for (let attempt = 0; attempt < IMPORT_POLL_LIMIT; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, IMPORT_POLL_MS));
      const next = await importsApi.get(id);
      setJob(next);
      if (next.status === "completed" || next.status === "failed") return next;
    }
    return null;
  };

  const commit = async () => {
    if (!job) return;
    setBusy(true);
    try {
      const result = await importsApi.commit(job.id, skipInvalid);
      setJob(result);
      const finished =
        result.status === "processing" ? await waitForJob(result.id ?? job.id) : result;
      if (finished?.status === "failed") toast.error(t("imports.status.failed"));
      else toast.success(t("imports.committed"));
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  /** Xatolarni CSV qilib beradi — odamlar ularni Excelda tuzatadi (§10.4). */
  const exportErrors = () => {
    if (!job?.errors?.length) return;
    const header = [t("imports.row"), t("imports.field"), t("imports.message")];
    const rows = job.errors.map((e) => [String(e.row), e.field ?? "", e.message ?? e.code ?? ""]);
    const csv = [header, ...rows]
      .map((cells) => cells.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    // BOM — Excel CSV ni UTF-8 deb tanishi uchun.
    saveBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), `${entity}-errors.csv`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("imports.title")} subtitle={t("imports.subtitle")} />

      <FilterBar>
        <SelectField
          label={t("imports.entity")}
          value={entity}
          onChange={(value) => {
            setEntity(value as ImportEntity);
            setJob(null);
          }}
          options={ENTITIES.map((item) => ({
            value: item,
            label: t(`domain.importEntity.${item}`),
          }))}
          triggerClassName="w-48"
        />
        <Button
          variant="outline"
          className="h-11"
          disabled={busy}
          onClick={() => void downloadTemplate()}
        >
          <Download className="mr-2 h-4 w-4" />
          {t("imports.downloadTemplate")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(event) => void validate(event.target.files?.[0])}
        />
        <Button className="h-11" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {t("imports.validate")}
        </Button>
      </FilterBar>

      {entity === "opening_balances" ? (
        <div className="flex items-center gap-2 rounded-xl border border-st-warn-border bg-st-warn-soft p-3 text-sm text-st-warn-fg">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t("imports.openingBalancesWarning")}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">{t("imports.steps.template")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">{t("imports.steps.upload")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">{t("imports.steps.commit")}</div>
          </CardContent>
        </Card>
      </div>

      {job ? (
        <ImportResultCard
          job={job}
          validRows={validRows}
          invalidRows={invalidRows}
          skipInvalid={skipInvalid}
          onSkipInvalidChange={setSkipInvalid}
          commitBlocked={commitBlocked}
          busy={busy}
          onCommit={() => void commit()}
          onExportErrors={exportErrors}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{t("imports.empty")}</p>
      )}
    </div>
  );
}
