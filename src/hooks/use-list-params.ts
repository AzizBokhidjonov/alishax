import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX } from "@/api";
import { useDebouncedValue } from "./use-debounced-value";

export interface ListParamsState {
  page: number;
  limit: number;
  sort?: string;
  q: string;
  filters: Record<string, string>;
}

export interface ListParamsApi extends ListParamsState {
  /** So'rovga yuboriladigan tayyor obyekt (qidiruv kechiktirilgan). */
  query: Record<string, string | number | undefined>;
  /**
   * Boshlang'ich holatdan farq qiladigan filtrlar soni (qidiruv ham
   * sanaladi). Filtr paneli shu sonni ko'rsatadi va tozalash tugmasini
   * shunga qarab chiqaradi.
   */
  activeCount: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSort: (sort?: string) => void;
  setQuery: (value: string) => void;
  setFilter: (name: string, value: string) => void;
  reset: () => void;
}

type SearchRecord = Record<string, string | number | undefined>;

/**
 * Ro'yxat holati MANZILDA saqlanadi (Dizayn qo'llanmasi §2.8).
 *
 * Ilgari holat modul xotirasida edi: sahifani yangilash filtrni yo'qotardi
 * va topilgan ro'yxatni hamkasbga havola qilib yuborib bo'lmasdi. Endi
 * `?page&limit&sort&q&...filtrlar` manzilda turadi — F5 ham, havola ham
 * o'sha ko'rinishni qaytaradi.
 *
 * Yozish `replace: true` bilan: har harf brauzer tarixiga tushmasin, aks
 * holda «Orqaga» tugmasi qidiruvni harfma-harf orqaga qaytarardi.
 */
export function useListParams(
  initialFilters: Record<string, string> = {},
  initialSort?: string,
): ListParamsApi {
  const search = useSearch({ strict: false }) as SearchRecord;
  const navigate = useNavigate();

  const patch = useCallback(
    (next: SearchRecord) => {
      void navigate({
        to: ".",
        search: (prev: SearchRecord) => {
          const merged: SearchRecord = { ...prev, ...next };
          // Bo'sh qiymat manzilda turmasin — havola qisqa va toza bo'lsin.
          for (const key of Object.keys(merged)) {
            const value = merged[key];
            if (value === undefined || value === "" || value === "all") delete merged[key];
          }
          return merged;
        },
        replace: true,
      });
    },
    [navigate],
  );

  const page = Math.max(1, Number(search.page ?? 1) || 1);
  const limit = Math.min(
    LIST_LIMIT_MAX,
    Number(search.limit ?? LIST_LIMIT_DEFAULT) || LIST_LIMIT_DEFAULT,
  );
  const sort = (search.sort as string | undefined) ?? initialSort;
  const urlQuery = String(search.q ?? "");

  const filters = useMemo(() => {
    const next: Record<string, string> = { ...initialFilters };
    for (const name of Object.keys(initialFilters)) {
      const value = search[name];
      next[name] = value === undefined ? (initialFilters[name] ?? "") : String(value);
    }
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, JSON.stringify(initialFilters)]);

  /*
    Kiritilayotgan matn mahalliy holatda turadi: manzilga har harfda yozish
    kursorni sakratardi. Manzilga faqat kechiktirilgan qiymat tushadi.
  */
  const [typed, setTyped] = useState(urlQuery);
  const debounced = useDebouncedValue(typed);

  // Manzil tashqaridan o'zgarsa (havola, orqaga) maydon ham yangilanadi.
  useEffect(() => {
    setTyped((current) => (current === urlQuery ? current : urlQuery));
  }, [urlQuery]);

  useEffect(() => {
    if (debounced === urlQuery) return;
    patch({ q: debounced || undefined, page: undefined });
  }, [debounced, urlQuery, patch]);

  const setPage = useCallback((next: number) => patch({ page: Math.max(1, next) }), [patch]);

  const setLimit = useCallback(
    (next: number) => patch({ limit: Math.min(LIST_LIMIT_MAX, next), page: undefined }),
    [patch],
  );

  const setSort = useCallback((next?: string) => patch({ sort: next, page: undefined }), [patch]);

  const setQuery = useCallback((value: string) => setTyped(value), []);

  const setFilter = useCallback(
    (name: string, value: string) => patch({ [name]: value, page: undefined }),
    [patch],
  );

  const reset = useCallback(() => {
    setTyped("");
    const cleared: SearchRecord = { page: undefined, q: undefined };
    for (const name of Object.keys(initialFilters)) cleared[name] = undefined;
    patch(cleared);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patch, JSON.stringify(initialFilters)]);

  const query = useMemo(() => {
    const trimmed = debounced.trim();
    return { page, limit, sort, q: trimmed || undefined, ...filters };
  }, [page, limit, sort, debounced, filters]);

  /*
    «Yoqilgan» degani — boshlang'ich qiymatdan farq qilishi. Bo'sh satr va
    yo'q kalit bir xil hisoblanadi: `setFilter(name, "")` filtrni o'chirish
    usuli, uni yoqilgan deb sanash noto'g'ri bo'lardi.
  */
  const activeCount = useMemo(() => {
    let count = debounced.trim() ? 1 : 0;
    for (const name of Object.keys(initialFilters)) {
      if ((filters[name] ?? "") !== (initialFilters[name] ?? "")) count += 1;
    }
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, debounced, JSON.stringify(initialFilters)]);

  return {
    page,
    limit,
    sort,
    q: typed,
    filters,
    query,
    activeCount,
    setPage,
    setLimit,
    setSort,
    setQuery,
    setFilter,
    reset,
  };
}
