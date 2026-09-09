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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Money } from "@/components/common/Money";
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
          isEmpty={!data?.trace?.length}
          emptyTitle={t("billing.explain.empty")}
          rows={3}
        >
          <div className="space-y-3">
            <div className="text-sm font-medium">{data?.childName}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("billing.explain.step")}</TableHead>
                  <TableHead>{t("billing.explain.amount")}</TableHead>
                  <TableHead>{t("billing.explain.note")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.trace ?? []).map((step, index) => (
                  <TableRow key={`${step.step}-${index}`}>
                    <TableCell className="font-medium">{step.step}</TableCell>
                    <TableCell>
                      <Money value={step.amount} hideCurrency />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {step.note ?? step.factor ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {data?.amountTiyin ? (
              <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
                <span>{t("billing.preview.total")}</span>
                <Money value={data.amountTiyin} />
              </div>
            ) : null}
          </div>
        </QueryState>
      </DialogContent>
    </Dialog>
  );
}
