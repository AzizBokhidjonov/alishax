/**
 * UI modellari va backend so'rov turlari.
 *
 * OpenAPI so'rov shartnomasini saqlaydi. Javoblarni UI shakliga aylantirish
 * `api/adapters` da bajariladi va backend shaklidagi testlar bilan tekshiriladi.
 */

/** Butun tiyin, satr ko'rinishida: "150000000" = 1 500 000,00 so'm. */
export type Tiyin = string;
/** Kalendar sana `yyyy-MM-dd`, Asia/Tashkent. */
export type IsoDate = string;
/** Vaqt tamg'asi, ofset bilan: `2026-07-29T08:14:00+05:00`. */
export type IsoDateTime = string;
export type Id = string;

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface ListParams {
  page?: number;
  limit?: number;
  /** `field:asc` yoki `field:desc`. */
  sort?: string;
  q?: string;
}

/** Ruxsat qamrovi — kengligi bo'yicha: all > branch > own_group > today > self. */
export type Scope = "all" | "branch" | "own_group" | "today" | "self";

export const LIST_LIMIT_DEFAULT = 50;
export const LIST_LIMIT_MAX = 200;

/** Ro'yxat javobi sahifalanmagan holda kelsa ham bir xil shaklga keltiradi. */
export function toPage<T>(response: Paginated<T> | T[] | undefined | null): Paginated<T> {
  if (Array.isArray(response)) {
    return {
      data: response,
      meta: { page: 1, limit: response.length, total: response.length, pages: 1 },
    };
  }
  return response ?? { data: [], meta: { page: 1, limit: LIST_LIMIT_DEFAULT, total: 0, pages: 0 } };
}
