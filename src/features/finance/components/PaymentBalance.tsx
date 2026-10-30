import { useTranslation } from "react-i18next";
import { useChildDebt } from "../api";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/common/Money";
import { QueryState } from "@/components/common/QueryState";
import { tiyinToSomInput, toBigInt } from "@/lib/money";

export function PaymentBalance({
  childId,
  onUse,
}: {
  childId: string;
  onUse: (value: string) => void;
}) {
  const { t } = useTranslation();
  const debt = useChildDebt(childId);
  if (!childId) return null;
  return (
    <QueryState
      isLoading={debt.isLoading}
      error={debt.error}
      onRetry={() => void debt.refetch()}
      rows={1}
    >
      {debt.data ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary p-3 text-sm">
          <div>
            {t("debts.card.title")}:{" "}
            <Money value={debt.data.currentDebt} className="font-semibold" />
          </div>
          {toBigInt(debt.data.currentDebt) > 0n ? (
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => onUse(tiyinToSomInput(debt.data!.currentDebt))}
            >
              {t("flows.useDebt")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </QueryState>
  );
}
