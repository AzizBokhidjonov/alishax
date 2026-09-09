import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/common/StatusBadge";
import { ListPagination } from "@/components/common/ListPagination";
import { Money } from "@/components/common/Money";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterBar } from "@/components/common/FilterBar";
import { QueryState } from "@/components/common/QueryState";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { SelectField } from "@/components/common/SelectField";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { currentPeriod, formatDate } from "@/lib/dates";
import { ExpenseFormDialog, PayExpenseDialog } from "./components/ExpenseDialogs";
import { EXPENSE_TYPES } from "./constants";
import { useExpenseSummary, useExpenses } from "./api";
import { useUrlState } from "@/hooks/use-url-state";
import { RefreshButton } from "@/components/common/RefreshButton";

export function ExpensesPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const period = currentPeriod();
  const [year, setYear] = useUrlState("expenses.year", period.year);
  const [type, setType] = useUrlState("expenses.type", "all");
  const [status, setStatus] = useUrlState("expenses.status", "all");
  const [page, setPage] = useUrlState("expenses.page", 1);

  const { data, isLoading, isFetching, dataUpdatedAt, error, refetch } = useExpenses({
    year,
    type: type === "all" ? undefined : type,
    status: status === "all" ? undefined : status,
    page,
    limit: 50,
  });
  const summary = useExpenseSummary(year);
  const canManage = can(P.expenseManage);
  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("expenses.title")}>
        <RefreshButton
          onRefresh={() => void refetch()}
          isFetching={isFetching}
          updatedAt={dataUpdatedAt}
        />
        {canManage ? (
          <ExpenseFormDialog
            trigger={
              <Button className="h-11">
                <Plus className="mr-2 h-4 w-4" />
                {t("expenses.add")}
              </Button>
            }
          />
        ) : null}
      </PageHeader>

      <FilterBar>
        <div className="space-y-1">
          <Label>{t("common.labels.year")}</Label>
          <Input
            type="number"
            className="h-11 w-28"
            value={year}
            onChange={(event) => {
              setYear(Number(event.target.value));
              setPage(1);
            }}
          />
        </div>
        <SelectField
          label={t("expenses.columns.type")}
          value={type}
          onChange={(value) => {
            setType(value);
            setPage(1);
          }}
          options={EXPENSE_TYPES.map((item) => ({
            value: item,
            label: t(`domain.expenseType.${item}`),
          }))}
          allOption
          triggerClassName="w-48"
        />
        <SelectField
          label={t("expenses.columns.status")}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={["unpaid", "paid", "partial"].map((item) => ({
            value: item,
            label: t(`domain.expenseStatus.${item}`),
          }))}
          allOption
          triggerClassName="w-48"
        />
      </FilterBar>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyTitle={t("expenses.empty")}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={7} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("expenses.columns.type")}</TableHead>
                <TableHead>{t("expenses.columns.provider")}</TableHead>
                <TableHead>{t("expenses.columns.period")}</TableHead>
                <TableHead>{t("expenses.columns.amount")}</TableHead>
                <TableHead>{t("expenses.columns.dueDate")}</TableHead>
                <TableHead>{t("expenses.columns.status")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    {t(`domain.expenseType.${expense.type}`)}
                  </TableCell>
                  <TableCell>{expense.provider ?? "—"}</TableCell>
                  <TableCell>
                    {expense.billingMonth}.{expense.billingYear}
                  </TableCell>
                  <TableCell>
                    <Money value={expense.amountTiyin} />
                  </TableCell>
                  <TableCell>{formatDate(expense.dueDate)}</TableCell>
                  <TableCell>
                    <Badge
                      tone={
                        expense.status === "paid"
                          ? "ok"
                          : expense.status === "partial"
                            ? "warn"
                            : "danger"
                      }
                    >
                      {t(`domain.expenseStatus.${expense.status ?? "unpaid"}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <div className="inline-flex gap-1">
                        {expense.status !== "paid" ? <PayExpenseDialog expense={expense} /> : null}
                        <ExpenseFormDialog
                          expense={expense}
                          trigger={
                            <Button size="sm" variant="ghost">
                              {t("common.actions.edit")}
                            </Button>
                          }
                        />
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
        <ListPagination meta={data?.meta} onPageChange={setPage} />
      </QueryState>

      {summary.data && summary.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("expenses.summary.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.data.map((row, index) => (
              <div
                key={`${row.type ?? row.month}-${index}`}
                className="rounded-xl border border-border p-3"
              >
                <div className="text-sm font-medium">
                  {row.type ? t(`domain.expenseType.${row.type}`) : `${row.month}`}
                </div>
                <Money value={row.totalTiyin} className="text-lg font-semibold" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
