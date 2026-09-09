import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, LockOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { FilterBar } from "@/components/common/FilterBar";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { currentPeriod, formatDateTime, periodLabel } from "@/lib/dates";
import { useLanguage } from "@/i18n/useLanguage";
import { useClosePeriod, useCreatePeriod, usePeriods, useReopenPeriod } from "./api";

/**
 * Hisob davrlari. Yopilgan davrga moliyaviy yozuv kiritib bo'lmaydi
 * (`409 PERIOD_CLOSED`), qayta ochish esa faqat Egada va sabab bilan (B12).
 */
export function PeriodsPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { can } = usePermissions();
  const [year, setYear] = useState(currentPeriod().year);
  const [newMonth, setNewMonth] = useState(String(currentPeriod().month));

  const { data, isLoading, error, refetch } = usePeriods(year);
  const create = useCreatePeriod();
  const close = useClosePeriod();
  const reopen = useReopenPeriod();

  const canClose = can(P.periodClose);
  const canReopen = can(P.periodReopen);
  const periods = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("periods.title")} subtitle={t("periods.subtitle", { year })}>
        {canClose ? (
          <div className="flex items-end gap-2">
            <SelectField
              label={t("common.labels.month")}
              value={newMonth}
              onChange={setNewMonth}
              options={Array.from({ length: 12 }).map((_, index) => ({
                value: String(index + 1),
                label: periodLabel(year, index + 1, language),
              }))}
              triggerClassName="w-48"
            />
            <Button
              className="h-11"
              onClick={() => create.mutate({ year, month: Number(newMonth) })}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("periods.add")}
            </Button>
          </div>
        ) : null}
      </PageHeader>

      <FilterBar>
        <div className="space-y-1">
          <Label>{t("common.labels.year")}</Label>
          <Input
            type="number"
            className="h-11 w-32"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          />
        </div>
      </FilterBar>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={periods.length === 0}
        emptyTitle={t("periods.empty")}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={5} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("periods.columns.period")}</TableHead>
                <TableHead>{t("periods.columns.status")}</TableHead>
                <TableHead>{t("periods.columns.closedAt")}</TableHead>
                <TableHead>{t("periods.columns.closedBy")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => {
                const label = periodLabel(period.year, period.month, language);
                const closed = period.status === "closed";
                return (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell>
                      <Badge tone={closed ? "neutral" : "ok"}>
                        {t(`domain.periodStatus.${closed ? "closed" : "open"}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(period.closedAt)}</TableCell>
                    <TableCell>{period.closedBy ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {!closed && canClose ? (
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="outline">
                              <Lock className="mr-1 h-4 w-4" />
                              {t("periods.close")}
                            </Button>
                          }
                          title={t("periods.close")}
                          description={t("periods.closeConfirm", { period: label })}
                          sensitive
                          onConfirm={() => close.mutate(period.id)}
                        />
                      ) : null}
                      {closed && canReopen ? (
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="outline">
                              <LockOpen className="mr-1 h-4 w-4" />
                              {t("periods.reopen")}
                            </Button>
                          }
                          title={t("periods.reopen")}
                          description={t("periods.reopenHint")}
                          requireReason
                          sensitive
                          destructive
                          onConfirm={(reason) => reopen.mutate({ id: period.id, reason })}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      </QueryState>
    </div>
  );
}
