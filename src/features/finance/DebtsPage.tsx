import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListPagination } from "@/components/common/ListPagination";
import { Money } from "@/components/common/Money";
import { PageHeader } from "@/components/common/PageHeader";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { FilterBar } from "@/components/common/FilterBar";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { useGroupOptions } from "@/features/groups/api";
import { DebtReminderDialog } from "./components/DebtReminderDialog";
import { toBigInt, toTiyin } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useDebtSummary, useDebts } from "./api";
import { useUrlState } from "@/hooks/use-url-state";
import { RefreshButton } from "@/components/common/RefreshButton";

const AGEING = ["notOverdue", "d1_7", "d8_30", "d30plus"] as const;

/** Qarz hisoblardan hosil bo'ladi — bu ekran faqat o'qish uchun (B15). */
export function DebtsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const groups = useGroupOptions();
  const [groupId, setGroupId] = useUrlState("debts.groupId", "all");
  const [overdueOnly, setOverdueOnly] = useUrlState("debts.overdueOnly", false);
  const [minAmount, setMinAmount] = useUrlState("debts.minAmount", "");
  const [ageing, setAgeing] = useUrlState("debts.ageing", "all");
  const [page, setPage] = useUrlState("debts.page", 1);

  const summary = useDebtSummary();
  const { data, isLoading, dataUpdatedAt, isFetching, error, refetch } = useDebts({
    groupId: groupId === "all" ? undefined : groupId,
    overdueOnly: overdueOnly || undefined,
    minAmountTiyin: minAmount ? toTiyin(minAmount) : undefined,
    ageing: ageing === "all" ? undefined : ageing,
    page,
    limit: 50,
  });

  const rows = data?.data ?? [];
  const canRemind = can(P.notificationSend);

  return (
    <div className="space-y-6">
      <PageHeader title={t("debts.title")} subtitle={t("debts.subtitle")}>
        <RefreshButton
          onRefresh={() => void refetch()}
          isFetching={isFetching}
          updatedAt={dataUpdatedAt}
        />
        {canRemind ? (
          <DebtReminderDialog
            targets={rows.map((row) => ({
              childId: row.childId,
              childName: row.childName,
              currentDebt: row.currentDebt,
            }))}
          />
        ) : null}
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("debts.summary.total")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Money
              value={summary.data?.totalDebt ?? "0"}
              className="text-3xl font-bold text-st-danger-fg"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("debts.summary.byAgeing")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AGEING.map((bucket) => (
              <div key={bucket} className="rounded-xl border border-border p-3">
                <div className="text-xs text-muted-foreground">{t(`domain.ageing.${bucket}`)}</div>
                <Money
                  value={summary.data?.byAgeing?.[bucket] ?? "0"}
                  className="text-sm font-semibold"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <FilterBar>
        <SelectField
          label={t("debts.columns.group")}
          value={groupId}
          onChange={(value) => {
            setGroupId(value);
            setPage(1);
          }}
          options={groups}
          allOption
          triggerClassName="w-48"
        />
        <div className="space-y-1">
          <Label>{t("debts.filters.minAmount")}</Label>
          <Input
            className="h-11 w-40"
            inputMode="decimal"
            value={minAmount}
            onChange={(event) => {
              setMinAmount(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <SelectField
          label={t("debts.filters.ageing")}
          value={ageing}
          onChange={(value) => {
            setAgeing(value);
            setPage(1);
          }}
          options={AGEING.map((bucket) => ({
            value: bucket,
            label: t(`domain.ageing.${bucket}`),
          }))}
          allOption
          triggerClassName="w-44"
        />
        <div className="flex h-11 items-center gap-2">
          <Switch
            id="overdue-only"
            checked={overdueOnly}
            onCheckedChange={(checked) => {
              setOverdueOnly(checked);
              setPage(1);
            }}
          />
          <Label htmlFor="overdue-only">{t("debts.filters.overdueOnly")}</Label>
        </div>
      </FilterBar>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyTitle={t("debts.empty")}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={6} />}
      >
        <TableCard className={cn("transition-opacity", isFetching && "opacity-60")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("debts.columns.child")}</TableHead>
                <TableHead>{t("debts.columns.group")}</TableHead>
                <TableHead>{t("debts.columns.debt")}</TableHead>
                <TableHead>{t("debts.columns.overdue")}</TableHead>
                <TableHead>{t("debts.columns.advance")}</TableHead>
                <TableHead className="text-right">{t("domain.ageing.d30plus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.childId}>
                  <TableCell className="font-medium">
                    <Link
                      to="/bolalar/$id"
                      params={{ id: row.childId }}
                      search={{ tab: "finance" }}
                      className="hover:underline"
                    >
                      {row.childName ?? t("flows.unknownName")}
                    </Link>
                  </TableCell>
                  <TableCell>{row.groupName ?? "—"}</TableCell>
                  <TableCell>
                    <Money value={row.currentDebt} className="font-medium text-st-danger-fg" />
                  </TableCell>
                  <TableCell>
                    {row.overdueAmount != null ? <Money value={row.overdueAmount} /> : "—"}
                  </TableCell>
                  <TableCell>
                    <Money value={row.advanceBalance ?? "0"} />
                  </TableCell>
                  <TableCell className="text-right">
                    {row.ageing ? (
                      <Money
                        value={row.ageing.d30plus}
                        className={
                          toBigInt(row.ageing.d30plus) > 0n
                            ? "font-semibold text-st-danger-fg"
                            : undefined
                        }
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
        <ListPagination meta={data?.meta} onPageChange={setPage} />
      </QueryState>

      {summary.data?.byGroup && summary.data.byGroup.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("debts.summary.byGroup")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.data.byGroup.map((group) => (
              <div key={group.groupId} className="rounded-xl border border-border p-3">
                <div className="text-sm font-medium">{group.groupName}</div>
                <Money value={group.amountTiyin} className="text-lg font-semibold" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
