import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Plus, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ListPagination } from "@/components/common/ListPagination";
import { Money } from "@/components/common/Money";
import { PageHeader } from "@/components/common/PageHeader";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { FilterBar } from "@/components/common/FilterBar";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { ChildPicker } from "@/components/common/EntityPicker";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { currentPeriod, formatDate, periodLabel } from "@/lib/dates";
import { cn, focusRing } from "@/lib/utils";
import { addTiyin } from "@/lib/money";
import { useLanguage } from "@/i18n/useLanguage";
import { ManualChargeDialog } from "./components/ManualChargeDialog";
import { useCharges, usePeriods, useReverseCharge } from "./api";
import { useUrlState } from "@/hooks/use-url-state";
import { RefreshButton } from "@/components/common/RefreshButton";

export function ChargesPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { can } = usePermissions();
  const [unpaidOnly, setUnpaidOnly] = useUrlState("charges.unpaidOnly", false);
  const [periodId, setPeriodId] = useUrlState("charges.periodId", "all");
  const [childId, setChildId] = useUrlState("charges.childId", "");
  const [page, setPage] = useUrlState("charges.page", 1);

  const { data: periods } = usePeriods(currentPeriod().year);
  const { data, isLoading, dataUpdatedAt, isFetching, error, refetch } = useCharges({
    unpaidOnly: unpaidOnly || undefined,
    periodId: periodId === "all" ? undefined : periodId,
    childId: childId || undefined,
    page,
    limit: 50,
  });
  const reverse = useReverseCharge();

  const canManage = can(P.chargeGenerate);
  const canReverse = can(P.chargeReverse);
  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("charges.title")} subtitle={t("charges.subtitle")}>
        <RefreshButton
          onRefresh={() => void refetch()}
          isFetching={isFetching}
          updatedAt={dataUpdatedAt}
        />
        {canManage ? <ManualChargeDialog /> : null}
      </PageHeader>

      <FilterBar>
        <div className="min-w-60">
          <ChildPicker
            permission="charge:read"
            label={t("charges.columns.child")}
            value={childId}
            onChange={(value) => {
              setChildId(value);
              setPage(1);
            }}
          />
        </div>
        <SelectField
          label={t("charges.filters.period")}
          value={periodId}
          onChange={(value) => {
            setPeriodId(value);
            setPage(1);
          }}
          options={(periods ?? []).map((period) => ({
            value: period.id,
            label: periodLabel(period.year, period.month, language),
          }))}
          allOption
          triggerClassName="w-48"
        />
        <div className="flex h-11 items-center gap-2">
          <Switch
            id="unpaid-only"
            checked={unpaidOnly}
            onCheckedChange={(checked) => {
              setUnpaidOnly(checked);
              setPage(1);
            }}
          />
          <Label htmlFor="unpaid-only">{t("charges.filters.unpaidOnly")}</Label>
        </div>
      </FilterBar>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyTitle={t("charges.empty")}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={7} />}
      >
        <TableCard
          className={cn("transition-opacity", isFetching && "opacity-60")}
          footer={
            <>
              <span className="mr-auto text-muted-foreground">{t("common.table.pageTotal")}</span>
              <span>
                {t("charges.columns.amount")}:{" "}
                <Money
                  value={addTiyin(...rows.map((row) => row.amountTiyin))}
                  className="font-semibold"
                />
              </span>
              <span>
                {t("charges.columns.paid")}:{" "}
                <Money
                  value={addTiyin(...rows.map((row) => row.paidTiyin ?? "0"))}
                  className="font-semibold"
                />
              </span>
            </>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("charges.columns.child")}</TableHead>
                <TableHead>{t("charges.columns.period")}</TableHead>
                <TableHead>{t("charges.columns.description")}</TableHead>
                <TableHead>{t("charges.columns.amount")}</TableHead>
                <TableHead>{t("charges.columns.paid")}</TableHead>
                <TableHead>{t("charges.columns.createdAt")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((charge) => (
                <TableRow key={charge.id}>
                  <TableCell className="font-medium">
                    {charge.childId ? (
                      <Link
                        to="/bolalar/$id"
                        params={{ id: charge.childId }}
                        className={cn("rounded-sm hover:underline", focusRing)}
                      >
                        {charge.childName ?? charge.childId}
                      </Link>
                    ) : (
                      (charge.childName ?? "—")
                    )}
                  </TableCell>
                  <TableCell>
                    {charge.period
                      ? periodLabel(charge.period.year, charge.period.month, language)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {charge.description ?? "—"}
                    {charge.sign === -1 ? (
                      <Badge tone="danger" className="ml-2">
                        {t("charges.reversed")}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Money value={charge.amountTiyin} colored />
                  </TableCell>
                  <TableCell>
                    <Money value={charge.paidTiyin ?? "0"} />
                  </TableCell>
                  <TableCell>{formatDate(charge.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {canReverse && charge.sign !== -1 && !charge.reversedAt ? (
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Undo2 className="mr-1 h-4 w-4" />
                            {t("charges.reverse.action")}
                          </Button>
                        }
                        title={t("charges.reverse.title")}
                        description={t("charges.reverse.text")}
                        requireReason
                        sensitive
                        destructive
                        onConfirm={(reason) => reverse.mutate({ id: charge.id, reason })}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
        <ListPagination meta={data?.meta} onPageChange={setPage} />
      </QueryState>
    </div>
  );
}
