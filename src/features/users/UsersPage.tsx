import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Pencil, UserPlus } from "lucide-react";
import type { User } from "@/api";
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FilterBar, SearchField } from "@/components/common/FilterBar";
import { ListPagination } from "@/components/common/ListPagination";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { SelectField } from "@/components/common/SelectField";
import { useListParams } from "@/hooks/use-list-params";
import { formatDateTime } from "@/lib/dates";
import { useBranchOptions } from "@/features/settings/api";
import { roleLabelKey } from "@/config/permissions";
import { UserEditDialog, UserFormDialog } from "./components/UserFormDialogs";
import { useRoles, useToggleUserActive, useUsers } from "./api";
import { RefreshButton } from "@/components/common/RefreshButton";

export function UsersPage() {
  const { t } = useTranslation();
  const params = useListParams({ status: "all", role: "all", branchId: "all" }, "fullName:asc");
  const roles = useRoles();
  const branches = useBranchOptions();
  const { data, isLoading, isFetching, dataUpdatedAt, error, refetch } = useUsers(params.query);
  const toggle = useToggleUserActive();
  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users.title")}
        subtitle={t("users.subtitle", { count: data?.meta.total ?? rows.length })}
      >
        <RefreshButton
          onRefresh={() => void refetch()}
          isFetching={isFetching}
          updatedAt={dataUpdatedAt}
        />
        <UserFormDialog
          trigger={
            <Button className="h-11">
              <UserPlus className="mr-2 h-4 w-4" />
              {t("users.add")}
            </Button>
          }
        />
      </PageHeader>

      <FilterBar activeCount={params.activeCount} onReset={params.reset}>
        <SearchField value={params.q} onChange={params.setQuery} />
        <SelectField
          label={t("users.columns.status")}
          value={params.filters.status ?? "all"}
          onChange={(value) => params.setFilter("status", value)}
          options={[
            { value: "active", label: t("domain.userStatus.active") },
            { value: "inactive", label: t("domain.userStatus.inactive") },
          ]}
          allOption
          triggerClassName="w-48"
        />
        <SelectField
          label={t("users.form.role")}
          value={params.filters.role ?? "all"}
          onChange={(value) => params.setFilter("role", value)}
          options={(roles.data ?? []).map((role) => ({
            value: role.code || role.id,
            label: t(roleLabelKey(role.code), { defaultValue: role.nameUz || role.code }),
          }))}
          allOption
          triggerClassName="w-48"
        />
        {branches.length > 1 ? (
          <SelectField
            label={t("users.roles.branch")}
            value={params.filters.branchId ?? "all"}
            onChange={(value) => params.setFilter("branchId", value)}
            options={branches}
            allOption
            triggerClassName="w-48"
          />
        ) : null}
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
                <TableHead>{t("users.columns.user")}</TableHead>
                <TableHead>{t("users.columns.phone")}</TableHead>
                <TableHead>{t("users.columns.status")}</TableHead>
                <TableHead>{t("users.columns.lastLogin")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((user: User) => {
                const active = user.status !== "inactive";
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <Link to="/xodimlar/$id" params={{ id: user.id }} className="hover:underline">
                        {user.fullName}
                      </Link>
                      {user.email ? (
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{user.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge tone={active ? "ok" : "neutral"}>
                        {t(`domain.userStatus.${active ? "active" : "inactive"}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(user.lastLoginAt)}</TableCell>
                    <TableCell className="text-right">
                      <UserEditDialog
                        user={user}
                        trigger={
                          <Button size="sm" variant="ghost">
                            <Pencil className="mr-1 h-4 w-4" />
                            {t("common.actions.edit")}
                          </Button>
                        }
                      />
                      {active ? (
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="ghost" className="text-destructive">
                              {t("users.deactivate")}
                            </Button>
                          }
                          title={t("users.deactivate")}
                          description={t("users.deactivateText", { name: user.fullName })}
                          sensitive
                          destructive
                          onConfirm={() => toggle.mutate({ id: user.id, active: false })}
                        />
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggle.mutate({ id: user.id, active: true })}
                        >
                          {t("users.activate")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
        <ListPagination
          meta={data?.meta}
          onPageChange={params.setPage}
          onLimitChange={params.setLimit}
        />
      </QueryState>
    </div>
  );
}
