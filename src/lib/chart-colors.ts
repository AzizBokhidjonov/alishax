import { useEffect, useState } from "react";

/**
 * Recharts SVG atributlarida `var(--...)` ishonchli ishlamaydi, shuning uchun
 * token qiymatlari brauzerda hisoblab olinadi. SSR paytida zaxira qiymat
 * ishlatiladi — grafik birinchi renderdayoq to'g'ri ko'rinadi.
 */

export const CHART_TOKENS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const;

export type ChartToken = (typeof CHART_TOKENS)[number];

/** SSR va token o'qilmagan holat uchun zaxira ranglar (brend palitrasi). */
const FALLBACK: Record<ChartToken, string> = {
  "chart-1": "#FAB504",
  "chart-2": "#66CFEC",
  "chart-3": "#211964",
  "chart-4": "#F7485D",
  "chart-5": "#6B5FA8",
};

function readToken(token: ChartToken): string {
  if (typeof window === "undefined") return FALLBACK[token];
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${token}`)
    .trim();
  return value || FALLBACK[token];
}

/**
 * Grafik ranglarini CSS tokenlaridan o'qiydi.
 * Mavzu (light/dark) almashsa qiymatlar qayta hisoblanmaydi — grafiklar
 * har ikkala mavzuda ham o'qilarli tokenlardan foydalanadi.
 */
export function useChartColors(): Record<ChartToken, string> {
  const [colors, setColors] = useState<Record<ChartToken, string>>(FALLBACK);

  useEffect(() => {
    const next = {} as Record<ChartToken, string>;
    CHART_TOKENS.forEach((token) => {
      next[token] = readToken(token);
    });
    setColors(next);
  }, []);

  return colors;
}
