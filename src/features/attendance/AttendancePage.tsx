import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { formatDate, todayIso } from "@/lib/dates";
import { AttendanceBoard } from "./components/AttendanceBoard";
import { AttendanceJournal } from "./components/AttendanceJournal";
import { AttendanceSummaryTab } from "./components/AttendanceSummaryTab";
import { CorrectionsLog } from "./components/CorrectionsLog";

export function AttendancePage() {
  const { t } = useTranslation();
  const { can, canAny, scopeOf } = usePermissions();
  const canManage = canAny(P.attendanceCheckIn, P.attendanceCheckOut);
  const canReadHistory = scopeOf(P.attendanceRead) !== "today";
  const canCorrect = can(P.attendanceCorrect);

  return (
    <div className="space-y-6">
      <PageHeader title={t("attendance.title")} subtitle={formatDate(todayIso())} />

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">{t("attendance.tabs.board")}</TabsTrigger>
          {canReadHistory ? (
            <TabsTrigger value="journal">{t("attendance.tabs.journal")}</TabsTrigger>
          ) : null}
          {canReadHistory ? (
            <TabsTrigger value="summary">{t("attendance.tabs.summary")}</TabsTrigger>
          ) : null}
          {canCorrect ? (
            <TabsTrigger value="corrections">{t("attendance.tabs.corrections")}</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="board">
          <AttendanceBoard canManage={canManage} />
        </TabsContent>
        {canReadHistory ? (
          <TabsContent value="journal">
            <AttendanceJournal canManage={canCorrect} />
          </TabsContent>
        ) : null}
        {canReadHistory ? (
          <TabsContent value="summary">
            <AttendanceSummaryTab />
          </TabsContent>
        ) : null}
        {canCorrect ? (
          <TabsContent value="corrections">
            <CorrectionsLog />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
