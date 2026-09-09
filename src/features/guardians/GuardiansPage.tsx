import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/common/StatusBadge";
import { FilterBar, SearchField } from "@/components/common/FilterBar";
import { ListPagination } from "@/components/common/ListPagination";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { useListParams } from "@/hooks/use-list-params";
import { GuardianFormDialog } from "./components/GuardianFormDialog";
import { TelegramPanel } from "./components/TelegramPanel";
import { useGuardians, useTelegramInvite } from "./api";
import { RefreshButton } from "@/components/common/RefreshButton";

export function GuardiansPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const params = useListParams({}, "fullName:asc");
  const { data, isLoading, isFetching, dataUpdatedAt, error, refetch } = useGuardians(params.query);
  const invite = useTelegramInvite();

  const canManage = can(P.guardianManage);
  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("guardians.title")}
        subtitle={t("guardians.subtitle", { count: data?.meta.total ?? 0 })}
      >
        <RefreshButton
          onRefresh={() => void refetch()}
          isFetching={isFetching}
          updatedAt={dataUpdatedAt}
        />
        {canManage ? (
          <GuardianFormDialog
            trigger={
              <Button className="h-11">
                <UserPlus className="mr-2 h-4 w-4" />
                {t("guardians.add")}
              </Button>
            }
          />
        ) : null}
      </PageHeader>

      <FilterBar activeCount={params.activeCount} onReset={params.reset}>
        <SearchField
          value={params.q}
          onChange={params.setQuery}
          placeholder={t("guardians.searchPlaceholder")}
        />
      </FilterBar>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={5} />}
        emptyAction={
          <Button variant="outline" onClick={params.reset}>
            {t("common.actions.reset")}
          </Button>
        }
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("guardians.columns.guardian")}</TableHead>
                <TableHead>{t("guardians.columns.phone")}</TableHead>
                <TableHead>{t("guardians.columns.children")}</TableHead>
                <TableHead>{t("guardians.columns.telegram")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((guardian) => (
                <TableRow key={guardian.id}>
                  <TableCell className="font-medium">
                    <Link
                      to="/otaonalar/$id"
                      params={{ id: guardian.id }}
                      className="hover:underline"
                    >
                      {guardian.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{guardian.phone}</TableCell>
                  <TableCell>{guardian.childrenCount ?? "—"}</TableCell>
                  <TableCell>
                    {guardian.telegramBound ? (
                      <Badge tone="ok">{t("guardians.telegram.bound")}</Badge>
                    ) : (
                      <Badge tone="neutral">{t("guardians.telegram.unbound")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      {canManage && !guardian.telegramBound ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => invite.mutate(guardian.id)}
                        >
                          <Send className="mr-1 h-4 w-4" />
                          {t("guardians.telegram.invite")}
                        </Button>
                      ) : null}
                      {canManage ? (
                        <GuardianFormDialog
                          guardian={guardian}
                          trigger={
                            <Button size="sm" variant="ghost">
                              {t("common.actions.edit")}
                            </Button>
                          }
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
        <ListPagination
          meta={data?.meta}
          onPageChange={params.setPage}
          onLimitChange={params.setLimit}
        />
      </QueryState>

      {canManage ? <TelegramPanel /> : null}
    </div>
  );
}
