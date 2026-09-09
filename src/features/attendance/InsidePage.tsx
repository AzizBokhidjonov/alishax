import { useTranslation } from "react-i18next";
import { Clock, DoorOpen, UserX } from "lucide-react";
import { childDisplayName, useChildLookup } from "@/features/children/use-child-lookup";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendanceBadge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { usePermissions } from "@/auth/auth-context";
import { useUrlState } from "@/hooks/use-url-state";
import { P } from "@/config/permissions";
import { formatTime, todayIso } from "@/lib/dates";
import { CheckOutDialog } from "./components/CheckOutDialog";
import { useAbsent, useInside, useNotPickedUp } from "./api";

/**
 * Kunning jonli kesimi: hozir ichkarida, olib ketilmaganlar va bugun
 * kelmaganlar (B9).
 *
 * Ilgari uchala ro'yxat bitta ekranda uchta karta bo'lib turardi. Har biri
 * o'z bo'sh holati bilan kelgani uchun ekran uchta «yozuv yo'q» blokiga
 * aylanib qolardi va ko'z qayerga qarashni bilmasdi. Endi ular TABLARDA:
 * bir vaqtda bitta ro'yxat ko'rinadi, qolganlarining og'irligi tab yonidagi
 * son bo'lib turadi — «olib ketilmagan 3 ta» degani ro'yxatni ochmasdan
 * ham ko'rinadi.
 *
 * Tanlangan tab manzilda saqlanadi (§2.8): sahifa yangilansa ham joyida
 * qoladi va taxtadagi ogohlantirish to'g'ridan-to'g'ri kerakli tabga
 * havola qila oladi.
 */
export function InsidePage() {
  // Davomat javobida ism har doim kelmaydi — ro'yxatdan to'ldiriladi.
  const lookup = useChildLookup();
  const { t } = useTranslation();
  const { canAny } = usePermissions();
  const canManage = canAny(P.attendanceCheckIn, P.attendanceCheckOut);
  const inside = useInside();
  const absent = useAbsent(todayIso());
  const notPickedUp = useNotPickedUp();

  const [tab, setTab] = useUrlState("inside.tab", "inside");

  const insideRows = inside.data ?? [];
  const lateRows = notPickedUp.data ?? [];
  const absentRows = absent.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("attendance.inside.title")}
        subtitle={t("attendance.inside.subtitle", { count: insideRows.length })}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inside">
            <DoorOpen className="h-4 w-4" />
            {t("attendance.summary.inside")}
            {/* Son faqat javob kelgach chiqadi — aks holda yuklanishda «0» ko'rinardi. */}
            {inside.data ? <TabsCount>{insideRows.length}</TabsCount> : null}
          </TabsTrigger>
          <TabsTrigger value="late">
            <Clock className="h-4 w-4" />
            {t("attendance.notPickedUp.short")}
            {notPickedUp.data ? <TabsCount>{lateRows.length}</TabsCount> : null}
          </TabsTrigger>
          <TabsTrigger value="absent">
            <UserX className="h-4 w-4" />
            {t("attendance.absent.short")}
            {absent.data ? <TabsCount>{absentRows.length}</TabsCount> : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inside">
          <QueryState
            isLoading={inside.isLoading}
            error={inside.error}
            isEmpty={insideRows.length === 0}
            emptyTitle={t("attendance.inside.empty")}
            emptyDescription={t("attendance.inside.emptyHint")}
            onRetry={() => void inside.refetch()}
            skeleton={<TableSkeleton columns={4} rows={4} />}
          >
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("attendance.columns.child")}</TableHead>
                    <TableHead>{t("attendance.columns.group")}</TableHead>
                    <TableHead>{t("attendance.inside.since")}</TableHead>
                    <TableHead className="text-right">{t("common.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insideRows.map((row) => (
                    <TableRow key={row.id ?? row.childId}>
                      <TableCell className="font-medium">
                        {childDisplayName(lookup, row.childId, row.childName)}
                      </TableCell>
                      <TableCell>{row.groupName ?? "—"}</TableCell>
                      <TableCell>{row.checkInAt ? formatTime(row.checkInAt) : "—"}</TableCell>
                      <TableCell className="text-right">
                        {canManage ? (
                          <CheckOutDialog
                            childId={row.childId}
                            childName={childDisplayName(lookup, row.childId, row.childName)}
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          </QueryState>
        </TabsContent>

        <TabsContent value="late" className="space-y-3">
          {/* Tab nomi ro'yxatni ataydi, izoh esa uning MEZONINI aytadi. */}
          <p className="text-sm text-muted-foreground">{t("attendance.notPickedUp.hint")}</p>
          <QueryState
            isLoading={notPickedUp.isLoading}
            error={notPickedUp.error}
            isEmpty={lateRows.length === 0}
            emptyTitle={t("attendance.notPickedUp.empty")}
            emptyDescription={t("attendance.notPickedUp.emptyHint")}
            onRetry={() => void notPickedUp.refetch()}
            rows={3}
          >
            <Card>
              <CardContent className="space-y-2 p-4">
                {lateRows.map((row) => (
                  <div
                    key={row.id ?? row.childId}
                    className="flex items-center justify-between gap-2 rounded-xl border border-st-warn-border bg-st-warn-soft px-3 py-2 text-st-warn-fg"
                  >
                    <span className="font-medium">
                      {childDisplayName(lookup, row.childId, row.childName)}
                    </span>
                    <span className="text-sm">
                      {row.checkInAt ? formatTime(row.checkInAt) : "—"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </QueryState>
        </TabsContent>

        <TabsContent value="absent">
          <QueryState
            isLoading={absent.isLoading}
            error={absent.error}
            isEmpty={absentRows.length === 0}
            emptyTitle={t("attendance.absent.empty")}
            emptyDescription={t("attendance.absent.emptyHint")}
            onRetry={() => void absent.refetch()}
            rows={3}
          >
            <Card>
              <CardContent className="space-y-2 p-4">
                {absentRows.map((row) => (
                  <div
                    key={row.id ?? row.childId}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                  >
                    <span className="font-medium">
                      {childDisplayName(lookup, row.childId, row.childName)}
                    </span>
                    <AttendanceBadge status={row.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </QueryState>
        </TabsContent>
      </Tabs>
    </div>
  );
}
