import { useState } from "react";
import { useTranslation } from "react-i18next";
import { childDisplayName, useChildLookup } from "@/features/children/use-child-lookup";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { FilterBar } from "@/components/common/FilterBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueryState } from "@/components/common/QueryState";
import { addDays, formatDate, formatDateTime, todayIso } from "@/lib/dates";
import { useCorrections } from "../api";
import { DateField } from "@/components/common/DateField";

/** Tuzatishlar jurnali — kim, qachon va nima uchun o'zgartirgan. */
export function CorrectionsLog() {
  // Ism javobda bo'lmasa bolalar ro'yxatidan olinadi.
  const lookup = useChildLookup();
  const { t } = useTranslation();
  const [from, setFrom] = useState(addDays(todayIso(), -30));
  const [to, setTo] = useState(todayIso());
  const { data, isLoading, error, refetch } = useCorrections({ from, to });
  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <FilterBar>
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
      </FilterBar>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyTitle={t("attendance.corrections.empty")}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={8} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.labels.date")}</TableHead>
                <TableHead>{t("attendance.columns.child")}</TableHead>
                <TableHead>{t("attendance.corrections.field")}</TableHead>
                <TableHead>{t("attendance.corrections.oldValue")}</TableHead>
                <TableHead>{t("attendance.corrections.newValue")}</TableHead>
                <TableHead>{t("common.labels.reason")}</TableHead>
                <TableHead>{t("attendance.corrections.by")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDateTime(row.at)}</TableCell>
                  <TableCell>
                    {childDisplayName(lookup, row.childId ?? "", row.childName)}
                    {row.date ? (
                      <div className="text-xs text-muted-foreground">{formatDate(row.date)}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>{t(`attendance.corrections.fields.${row.field}`)}</TableCell>
                  <TableCell>{row.oldValue ?? "—"}</TableCell>
                  <TableCell>{row.newValue ?? "—"}</TableCell>
                  <TableCell className="max-w-[260px]">{row.reason}</TableCell>
                  <TableCell>{row.userName ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      </QueryState>
    </div>
  );
}
