import { addTiyin } from "@/lib/money";
import type { BillingExplain, BillingRun, BillingRunLine, BillingTraceStep } from "../types";

export interface BillingLineResponse extends BillingRunLine {
  id?: string;
  tariffId?: string;
  tariffName?: string;
  description?: string | null;
  trace?: BillingTraceStep[];
  calculationTrace?: BillingTraceStep[] | null;
}

export interface BillingRunResponse extends Omit<
  BillingRun,
  "year" | "month" | "childrenCount" | "lines"
> {
  accountingPeriod?: { year: number; month: number };
  childCount: number | null;
  previewData?: BillingLineResponse[] | null;
  lines?: BillingLineResponse[];
  charges?: BillingLineResponse[];
}

export function normalizeBillingRun(
  response: BillingRunResponse,
  requestedPeriod?: { year: number; month: number },
): BillingRun {
  const period = response.accountingPeriod ?? requestedPeriod;
  if (!period) throw new Error("Billing run is missing its accounting period");
  const lines = (response.charges ?? response.lines ?? response.previewData ?? []).map((line) => {
    const preview = response.previewData?.find(
      (item) => item.childId === line.childId && item.kind === line.kind,
    );
    return {
      ...line,
      childName: line.childName ?? preview?.childName,
      groupName: line.groupName ?? preview?.groupName,
      tariffName: line.tariffName ?? preview?.tariffName,
    };
  });
  return {
    ...response,
    year: period.year,
    month: period.month,
    childrenCount: response.childCount ?? new Set(lines.map((line) => line.childId)).size,
    lines,
    totalTiyin: response.totalTiyin ?? addTiyin(...lines.map((line) => line.amountTiyin)),
  };
}

export function normalizeBillingExplanation(response: BillingLineResponse[]): BillingExplain[] {
  return response.map((line) => ({
    id: line.id,
    childId: line.childId,
    childName: line.childName,
    kind: line.kind,
    label: line.tariffName ?? line.description ?? undefined,
    amountTiyin: line.amountTiyin,
    trace: line.calculationTrace ?? line.trace ?? [],
  }));
}
