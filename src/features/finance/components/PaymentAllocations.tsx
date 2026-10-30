import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Wand2 } from "lucide-react";
import type { Charge } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/common/Money";
import { QueryState } from "@/components/common/QueryState";
import { addTiyin, subtractTiyin, tiyinToSomInput, toBigInt, toTiyin } from "@/lib/money";
import { useChildCharges } from "../api";

export type AllocationMap = Record<string, string>;

/**
 * Qo'lda taqsimlash: har bir ochiq hisobning QOLDIG'I ko'rsatiladi, kiritilgan
 * summalar yig'indisi to'lov summasi bilan solishtiriladi. Ortiqcha qism
 * avans bo'lib qoladi (server FIFO qoidasi bilan bir xil mantiq).
 */
export function PaymentAllocations({
  childId,
  amountSom,
  allocations,
  onChange,
}: {
  childId: string;
  amountSom: string;
  allocations: AllocationMap;
  onChange: (next: AllocationMap) => void;
}) {
  const { t } = useTranslation();
  const charges = useChildCharges(childId);

  const open = useMemo(
    () =>
      (charges.data ?? [])
        .filter((charge) => charge.sign !== -1 && !charge.reversedAt)
        .map((charge) => ({
          charge,
          remaining: subtractTiyin(charge.amountTiyin, charge.paidTiyin ?? "0"),
        }))
        .filter((row) => toBigInt(row.remaining) > 0n),
    [charges.data],
  );

  const allocated = addTiyin(
    ...Object.values(allocations)
      .filter((value) => value.trim() !== "")
      .map((value) => toTiyin(value)),
  );
  const total = amountSom.trim() ? toTiyin(amountSom) : "0";
  const rest = subtractTiyin(total, allocated);
  const over = toBigInt(rest) < 0n;

  /** Eng eski hisobdan boshlab to'lov summasini taqsimlaydi (FIFO). */
  const autoFill = () => {
    let left = toBigInt(total);
    const next: AllocationMap = {};
    for (const row of open) {
      if (left <= 0n) break;
      const take = toBigInt(row.remaining) < left ? toBigInt(row.remaining) : left;
      next[row.charge.id] = tiyinToSomInput(take.toString());
      left -= take;
    }
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{t("payments.form.allocationsManual")}</span>
        <Button type="button" size="sm" variant="outline" onClick={autoFill}>
          <Wand2 className="mr-1 h-4 w-4" />
          {t("payments.form.allocationsFill")}
        </Button>
      </div>

      <QueryState
        isLoading={charges.isLoading}
        error={charges.error}
        isEmpty={open.length === 0}
        emptyTitle={t("charges.empty")}
        rows={2}
      >
        <div className="space-y-2">
          {open.map(({ charge, remaining }) => (
            <div key={charge.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{charge.description ?? t("flows.charges")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("payments.form.remaining")}: <Money value={remaining} />
                </div>
              </div>
              <Input
                className="h-9 w-32 text-right tabular-nums"
                inputMode="decimal"
                aria-label={
                  (charge.description ?? t("flows.charges")) + " — " + t("payments.form.amount")
                }
                value={allocations[charge.id] ?? ""}
                onChange={(event) => onChange({ ...allocations, [charge.id]: event.target.value })}
              />
            </div>
          ))}
        </div>
      </QueryState>

      <div className="flex justify-between border-t border-border pt-2 text-sm">
        <span className="text-muted-foreground">{t("payments.form.allocated")}</span>
        <Money value={allocated} className="font-medium" />
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {over ? t("payments.form.overAllocated") : t("payments.form.toAdvance")}
        </span>
        <Money
          value={over ? rest.replace("-", "") : rest}
          className={over ? "font-semibold text-st-danger-fg" : "font-medium"}
        />
      </div>
    </div>
  );
}
