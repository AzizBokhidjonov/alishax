import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Calculator, Trash2 } from "lucide-react";
import type { BillingRun } from "@/api";
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Money } from "@/components/common/Money";
import { FilterBar } from "@/components/common/FilterBar";
import { TableCard } from "@/components/common/TableCard";
import { SelectField } from "@/components/common/SelectField";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { currentPeriod, periodLabel } from "@/lib/dates";
import { cn, focusRing } from "@/lib/utils";
import { useIdempotencyKey } from "@/lib/idempotency";
import { useLanguage } from "@/i18n/useLanguage";
import { BillingExplainDialog } from "./BillingExplainDialog";
import { UnfinishedRunsPanel } from "./UnfinishedRunsPanel";
import { useCommitBilling, useDiscardBilling, usePreviewBilling } from "../api";

/**
 * Ikki bosqichli hisoblash: oldindan ko'rish saqlanadi, «tasdiqlash»
 * esa bitta tranzaksiyada bajariladi va `Idempotency-Key` talab qiladi.
 */
export function BillingRunTab() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { can } = usePermissions();
  const [period, setPeriod] = useState(currentPeriod());
  const [run, setRun] = useState<BillingRun | null>(null);

  const preview = usePreviewBilling();
  const commit = useCommitBilling();
  const discard = useDiscardBilling();
  const idempotency = useIdempotencyKey();

  const canGenerate = can(P.chargeGenerate);
  const label = periodLabel(run?.year ?? period.year, run?.month ?? period.month, language);

  return (
    <div className="space-y-4">
      <FilterBar>
        <div className="space-y-1">
          <Label>{t("common.labels.year")}</Label>
          <Input
            type="number"
            className="h-11 w-28"
            value={period.year}
            onChange={(event) =>
              setPeriod((current) => ({ ...current, year: Number(event.target.value) }))
            }
          />
        </div>
        <SelectField
          label={t("common.labels.month")}
          value={String(period.month)}
          onChange={(value) => setPeriod((current) => ({ ...current, month: Number(value) }))}
          options={Array.from({ length: 12 }).map((_, index) => ({
            value: String(index + 1),
            label: periodLabel(period.year, index + 1, language),
          }))}
          triggerClassName="w-48"
        />
        {canGenerate ? (
          <Button
            className="h-11"
            disabled={preview.isPending}
            onClick={() =>
              preview.mutate(period, {
                onSuccess: (result) => {
                  setRun(result);
                  idempotency.reset();
                },
              })
            }
          >
            <Calculator className="mr-2 h-4 w-4" />
            {t("billing.preview.create")}
          </Button>
        ) : null}
      </FilterBar>

      {!run ? (
        <div className="space-y-4">
          {/*
            Yarim qolgan yurish bo'lsa, u bo'sh ekrandan OLDIN ko'rinadi:
            «yana boshidan hisoblash» eng ko'p uchraydigan ortiqcha ish edi.
          */}
          <UnfinishedRunsPanel
            onResume={(resumed) => {
              setRun(resumed);
              setPeriod({ year: resumed.year, month: resumed.month });
              idempotency.reset();
            }}
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">{t("billing.preview.children")}</div>
                <div className="text-2xl font-bold">
                  {run.childrenCount ?? run.lines?.length ?? 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">{t("billing.preview.total")}</div>
                <Money value={run.totalTiyin} className="text-2xl font-bold" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Badge tone={run.status === "committed" ? "ok" : "info"}>
                  {t(`domain.billingRunStatus.${run.status}`)}
                </Badge>
                {canGenerate && run.status === "preview" ? (
                  <div className="ml-auto flex gap-2">
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="mr-1 h-4 w-4" />
                          {t("billing.preview.discard")}
                        </Button>
                      }
                      title={t("billing.preview.discard")}
                      destructive
                      onConfirm={() => discard.mutate(run.id, { onSuccess: () => setRun(null) })}
                    />
                    <ConfirmDialog
                      trigger={<Button size="sm">{t("billing.commit.action")}</Button>}
                      title={t("billing.commit.title")}
                      description={t("billing.commit.text", {
                        period: label,
                        count: run.lines?.length ?? run.childrenCount ?? 0,
                      })}
                      sensitive
                      onConfirm={() =>
                        commit.mutate(
                          { id: run.id, idempotencyKey: idempotency.get() },
                          {
                            onSuccess: (result) => {
                              setRun(result);
                              idempotency.reset();
                            },
                          },
                        )
                      }
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {run.warnings && run.warnings.length > 0 ? (
            <Card className="border-st-warn-border bg-st-warn-soft">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-st-warn-fg">
                  <AlertTriangle className="h-4 w-4" />
                  {t("billing.preview.warnings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-st-warn-fg">
                {run.warnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <TableCard title={t("billing.preview.lines")}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.labels.child")}</TableHead>
                  <TableHead>{t("common.labels.group")}</TableHead>
                  <TableHead>{t("common.labels.amount")}</TableHead>
                  <TableHead className="text-right">{t("common.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(run.lines ?? []).map((line, index) => (
                  <TableRow key={`${line.childId}-${line.kind}-${index}`}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-1.5">
                        <Link
                          to="/bolalar/$id"
                          params={{ id: line.childId }}
                          className={cn("rounded-sm hover:underline", focusRing)}
                        >
                          {line.childName ?? t("flows.unknownName")}
                        </Link>
                        {line.warnings && line.warnings.length > 0 ? (
                          <span
                            title={line.warnings.join(", ")}
                            className="text-st-warn-fg"
                            aria-label={t("billing.preview.warnings")}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell>{line.groupName ?? "—"}</TableCell>
                    <TableCell>
                      <Money value={line.amountTiyin} />
                    </TableCell>
                    <TableCell className="text-right">
                      <BillingExplainDialog runId={run.id} childId={line.childId} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}
    </div>
  );
}
