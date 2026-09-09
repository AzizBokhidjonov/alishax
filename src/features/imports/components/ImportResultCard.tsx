import { useTranslation } from "react-i18next";
import { AlertTriangle, Download } from "lucide-react";
import type { ImportJob } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface ImportResultCardProps {
  job: ImportJob;
  validRows: number;
  invalidRows: number;
  skipInvalid: boolean;
  onSkipInvalidChange: (value: boolean) => void;
  commitBlocked: boolean;
  busy: boolean;
  onCommit: () => void;
  onExportErrors: () => void;
}

/**
 * Tekshirish natijasi: sanoqlar, qatorlar bo'yicha xatolar va tasdiqlash.
 * Xatoli qatorlarni tashlab ketish ATAYLAB tanlanadi — tasdiq oynasida
 * sonlar aynan yoziladi (§10.4).
 */
export function ImportResultCard({
  job,
  validRows,
  invalidRows,
  skipInvalid,
  onSkipInvalidChange,
  commitBlocked,
  busy,
  onCommit,
  onExportErrors,
}: ImportResultCardProps) {
  const { t } = useTranslation();
  const hasErrors = Boolean(job.errors && job.errors.length > 0);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          {t("imports.rows")}: {job.totalRows ?? "—"} · {t("imports.valid")}: {validRows} ·{" "}
          {t("imports.failed")}: {invalidRows}
        </CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{t(`imports.status.${job.status}`)}</span>
          {invalidRows > 0 ? (
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={skipInvalid} onCheckedChange={onSkipInvalidChange} />
              {t("imports.skipInvalid")}
            </label>
          ) : null}
          {hasErrors ? (
            <Button variant="outline" onClick={onExportErrors}>
              <Download className="mr-2 h-4 w-4" />
              {t("imports.exportErrors")}
            </Button>
          ) : null}
          <ConfirmDialog
            trigger={<Button disabled={busy || commitBlocked}>{t("imports.commit")}</Button>}
            title={t("imports.confirm.title")}
            description={
              skipInvalid && invalidRows > 0
                ? t("imports.confirm.skip", { valid: validRows, invalid: invalidRows })
                : t("imports.confirm.all", { valid: validRows })
            }
            confirmLabel={t("imports.commit")}
            pending={busy}
            onConfirm={onCommit}
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {commitBlocked ? (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-st-warn-border bg-st-warn-soft p-3 text-sm text-st-warn-fg">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {t("imports.confirm.blocked", { invalid: invalidRows })}
          </div>
        ) : null}

        {job.status === "processing" ? (
          <div className="px-4 pt-3 text-sm text-muted-foreground">
            {t("imports.processingHint")}
          </div>
        ) : null}

        {hasErrors ? (
          <>
            <div className="px-4 py-2 text-sm font-medium">{t("imports.errorsTitle")}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("imports.row")}</TableHead>
                  <TableHead>{t("imports.field")}</TableHead>
                  <TableHead>{t("imports.message")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.errors?.map((rowError, index) => (
                  <TableRow key={`${rowError.row}-${index}`}>
                    <TableCell>{rowError.row}</TableCell>
                    <TableCell>{rowError.field ?? "—"}</TableCell>
                    <TableCell>{rowError.message ?? rowError.code ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <div className="px-4 py-3 text-sm text-muted-foreground">{t("imports.noErrors")}</div>
        )}
      </CardContent>
    </Card>
  );
}
