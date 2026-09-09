import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableCard } from "@/components/common/TableCard";
import { Badge } from "@/components/common/StatusBadge";
import { QueryState } from "@/components/common/QueryState";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { cn, focusRing } from "@/lib/utils";
import { formatDate } from "@/lib/dates";
import { useBillingRules } from "../api";
import { RulesDiffDialog } from "./RulesDiffDialog";
import { RulesFormDialog, SimulateDialog } from "./RulesDialogs";

export function BillingRulesTab() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { data, isLoading, error, refetch } = useBillingRules();
  const [selected, setSelected] = useState<string | null>(null);
  const canManage = can(P.tariffManage);

  const versions = data ?? [];
  const active = versions.find((version) => !version.effectiveTo);
  const current = versions.find((version) => version.id === selected) ?? active;

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex flex-wrap justify-end gap-2">
          <SimulateDialog />
          <RulesFormDialog template={active?.rules} />
        </div>
      ) : null}

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={versions.length === 0}
        emptyTitle={t("billing.rules.empty")}
        onRetry={() => void refetch()}
        rows={3}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TableCard title={t("billing.rules.title")}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("billing.rules.version", { version: "" })}</TableHead>
                  <TableHead>{t("billing.rules.effectiveFrom")}</TableHead>
                  <TableHead>{t("billing.rules.note")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow
                    key={version.id}
                    data-state={selected === version.id ? "selected" : undefined}
                  >
                    <TableCell className="font-medium">
                      {/*
                          Ilgari butun qatorda `onClick` bor edi, lekin
                          `tabIndex` ham, klaviatura ishlovchisi ham yo'q edi —
                          sichqonchasiz versiyani tanlab bo'lmasdi. Endi
                          tanlash tugma orqali: fokus va Enter tabiiy ishlaydi.
                        */}
                      <button
                        type="button"
                        onClick={() => setSelected(version.id)}
                        aria-pressed={selected === version.id}
                        className={cn("rounded-sm hover:underline", focusRing)}
                      >
                        v{version.version}
                      </button>
                      {!version.effectiveTo ? (
                        <Badge tone="ok" className="ml-2">
                          {t("billing.rules.active")}
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatDate(version.effectiveFrom)}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{version.note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                {current ? t("billing.rules.version", { version: current.version }) : "—"}
              </CardTitle>
              {current && active && current.id !== active.id ? (
                <RulesDiffDialog rulesId={current.id} againstId={active.id} />
              ) : null}
            </CardHeader>
            <CardContent>
              <pre className="max-h-[420px] overflow-auto rounded-xl bg-secondary p-3 text-xs">
                {JSON.stringify(current?.rules ?? {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </QueryState>
    </div>
  );
}
