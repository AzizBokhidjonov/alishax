import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AttendanceStatus } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryState } from "@/components/common/QueryState";
import { currentPeriod, daysInMonth, formatTime, periodLabel } from "@/lib/dates";
import { useLanguage } from "@/i18n/useLanguage";
import { useAttendanceCalendar } from "@/features/attendance/api";
import { cn } from "@/lib/utils";

const TONE: Record<AttendanceStatus, string> = {
  present: "bg-st-ok-soft text-st-ok-fg border-st-ok-border",
  late: "bg-st-warn-soft text-st-warn-fg border-st-warn-border",
  early_departure: "bg-st-warn-soft text-st-warn-fg border-st-warn-border",
  absent: "bg-st-danger-soft text-st-danger-fg border-st-danger-border",
  sick: "bg-st-info-soft text-st-info-fg border-st-info-border",
  vacation: "bg-st-info-soft text-st-info-fg border-st-info-border",
  excused: "bg-st-neutral-soft text-st-neutral-fg border-st-neutral-border",
};

/** Bola bo'yicha oylik davomat kalendari (`GET /attendance/calendar`). */
export function ChildAttendanceTab({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [period, setPeriod] = useState(currentPeriod());
  const { data, isLoading, error, refetch } = useAttendanceCalendar(
    childId,
    period.year,
    period.month,
  );

  const shift = (delta: number) => {
    setPeriod((current) => {
      const month = current.month + delta;
      if (month < 1) return { year: current.year - 1, month: 12 };
      if (month > 12) return { year: current.year + 1, month: 1 };
      return { ...current, month };
    });
  };

  const byDate = new Map((data ?? []).map((day) => [day.date.slice(0, 10), day]));
  const total = daysInMonth(period.year, period.month);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t("attendance.calendar.title")}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-32 text-center text-sm font-medium">
            {periodLabel(period.year, period.month, language)}
          </span>
          <Button variant="outline" size="sm" onClick={() => shift(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={(data ?? []).length === 0}
          emptyTitle={t("attendance.calendar.empty")}
          onRetry={() => void refetch()}
          rows={2}
        >
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: total }).map((_, index) => {
              const day = index + 1;
              const iso = `${period.year}-${String(period.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const record = byDate.get(iso);
              return (
                <div
                  key={iso}
                  className={cn(
                    "rounded-xl border p-2 text-center text-xs",
                    record?.status ? TONE[record.status] : "border-border bg-card",
                  )}
                  title={record?.status ? t(`domain.attendanceStatus.${record.status}`) : undefined}
                >
                  <div className="text-sm font-semibold">{day}</div>
                  {record?.checkInAt ? <div>{formatTime(record.checkInAt)}</div> : null}
                </div>
              );
            })}
          </div>
        </QueryState>
      </CardContent>
    </Card>
  );
}
