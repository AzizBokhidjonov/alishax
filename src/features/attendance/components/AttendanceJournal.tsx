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
import { AttendanceBadge } from "@/components/common/StatusBadge";
import { ListPagination } from "@/components/common/ListPagination";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { formatDate, formatTime, todayIso } from "@/lib/dates";
import { useGroupOptions } from "@/features/groups/api";
import { useAttendanceList } from "../api";
import { CorrectionDialog } from "./CorrectionDialog";
import { SetStatusDialog } from "./SetStatusDialog";
import { DateField } from "@/components/common/DateField";

/** Sana oralig'i bo'yicha davomat jurnali va tuzatish amali. */
export function AttendanceJournal({ canManage }: { canManage: boolean }) {
  // Ism javobda bo'lmasa bolalar ro'yxatidan olinadi.
  const lookup = useChildLookup();
  const { t } = useTranslation();
  const groups = useGroupOptions();
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [groupId, setGroupId] = useState("all");
  const [page, setPage] = useState(1);

  const params = {
    from,
    to,
    groupId: groupId === "all" ? undefined : groupId,
    page,
    limit: 50,
  };
  const { data, isLoading, error, refetch } = useAttendanceList(params);
  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      <FilterBar>
        <DateField
          label={t("common.labels.dateFrom")}
          value={from}
          onChange={(value) => {
            setFrom(value);
            setPage(1);
          }}
          clearable={false}
          fieldClassName="w-48"
        />
        <DateField
          label={t("common.labels.dateTo")}
          value={to}
          onChange={(value) => {
            setTo(value);
            setPage(1);
          }}
          min={from}
          clearable={false}
          fieldClassName="w-48"
        />
        <SelectField
          label={t("common.labels.group")}
          value={groupId}
          onChange={(value) => {
            setGroupId(value);
            setPage(1);
          }}
          options={groups}
          allOption
          triggerClassName="w-48"
        />

        {/*
          Bugungi taxtada holat qatorning o'zida qo'yiladi, oyna kerak emas.
          Lekin o'tgan kun yoki oldindan ta'til uchun sana tanlash zarur —
          shuning uchun bu amal jurnalda, ya'ni ma'muriy joyda turadi.
        */}
        {canManage ? <SetStatusDialog date={from} /> : null}
      </FilterBar>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyTitle={t("attendance.empty")}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={8} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.labels.date")}</TableHead>
                <TableHead>{t("attendance.columns.child")}</TableHead>
                <TableHead>{t("attendance.columns.status")}</TableHead>
                <TableHead>{t("attendance.columns.checkIn")}</TableHead>
                <TableHead>{t("attendance.columns.checkOut")}</TableHead>
                <TableHead>{t("attendance.columns.pickedBy")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell className="font-medium">
                    {childDisplayName(lookup, row.childId, row.childName)}
                  </TableCell>
                  <TableCell>
                    <AttendanceBadge status={row.status} />
                  </TableCell>
                  <TableCell>{row.checkInAt ? formatTime(row.checkInAt) : "—"}</TableCell>
                  <TableCell>{row.checkOutAt ? formatTime(row.checkOutAt) : "—"}</TableCell>
                  <TableCell>{row.pickupPersonName ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {canManage ? <CorrectionDialog attendanceId={row.id} /> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
        <ListPagination meta={data?.meta} onPageChange={setPage} />
      </QueryState>
    </div>
  );
}
