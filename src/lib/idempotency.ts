import { useCallback, useRef } from "react";

/**
 * Moliyaviy amallar uchun `Idempotency-Key` (Integration Guide §8).
 *
 * Kalit amal BOSHLANGANDA yaratiladi va qayta urinishlarda o'zgarmaydi —
 * shu sababli ikki marta bosish yoki tarmoq uzilishi dublikat yaratmaydi.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

/**
 * Forma ochilganda kalit beradi va qayta urinishda o'shani qaytaradi.
 * `reset()` — muvaffaqiyatli saqlangandan keyin yangi amal uchun.
 */
export function useIdempotencyKey(): { get: () => string; reset: () => void } {
  const keyRef = useRef<string | null>(null);

  const get = useCallback(() => {
    if (!keyRef.current) keyRef.current = newIdempotencyKey();
    return keyRef.current;
  }, []);

  const reset = useCallback(() => {
    keyRef.current = null;
  }, []);

  return { get, reset };
}
