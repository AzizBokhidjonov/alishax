import { useCallback, type Dispatch, type SetStateAction } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

type Scalar = string | number | boolean;

/**
 * Boshlang'ich qiymat literal turini kengaytiradi: `"all"` -> `string`.
 * Aks holda `setValue("cash")` ni TypeScript rad etardi.
 */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T;
type SearchRecord = Record<string, string | number | undefined>;

/**
 * Manzilda saqlanadigan ko'rinish holati (§2.8).
 *
 * `useStickyState` ning o'rnini bosadi: imzosi bir xil, lekin qiymat modul
 * xotirasida emas, `?kalit=qiymat` ko'rinishida manzilda turadi. Shu sababli
 * sahifani yangilash filtrni yo'qotmaydi va topilgan ro'yxatni havola qilib
 * yuborsa bo'ladi — qo'llanmaning qabul mezoni aynan shuni talab qiladi.
 *
 * `scope` «bo'lim.maydon» ko'rinishida beriladi (`payments.method`); manzilga
 * faqat maydon nomi tushadi — har route o'z manziliga ega, prefiks ortiqcha.
 */
export function useUrlState<T extends Scalar>(
  scope: string,
  initial: T,
): [Widen<T>, Dispatch<SetStateAction<Widen<T>>>] {
  const key = scope.split(".").pop() ?? scope;
  const search = useSearch({ strict: false }) as SearchRecord;
  const navigate = useNavigate();

  const raw = search[key];

  // Manzil har doim satr beradi — turni boshlang'ich qiymatdan tiklaymiz.
  let value: Widen<T>;
  if (raw === undefined || raw === "") {
    value = initial as Widen<T>;
  } else if (typeof initial === "number") {
    const parsed = Number(raw);
    value = (Number.isFinite(parsed) ? parsed : initial) as Widen<T>;
  } else if (typeof initial === "boolean") {
    value = (raw === "true" || raw === "1") as Widen<T>;
  } else {
    value = String(raw) as Widen<T>;
  }

  const setValue = useCallback<Dispatch<SetStateAction<Widen<T>>>>(
    (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: Widen<T>) => Widen<T>)(value) : next;

      void navigate({
        to: ".",
        search: (prev: SearchRecord) => {
          const merged: SearchRecord = { ...prev };
          // Boshlang'ich qiymat manzilda turmasin — havola qisqa bo'lsin.
          if (resolved === initial || resolved === "" || resolved === "all") delete merged[key];
          else merged[key] = typeof resolved === "boolean" ? String(resolved) : resolved;
          return merged;
        },
        replace: true,
      });
    },
    [initial, key, navigate, value],
  );

  return [value, setValue];
}
