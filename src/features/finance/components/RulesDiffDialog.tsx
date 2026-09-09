import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { GitCompare } from "lucide-react";
import { billingApi } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QueryState } from "@/components/common/QueryState";

/** Ikki qoida versiyasi farqi (`GET /billing-rules/:id/diff?against=`). */
export function RulesDiffDialog({ rulesId, againstId }: { rulesId: string; againstId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const diff = useQuery({
    queryKey: ["billing", "rules", rulesId, "diff", againstId],
    queryFn: () => billingApi.rulesDiff(rulesId, againstId),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <GitCompare className="mr-1 h-4 w-4" />
          {t("billing.rules.diff")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("billing.rules.diff")}</DialogTitle>
        </DialogHeader>
        <QueryState isLoading={diff.isLoading} error={diff.error} rows={3}>
          <pre className="max-h-[460px] overflow-auto rounded-xl bg-secondary p-3 text-xs">
            {JSON.stringify(diff.data ?? {}, null, 2)}
          </pre>
        </QueryState>
      </DialogContent>
    </Dialog>
  );
}
