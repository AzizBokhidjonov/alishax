import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCard } from "@/components/common/TableCard";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChildStatusBadge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { formatDateTime } from "@/lib/dates";
import { GroupFormDialog } from "./components/GroupFormDialog";
import { AssignChildDialog } from "./components/AssignChildDialog";
import { TransferChildDialog } from "./components/TransferChildDialog";
import { GroupStaffForm } from "./components/GroupStaffForm";
import { useGroup, useGroupChildren, useGroupHistory } from "./api";

export function GroupDetailPage({ groupId }: { groupId: string }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const group = useGroup(groupId);
  const children = useGroupChildren(groupId);
  const history = useGroupHistory(groupId);
  const canManage = can(P.groupManage);

  const current = group.data?.currentCount ?? children.data?.length ?? 0;
  const capacity = group.data?.capacity ?? 0;
  const percent = capacity > 0 ? Math.round((current / capacity) * 100) : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/guruhlar">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("groups.title")}
        </Link>
      </Button>

      <QueryState
        isLoading={group.isLoading}
        error={group.error}
        onRetry={() => void group.refetch()}
        rows={3}
      >
        {group.data ? (
          <>
            <PageHeader
              title={group.data.name}
              subtitle={t("groups.places", { current, capacity })}
            >
              {canManage ? (
                <GroupFormDialog
                  group={group.data}
                  trigger={
                    <Button variant="outline" className="h-11">
                      <Pencil className="mr-2 h-4 w-4" />
                      {t("common.actions.edit")}
                    </Button>
                  }
                />
              ) : null}
            </PageHeader>

            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("groups.columns.occupancy")}</span>
                  <span className="font-medium">{percent}%</span>
                </div>
                <Progress value={percent} />
                {group.data.availablePlaces !== undefined ? (
                  <p className="text-sm text-muted-foreground">
                    {t("groups.available", { count: group.data.availablePlaces })}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Tabs defaultValue="children">
              <TabsList>
                <TabsTrigger value="children">{t("groups.tabs.children")}</TabsTrigger>
                <TabsTrigger value="staff">{t("groups.tabs.staff")}</TabsTrigger>
                <TabsTrigger value="history">{t("groups.tabs.history")}</TabsTrigger>
              </TabsList>

              <TabsContent value="children" className="mt-4 space-y-4">
                {canManage ? (
                  <div className="flex justify-end">
                    <AssignChildDialog groupId={groupId} canForce={can(P.groupManage)} />
                  </div>
                ) : null}
                <QueryState
                  isLoading={children.isLoading}
                  error={children.error}
                  isEmpty={(children.data ?? []).length === 0}
                  onRetry={() => void children.refetch()}
                  rows={3}
                >
                  <TableCard>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("common.labels.child")}</TableHead>
                          <TableHead>{t("common.labels.status")}</TableHead>
                          <TableHead className="text-right">{t("common.table.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(children.data ?? []).map((child) => (
                          <TableRow key={child.id}>
                            <TableCell className="font-medium">
                              <Link
                                to="/bolalar/$id"
                                params={{ id: child.id }}
                                className="hover:underline"
                              >
                                {child.lastName} {child.firstName}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <ChildStatusBadge status={child.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              {canManage ? (
                                <TransferChildDialog
                                  groupId={groupId}
                                  childId={child.id}
                                  childName={`${child.lastName} ${child.firstName}`}
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

              <TabsContent value="staff">
                <GroupStaffForm groupId={groupId} canManage={canManage} />
              </TabsContent>

              <TabsContent value="history">
                <QueryState
                  isLoading={history.isLoading}
                  error={history.error}
                  isEmpty={(history.data ?? []).length === 0}
                  emptyTitle={t("groups.historyEmpty")}
                  rows={3}
                >
                  <TableCard>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("common.labels.date")}</TableHead>
                          <TableHead>{t("common.labels.child")}</TableHead>
                          <TableHead>{t("common.actions.transfer")}</TableHead>
                          <TableHead>{t("common.labels.reason")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(history.data ?? []).map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDateTime(entry.at)}</TableCell>
                            <TableCell>{entry.childName ?? "—"}</TableCell>
                            <TableCell>
                              {entry.fromGroupName ?? "—"} → {entry.toGroupName ?? "—"}
                            </TableCell>
                            <TableCell>{entry.reason ?? entry.action ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableCard>
                </QueryState>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
