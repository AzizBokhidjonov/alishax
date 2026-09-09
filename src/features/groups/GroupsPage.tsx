import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { cn, focusRing, hoverLift } from "@/lib/utils";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { GroupFormDialog } from "./components/GroupFormDialog";
import { useGroups } from "./api";
import { RefreshButton } from "@/components/common/RefreshButton";

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

/** Skelet kartochkalar tarmog'ini takrorlaydi — yuklangach tartib sakramaydi. */
function GroupsSkeleton() {
  return (
    <div className={GRID}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-52 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function GroupsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { data, isLoading, isFetching, dataUpdatedAt, error, refetch } = useGroups({ limit: 200 });
  const canManage = can(P.groupManage);
  const groups = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("groups.title")}
        subtitle={t("groups.subtitle", { count: data?.meta.total ?? groups.length })}
      >
        <RefreshButton
          onRefresh={() => void refetch()}
          isFetching={isFetching}
          updatedAt={dataUpdatedAt}
        />
        {canManage ? (
          <GroupFormDialog
            trigger={
              <Button className="h-11">
                <Plus className="mr-2 h-4 w-4" />
                {t("groups.add")}
              </Button>
            }
          />
        ) : null}
      </PageHeader>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={groups.length === 0}
        onRetry={() => void refetch()}
        skeleton={<GroupsSkeleton />}
      >
        <div className={GRID}>
          {groups.map((group) => {
            const current = group.currentCount ?? 0;
            const percent = group.capacity > 0 ? Math.round((current / group.capacity) * 100) : 0;
            const full = current >= group.capacity;
            return (
              // Butun kartochka bitta navigatsiya nishoni: sarlavha
              // havolasining `after` qatlami kartochkani to'liq qoplaydi.
              // Shuning uchun hover soyasi yolg'on va'da bermaydi.
              <Card key={group.id} className={cn("relative", hoverLift)}>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">
                      <Link
                        to="/guruhlar/$id"
                        params={{ id: group.id }}
                        className={cn(
                          "rounded-sm after:absolute after:inset-0 hover:underline",
                          focusRing,
                        )}
                      >
                        {group.name}
                      </Link>
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {group.ageMinMonths ?? "—"}–{group.ageMaxMonths ?? "—"}{" "}
                      {t("common.labels.month")}
                    </p>
                  </div>
                  {full ? <Badge tone="danger">{t("groups.full")}</Badge> : null}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {t("groups.places", { current, capacity: group.capacity })}
                    </span>
                    <span className="font-medium">{percent}%</span>
                  </div>
                  <Progress value={percent} />
                  {group.mainTeacherName ? (
                    <p className="text-sm text-muted-foreground">
                      {t("groups.staff.mainTeacher")}: {group.mainTeacherName}
                    </p>
                  ) : null}
                  {/* Qoplama havola ustida turishi uchun `relative z-10`. */}
                  <div className="relative z-10 flex justify-end gap-2">
                    {canManage ? (
                      <GroupFormDialog
                        group={group}
                        trigger={
                          <Button size="sm" variant="ghost">
                            {t("common.actions.edit")}
                          </Button>
                        }
                      />
                    ) : null}
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/guruhlar/$id" params={{ id: group.id }}>
                        {t("common.actions.open")}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </QueryState>
    </div>
  );
}
