import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { billingApi } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BillingExplanationLines } from "./BillingExplanationLines";
import { QueryState } from "@/components/common/QueryState";

/**
 * «Nega bu summa?» — hisoblash izohi (`/billing-runs/:id/explain/:childId`).
 * Har bir bosqich va oraliq natija ko'rsatiladi.
 */
export function BillingExplainDialog({ runId, childId }: { runId: string; childId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["billing", "explain", runId, childId],
    queryFn: () => billingApi.explain(runId, childId),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Info className="mr-1 h-4 w-4" />
          {t("billing.preview.explain")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("billing.explain.title")}</DialogTitle>
        </DialogHeader>
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={data?.length === 0}
          emptyTitle={t("billing.explain.empty")}
          rows={3}
        >
          <BillingExplanationLines lines={data ?? []} />
        </QueryState>
      </DialogContent>
    </Dialog>
  );
}
