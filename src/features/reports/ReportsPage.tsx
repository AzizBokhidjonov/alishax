import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileSpreadsheet, Play } from "lucide-react";
import { reportsApi } from "@/api";
import type { QueryParams } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateField } from "@/components/common/DateField";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { useGroupOptions } from "@/features/groups/api";
import { usePeriods } from "@/features/finance/api";
import { useExport } from "@/hooks/use-export";
import { useErrorToast } from "@/lib/query";
import { addDays, currentPeriod, periodLabel, todayIso } from "@/lib/dates";
import { REPORTS, type ReportDef } from "./constants";

const PAYMENT_METHODS = ["cash", "bank", "card", "online", "other"] as const;
import { ReportPicker } from "./components/ReportPicker";
import { ReportTable, type ReportRow } from "./components/ReportTable";

/**
 * Hisobotlar (B17). `format=json` inline jadval; `xlsx`/`pdf` katta natijada
 * `202 { jobId }` qaytaradi — shunda `GET /exports/:id` tayyor bo'lguncha
 * so'raladi.
 */
export function ReportsPage() {
  const { t } = useTranslation();
  const groups = useGroupOptions();
  const showError = useErrorToast();
  const exporter = useExport();
  const period = currentPeriod();
  const periods = usePeriods();

  const [selected, setSelected] = useState<ReportDef>(REPORTS[0]);
  const [from, setFrom] = useState(addDays(todayIso(), -30));
  const [to, setTo] = useState(todayIso());
  const [date, setDate] = useState(todayIso());
  const [groupId, setGroupId] = useState("all");
  const [year, setYear] = useState(period.year);
  const [month, setMonth] = useState(period.month);
  const [periodId, setPeriodId] = useState("");
  const [method, setMethod] = useState("all");
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [busy, setBusy] = useState(false);

  const buildParams = useCallback(() => {
    const params: QueryParams = {};
    if (selected.filters.includes("range")) {
      params.from = from;
      params.to = to;
    }
    if (selected.filters.includes("date")) params.date = date;
    if (selected.filters.includes("month")) {
      params.year = year;
      params.month = month;
    }
    if (selected.filters.includes("group") && groupId !== "all") params.groupId = groupId;
    // `finance/charges` yil/oy emas, DAVR IDENTIFIKATORINI so'raydi.
    if (selected.filters.includes("period")) params.periodId = periodId;
    if (selected.filters.includes("method") && method !== "all") params.method = method;
    return params;
  }, [selected, from, to, date, year, month, groupId, periodId, method]);

  const run = async () => {
    setBusy(true);
    try {
      const result = await reportsApi.json<ReportRow[] | { data?: ReportRow[] }>(
        selected.path,
        buildParams(),
      );
      setRows(Array.isArray(result) ? result : (result?.data ?? []));
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  /*
    Eksport `useExport` orqali ketadi (§4.5): navbatga tushgan fayl fonda
    kuzatiladi, foydalanuvchi boshqa sahifaga o'tsa ham tayyor bo'lgach
    «Yuklab olish» amali bilan toast chiqadi.
  */
  const download = (format: "xlsx" | "pdf") =>
    exporter.start(
      () => reportsApi.export(selected.path, format, buildParams()),
      `${selected.path.replace("/", "-")}.${format}`,
    );

  return (
    <div className="space-y-6">
      <PageHeader title={t("reports.title")} />

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <ReportPicker
          selected={selected}
          onSelect={(report) => {
            setSelected(report);
            setRows(null);
          }}
        />

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("reports.filters")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              {selected.filters.includes("range") ? (
                <>
                  <DateField
                    label={t("common.labels.dateFrom")}
                    value={from}
                    onChange={setFrom}
                    clearable={false}
                    fieldClassName="w-48"
                  />
                  <DateField
                    label={t("common.labels.dateTo")}
                    value={to}
                    onChange={setTo}
                    min={from}
                    clearable={false}
                    fieldClassName="w-48"
                  />
                </>
              ) : null}

              {selected.filters.includes("date") ? (
                <DateField
                  label={t("common.labels.date")}
                  value={date}
                  onChange={setDate}
                  clearable={false}
                  fieldClassName="w-48"
                />
              ) : null}

              {selected.filters.includes("month") ? (
                <>
                  <div className="space-y-1.5">
                    <Label>{t("common.labels.year")}</Label>
                    <Input
                      type="number"
                      className="w-28"
                      value={year}
                      onChange={(event) => setYear(Number(event.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("common.labels.month")}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      className="w-24"
                      value={month}
                      onChange={(event) => setMonth(Number(event.target.value))}
                    />
                  </div>
                </>
              ) : null}

              {selected.filters.includes("group") ? (
                <SelectField
                  label={t("common.labels.group")}
                  value={groupId}
                  onChange={setGroupId}
                  options={groups}
                  allOption
                  triggerClassName="w-48"
                />
              ) : null}

              {selected.filters.includes("period") ? (
                <SelectField
                  label={t("periods.title")}
                  value={periodId}
                  onChange={setPeriodId}
                  options={(periods.data ?? []).map((item) => ({
                    value: item.id,
                    label: periodLabel(item.year, item.month),
                  }))}
                  triggerClassName="w-48"
                />
              ) : null}

              {selected.filters.includes("method") ? (
                <SelectField
                  label={t("payments.columns.method")}
                  value={method}
                  onChange={setMethod}
                  options={PAYMENT_METHODS.map((item) => ({
                    value: item,
                    label: t(`domain.paymentMethod.${item}`),
                  }))}
                  allOption
                  triggerClassName="w-44"
                />
              ) : null}

              <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
                <Button
                  className="h-11"
                  /* `finance/charges` davrsiz ishlamaydi — tugma to'siladi. */
                  disabled={busy || (selected.filters.includes("period") && !periodId)}
                  onClick={() => void run()}
                >
                  <Play className="h-4 w-4" />
                  {t("reports.run")}
                </Button>
                <Button
                  variant="outline"
                  className="h-11"
                  disabled={busy}
                  onClick={() => void download("xlsx")}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {t("reports.exportXlsx")}
                </Button>
                <Button
                  variant="outline"
                  className="h-11"
                  disabled={busy}
                  onClick={() => void download("pdf")}
                >
                  <Download className="h-4 w-4" />
                  {t("reports.exportPdf")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <QueryState
            isLoading={busy && rows === null}
            isEmpty={rows !== null && rows.length === 0}
            emptyTitle={t("reports.empty")}
            rows={4}
          >
            {rows && rows.length > 0 ? <ReportTable rows={rows} /> : null}
          </QueryState>
        </div>
      </div>
    </div>
  );
}
