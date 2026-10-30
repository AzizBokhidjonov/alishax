import { useTranslation } from "react-i18next";

import { History } from "lucide-react";
import { billingApi, type BillingRun } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/common/Money";
import { formatDateTime } from "@/lib/dates";
import { formatPeriod } from "@/lib/billing-labels";
import { QueryState } from "@/components/common/QueryState";
import { useApiMutation } from "@/lib/query";
import { useBillingRuns } from "../api";

/** Saqlangan hisoblashlar: loyihani davom ettirish yoki tasdiqlangan natijani ko‘rish. */
export function UnfinishedRunsPanel({ onResume }: { onResume: (run: BillingRun) => void }) {
  const { t, i18n } = useTranslation();
  const runs = useBillingRuns();

  /*
    Ro'yxatdagi yozuvda `lines` bo'lmasligi mumkin, ekran esa satrlarni
    ko'rsatadi — shuning uchun tiklashda to'liq yurish qayta o'qiladi.
  */
  const load = useApiMutation({
    mutationFn: (id: string) => billingApi.run(id),
    onSuccess: onResume,
  });

  const list = (runs.data?.data ?? []).filter((run) => run.status !== "discarded");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History aria-hidden className="h-4 w-4" />
          {t("billing.unfinished.title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("billing.unfinished.hint")}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <QueryState
          isLoading={runs.isLoading}
          error={runs.error}
          isEmpty={list.length === 0}
          emptyTitle={t("billing.preview.empty")}
          emptyDescription=""
          onRetry={() => void runs.refetch()}
        >
          {list.map((run) => (
            <div
              key={run.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
            >
              <span className="font-semibold tabular-nums">{formatPeriod(run, i18n.language)}</span>
              <span className="text-sm">{t(`domain.billingRunStatus.${run.status}`)}</span>
              <Money value={run.totalTiyin} className="font-medium" />
              <span className="text-sm text-muted-foreground">
                {run.childrenCount ?? run.lines?.length ?? 0} {t("billing.preview.children")}
              </span>
              {run.createdAt ? (
                <span className="text-sm text-muted-foreground">
                  {formatDateTime(run.createdAt)}
                </span>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                disabled={load.isPending}
                onClick={() => load.mutate(run.id)}
              >
                {run.status === "preview"
                  ? t("billing.unfinished.resume")
                  : t("common.actions.view")}
              </Button>
            </div>
          ))}
        </QueryState>
      </CardContent>
    </Card>
  );
}
