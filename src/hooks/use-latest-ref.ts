import { useEffect, useRef, type RefObject } from "react";

/**
 * Qiymatning eng so'nggi nusxasini ref'da saqlaydi.
 *
 * Hodisa ishlov beruvchisiga qiymat kerak, lekin uni `useCallback`
 * bog'liqligiga qo'shsak, ishlov beruvchi identifikatori har safar
 * o'zgaradi va `memo` bilan o'ralgan qatorlar behuda qayta render bo'ladi.
 * Ref orqali o'qish esa identifikatorni barqaror saqlaydi.
 */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
