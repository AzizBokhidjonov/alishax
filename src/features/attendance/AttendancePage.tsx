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
  const { canAny } = usePermissions();
  const canManage = canAny(P.attendanceCheckIn, P.attendanceCheckOut);

  return (
    <div className="space-y-6">
      <PageHeader title={t("attendance.title")} subtitle={formatDate(todayIso())} />

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">{t("attendance.tabs.board")}</TabsTrigger>
          <TabsTrigger value="journal">{t("attendance.tabs.journal")}</TabsTrigger>
          <TabsTrigger value="summary">{t("attendance.tabs.summary")}</TabsTrigger>
          <TabsTrigger value="corrections">{t("attendance.tabs.corrections")}</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <AttendanceBoard canManage={canManage} />
        </TabsContent>
        <TabsContent value="journal">
          <AttendanceJournal canManage={canManage} />
        </TabsContent>
        <TabsContent value="summary">
          <AttendanceSummaryTab />
        </TabsContent>
        <TabsContent value="corrections">
          <CorrectionsLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
