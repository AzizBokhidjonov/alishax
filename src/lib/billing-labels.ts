import type { TFunction } from "i18next";
import { periodLabel } from "./dates";

export function formatPeriod(period: { year: number; month: number }, language: string) {
  return periodLabel(period.year, period.month, language.startsWith("ru") ? "ru" : "uz");
}
export function chargeLabel(
  charge: { description?: string | null; reason?: string | null; kind?: string },
  t: TFunction,
) {
  return (
    charge.description?.trim() ||
    charge.reason?.trim() ||
    t("flows.chargeKinds." + (charge.kind ?? "other"), {
      defaultValue: t("domain.tariffKind." + charge.kind, { defaultValue: t("flows.charges") }),
    })
  );
}

export function billingTraceNote(note: string | undefined, kind: string | undefined, t: TFunction) {
  if (!note) return undefined;
  const separator = note.lastIndexOf(": ");
  const prefix = separator < 0 ? "" : note.slice(0, separator + 2);
  const detail = separator < 0 ? note : note.slice(separator + 2);
  const days = /^(\d+)\/(\d+) days$/.exec(detail);
  if (days) return prefix + t("flows.traceDays", { count: Number(days[1]), total: days[2] });
  if (detail === kind) return prefix + chargeLabel({ kind }, t);
  const known = [
    "no billable days in period",
    "zero",
    "full_tariff",
    "min_charge",
    "tiyin",
    "som",
    "1000_som",
  ];
  if (known.includes(detail)) return prefix + t("flows.traceNotes." + detail.replaceAll(" ", "_"));
  return note;
}
