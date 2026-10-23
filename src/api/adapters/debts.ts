import { z } from "zod";
import { addTiyin } from "@/lib/money";
import type { ChildDebt, DebtRow, DebtSummary } from "../types";

const tiyin = z.string().regex(/^-?\d+$/);
const ageing = z.object({
  notOverdue: tiyin,
  d1_7: tiyin,
  d8_30: tiyin,
  d30plus: tiyin,
});
const childDebt = z.object({
  childId: z.string(),
  currentChargeTiyin: tiyin,
  previousDebtTiyin: tiyin,
  totalPaidTiyin: tiyin,
  advanceBalanceTiyin: tiyin,
  currentDebtTiyin: tiyin,
  overdueAmountTiyin: tiyin,
  ageing,
});
const debtRow = z.object({
  childId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  debtTiyin: tiyin,
  advanceTiyin: tiyin,
});
const debtSummary = z.object({
  byGroup: z.array(
    z.object({
      groupId: z.string().nullable(),
      groupName: z.string().nullable(),
      totalDebtTiyin: tiyin,
    }),
  ),
  ageing,
});

// Pul maydoni yo'q bo'lsa, yolg'on nol ko'rsatish o'rniga so'rov xatosi qaytariladi.
export function normalizeChildDebt(value: unknown): ChildDebt {
  const row = childDebt.parse(value);
  return {
    childId: row.childId,
    currentCharge: row.currentChargeTiyin,
    previousDebt: row.previousDebtTiyin,
    totalPaid: row.totalPaidTiyin,
    advanceBalance: row.advanceBalanceTiyin,
    currentDebt: row.currentDebtTiyin,
    overdueAmount: row.overdueAmountTiyin,
    ageing: row.ageing,
  };
}

export function normalizeDebtRow(value: unknown): DebtRow {
  const row = debtRow.parse(value);
  return {
    childId: row.childId,
    childName: [row.lastName, row.firstName].join(" ").trim(),
    currentDebt: row.debtTiyin,
    advanceBalance: row.advanceTiyin,
  };
}

export function normalizeDebtSummary(value: unknown): DebtSummary {
  const summary = debtSummary.parse(value);
  return {
    totalDebt: addTiyin(...summary.byGroup.map((group) => group.totalDebtTiyin)),
    byGroup: summary.byGroup.map((group) => ({
      groupId: group.groupId,
      groupName: group.groupName,
      amountTiyin: group.totalDebtTiyin,
    })),
    byAgeing: summary.ageing,
  };
}
