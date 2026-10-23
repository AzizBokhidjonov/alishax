import { useTranslation } from "react-i18next";
import type { BillingExplain } from "@/api";
import { Money } from "@/components/common/Money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { addTiyin } from "@/lib/money";

export function BillingExplanationLines({ lines }: { lines: BillingExplain[] }) {
  const { t } = useTranslation();
  return (
    <div className="max-h-[65vh] space-y-4 overflow-y-auto">
      {lines.map((line, lineIndex) => (
        <section key={line.id ?? `${line.childId}-${line.kind}-${lineIndex}`} className="space-y-2">
          <div className="text-sm font-medium">
            {[line.childName, line.label ?? line.kind].filter(Boolean).join(" · ")}
          </div>
          {line.trace?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("billing.explain.step")}</TableHead>
                  <TableHead>{t("billing.explain.amount")}</TableHead>
                  <TableHead>{t("billing.explain.note")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {line.trace.map((step, index) => (
                  <TableRow key={`${step.step}-${index}`}>
                    <TableCell className="font-medium">{step.step}</TableCell>
                    <TableCell>
                      {step.amount != null ? <Money value={step.amount} hideCurrency /> : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {step.note ?? step.factor ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">{t("billing.explain.empty")}</p>
          )}
          <div className="flex justify-between text-sm font-semibold">
            <span>{t("common.labels.amount")}</span>
            <Money value={line.amountTiyin} />
          </div>
        </section>
      ))}
      <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
        <span>{t("billing.preview.total")}</span>
        <Money value={addTiyin(...lines.map((line) => line.amountTiyin))} />
      </div>
    </div>
  );
}
