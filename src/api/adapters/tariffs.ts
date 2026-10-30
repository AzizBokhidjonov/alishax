import type { ChildTariff, Tariff } from "../types";
export type ChildTariffResponse = ChildTariff & { tariff?: Tariff | null };
/** Server tarifni ichki obyekt sifatida beradi; yo‘q summa nol emas. */
export function normalizeChildTariff(row: ChildTariffResponse): ChildTariff {
  return {
    ...row,
    tariffName: row.tariffName ?? row.tariff?.name,
    kind: row.kind ?? row.tariff?.kind,
    amountTiyin: row.amountTiyin ?? row.tariff?.amountTiyin,
  };
}
