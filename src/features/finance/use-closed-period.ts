import { periodLabel } from "@/lib/dates";
import { usePeriods } from "./api";

/**
 * Sana yopilgan hisob davriga tushdimi (§4.7).
 *
 * Yopiq davrga yozish `409 PERIOD_CLOSED` bilan tugaydi. Buni SUBMIT'da emas,
 * sana tanlangan zahoti bilish kerak — aks holda foydalanuvchi butun formani
 * to'ldirib bo'lgach xato oladi.
 */
export function useClosedPeriod(date?: string): { closed: boolean; label: string } {
  const year = date ? Number(date.slice(0, 4)) : undefined;
  const month = date ? Number(date.slice(5, 7)) : undefined;
  const periods = usePeriods(year);

  const period = (periods.data ?? []).find((item) => item.year === year && item.month === month);

  return {
    closed: period?.status === "closed",
    label: year && month ? periodLabel(year, month) : "",
  };
}
