import type { Discount } from "../types";

export type DiscountResponse = Omit<Discount, "value"> & {
  value?: string | number | null;
  valueBp?: number | null;
  valueTiyin?: string | null;
};

export function normalizeDiscount(row: DiscountResponse): Discount {
  const value = row.value ?? (row.kind === "percent" ? row.valueBp : row.valueTiyin);
  // Noma'lum chegirmani nol deb ko'rsatmaslik kerak.
  if (value == null || !/^\d+$/.test(String(value))) {
    throw new Error("Invalid discount value");
  }
  return { ...row, value: String(value) };
}
