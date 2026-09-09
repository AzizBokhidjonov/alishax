import { useEffect, useState } from "react";
import { SEARCH_DEBOUNCE_MS } from "@/config/constants";

/**
 * Qiymatni kechiktirib qaytaradi. Qidiruv maydonida har bosilgan harfda
 * butun ro'yxatni qayta filtrlashning oldini oladi.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
