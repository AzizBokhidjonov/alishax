import type { ReportPath } from "@/api";

export interface ReportDef {
  path: ReportPath;
  group: "attendance" | "children" | "finance" | "expenses";
  /** Qaysi filtrlar kerak. */
  filters: ("range" | "date" | "group" | "period" | "month" | "method")[];
}

export const REPORTS: ReportDef[] = [
  { path: "attendance/daily", group: "attendance", filters: ["date", "group"] },
  { path: "attendance/monthly", group: "attendance", filters: ["month", "group"] },
  { path: "attendance/corrections", group: "attendance", filters: ["range"] },
  { path: "children/active", group: "children", filters: ["group"] },
  { path: "children/enrollments", group: "children", filters: ["range"] },
  { path: "children/documents-expiring", group: "children", filters: [] },
  { path: "children/medical-alerts", group: "children", filters: [] },
  { path: "finance/charges", group: "finance", filters: ["period"] },
  { path: "finance/payments", group: "finance", filters: ["range", "method"] },
  { path: "finance/debts", group: "finance", filters: [] },
  { path: "finance/discounts", group: "finance", filters: ["range"] },
  { path: "finance/cancellations", group: "finance", filters: ["range"] },
  { path: "expenses/monthly", group: "expenses", filters: ["month"] },
];
