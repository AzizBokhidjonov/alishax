import { toBigInt, toTiyin } from "@/lib/money";

export function validPaymentAllocation(amountSom: string, allocations: Record<string, string>) {
  const amounts = Object.values(allocations).filter((value) => value.trim() !== "");
  if (
    amounts.some(
      (value) => !/^\d+([.,]\d{1,2})?$/.test(value.trim()) || toBigInt(toTiyin(value)) <= 0n,
    )
  )
    return false;
  const total = amounts.reduce((sum, value) => sum + toBigInt(toTiyin(value)), 0n);
  return total <= toBigInt(toTiyin(amountSom));
}
