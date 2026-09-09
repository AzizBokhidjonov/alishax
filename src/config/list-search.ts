/**
 * Ro'yxat sahifalarining manzil parametrlari (§2.8).
 *
 * `validateSearch` e'lon qilinmagan parametrlarni router saqlashi kafolatlanmagan,
 * shuning uchun har bir ro'yxat route'i shu tekshiruvchini ishlatadi. Kalitlar
 * ochiq ro'yxat emas — filtr nomlari sahifadan sahifaga farq qiladi (`groupId`,
 * `status`, `method`, `kind`...), lekin qiymat har doim oddiy skalyar bo'ladi.
 */
export interface ListSearch {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  [key: string]: string | number | undefined;
}

/** Bo'sh va yaroqsiz qiymatlarni tashlab, qolganini satr/son sifatida qoldiradi. */
export function validateListSearch(search: Record<string, unknown>): ListSearch {
  const out: ListSearch = {};

  for (const [key, raw] of Object.entries(search)) {
    if (raw === undefined || raw === null || raw === "") continue;

    if (key === "page" || key === "limit") {
      const value = Number(raw);
      if (Number.isFinite(value) && value > 0) out[key] = Math.floor(value);
      continue;
    }

    if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
      out[key] = String(raw);
    }
  }

  return out;
}
