import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CloudOff } from "lucide-react";
import type { AttendanceRecord } from "@/api";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/common/QueryState";
import { TableSkeleton } from "@/components/common/TableCard";
import { useBranch } from "@/auth/use-branch";
import { useUrlState } from "@/hooks/use-url-state";
import { childDisplayName, useChildLookup } from "@/features/children/use-child-lookup";
import { useGroupOptions } from "@/features/groups/api";
import { useCheckIn, useNotPickedUp, useSetAttendanceStatus } from "../api";
import { usePendingCheckIns } from "../checkin-queue";
import { useBoardRows } from "../use-board-rows";
import { AttendanceBoardHeader, type Counter } from "./AttendanceBoardHeader";
import { AttendanceGroupSection } from "./AttendanceGroupSection";

function isPending(row: AttendanceRecord): boolean {
  return !row.checkInAt && !row.status;
}

function matches(row: AttendanceRecord, counter: Counter, lateIds: Set<string>): boolean {
  switch (counter) {
    case "pending":
      return isPending(row);
    case "pickedUp":
      return Boolean(row.checkOutAt);
    case "inside":
      return Boolean(row.checkInAt && !row.checkOutAt);
    case "absent":
      // Sabab qo'yilgan (kelmadi/kasal/ta'til/sababli) — belgilanmagan emas.
      return !row.checkInAt && Boolean(row.status);
    case "notPickedUp":
      // Kimni olib ketishmagani — serverning qarori (ish vaqti, bayramlar).
      return lateIds.has(row.childId);
    default:
      return true;
  }
}

export function AttendanceBoard({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation();
  const [groupId, setGroupId] = useUrlState("attendance.groupId", "all");
  const [counter, setCounter] = useUrlState("attendance.counter", "all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [term, setTerm] = useState("");

  const [view, setView] = useUrlState("attendance.view", "cards");

  const groups = useGroupOptions();
  const { branchId } = useBranch();

  const { rows, isLoading, error, refetch } = useBoardRows({
    groupId: groupId === "all" ? undefined : groupId,
    branchId,
  });

  const lookup = useChildLookup();

  const notPickedUp = useNotPickedUp();
  const lateIds = useMemo(
    () => new Set((notPickedUp.data ?? []).map((row) => row.childId)),
    [notPickedUp.data],
  );

  const checkIn = useCheckIn();
  const setStatus = useSetAttendanceStatus();

  const queued = usePendingCheckIns();

  const inside = rows.filter((row) => row.checkInAt && !row.checkOutAt).length;
  // «Kelmadi» — ATAYLAB sabab qo'yilganlar; belgilanmaganlar bunga kirmaydi.
  const absent = rows.filter((row) => !row.checkInAt && row.status).length;

  const search = term.trim().toLowerCase();
  const visible = rows.filter((row) => {
    if (!matches(row, counter as Counter, lateIds)) return false;
    if (!search) return true;
    return childDisplayName(lookup, row.childId, row.childName).toLowerCase().includes(search);
  });

  const filtered = counter !== "all" || Boolean(search);
  const resetFilters = () => {
    setCounter("all");
    setTerm("");
  };

  const sections = useMemo(() => {
    const map = new Map<string, { name: string; rows: AttendanceRecord[] }>();
    for (const row of visible) {
      const key = row.groupId ?? "none";
      const entry = map.get(key) ?? { name: row.groupName ?? t("common.labels.noGroup"), rows: [] };
      entry.rows.push(row);
      map.set(key, entry);
    }
    return [...map.entries()]
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
      .map(([key, section]) => ({
        key,
        ...section,
        // Hali hech qanday qayd qo'yilmaganlar — ommaviy amal shularga tegadi.
        pending: section.rows.filter(isPending),
      }));
  }, [visible, t]);

  const markAllPresent = (pending: AttendanceRecord[]) => {
    for (const row of pending) checkIn.mutate({ childId: row.childId });
  };

  return (
    <div className="space-y-4">
      <AttendanceBoardHeader
        term={term}
        onTermChange={setTerm}
        groupId={groupId}
        onGroupChange={setGroupId}
        groups={groups}
        counter={counter as Counter}
        onCounterChange={setCounter}
        counts={{
          pending: rows.filter(isPending).length,
          inside,
          pickedUp: rows.filter((row) => row.checkOutAt).length,
          absent,
          notPickedUp: lateIds.size,
          total: rows.length,
        }}
        view={view === "quick" ? "quick" : "cards"}
        onViewChange={setView}
      />

      {}
      {lateIds.size > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-st-danger-border bg-st-danger-soft px-4 py-2.5 text-sm font-medium text-st-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t("attendance.notPickedUp.banner", { count: lateIds.size })}
          </span>
          <Button variant="outline" size="sm" asChild>
            {}
            <Link to="/ichkarida" search={{ tab: "late" }}>
              {t("common.actions.more")}
            </Link>
          </Button>
        </div>
      ) : null}

      {}
      {queued > 0 ? (
        <div
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl border border-st-info-border bg-st-info-soft px-4 py-2.5 text-sm font-medium text-st-info-fg"
        >
          <CloudOff className="h-4 w-4 shrink-0" />
          {t("attendance.pendingQueue", { count: queued })}
        </div>
      ) : null}

      {}
      <p aria-live="polite" className="sr-only">
        {t("attendance.summary.inside")}: {inside}
      </p>

      {}
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={visible.length === 0}
        emptyTitle={
          rows.length === 0
            ? t("attendance.noChildren")
            : counter === "pending"
              ? t("attendance.allMarked")
              : t("attendance.noMatch")
        }
        emptyDescription={
          rows.length === 0 ? t("attendance.noChildrenHint") : t("attendance.noMatchHint")
        }
        emptyAction={
          rows.length === 0 ? (
            <Button variant="outline" asChild>
              <Link to="/bolalar">{t("children.title")}</Link>
            </Button>
          ) : filtered ? (
            <Button variant="outline" onClick={resetFilters}>
              {t("common.filters.clear")}
            </Button>
          ) : null
        }
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={4} />}
      >
        <div className="space-y-4">
          {sections.map((section) => (
            <AttendanceGroupSection
              key={section.key}
              section={section}
              view={view === "quick" ? "quick" : "cards"}
              open={!collapsed[section.key]}
              onOpenChange={(next) => setCollapsed((prev) => ({ ...prev, [section.key]: !next }))}
              lookup={lookup}
              canManage={canManage}
              onCheckIn={(childId) => checkIn.mutate({ childId })}
              onSetStatus={(childId, date, status) => setStatus.mutate({ childId, date, status })}
              onMarkAllPresent={markAllPresent}
            />
          ))}
        </div>
      </QueryState>
    </div>
  );
}
