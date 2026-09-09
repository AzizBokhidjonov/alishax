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
import { SelectField } from "@/components/common/SelectField";
import { addDays, todayIso } from "@/lib/dates";
import { useGroupOptions } from "@/features/groups/api";
import { useAttendanceSummary } from "../api";
import { DateField } from "@/components/common/DateField";

/** Davomat yakuni: kelgan/kelmagan kunlar soni va foizi. */
export function AttendanceSummaryTab() {
  // Ism javobda bo'lmasa bolalar ro'yxatidan olinadi.
  const lookup = useChildLookup();
  const { t } = useTranslation();
  const groups = useGroupOptions();
  const [from, setFrom] = useState(addDays(todayIso(), -30));
  const [to, setTo] = useState(todayIso());
  const [groupId, setGroupId] = useState("all");

  const { data, isLoading, error, refetch } = useAttendanceSummary({
    from,
    to,
    groupId: groupId === "all" ? undefined : groupId,
  });
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
        <SelectField
          label={t("common.labels.group")}
          value={groupId}
          onChange={setGroupId}
          options={groups}
          allOption
          triggerClassName="w-48"
        />
      </FilterBar>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={7} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("attendance.columns.child")}</TableHead>
                <TableHead>{t("attendance.columns.group")}</TableHead>
                <TableHead>{t("attendance.summary.present")}</TableHead>
                <TableHead>{t("attendance.summary.absent")}</TableHead>
                <TableHead>{t("attendance.summary.sick")}</TableHead>
                <TableHead>{t("attendance.summary.rate")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const total = row.workingDays ?? row.present + row.absent;
                const rate = total > 0 ? Math.round((row.present / total) * 100) : 0;
                return (
                  <TableRow key={row.childId ?? `${row.groupId}-${index}`}>
                    <TableCell className="font-medium">
                      {childDisplayName(lookup, row.childId ?? "", row.childName)}
                    </TableCell>
                    <TableCell>{row.groupName ?? "—"}</TableCell>
                    <TableCell>{row.present}</TableCell>
                    <TableCell>{row.absent}</TableCell>
                    <TableCell>{row.sick ?? 0}</TableCell>
                    <TableCell>{rate}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      </QueryState>
    </div>
  );
}
