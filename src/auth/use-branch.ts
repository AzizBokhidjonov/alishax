import { useCallback, useSyncExternalStore } from "react";
import { useAuth } from "./auth-context";

/**
 * Joriy filial (§3.1).
 *
 * Model ko'p filialli: `/auth/me` foydalanuvchiga tegishli `branchIds` ni
 * qaytaradi. Bittadan ko'p bo'lsa, qaysi filialda ishlayotgani HAR DOIM
 * ko'rinib turishi kerak — aks holda to'lov boshqa filialga yozilib ketishi
 * mumkin. Tanlov brauzerda saqlanadi: bu shaxsiy ish o'rni sozlamasi.
 */
const STORAGE_KEY = "alishax.branchId";

let current: string | null = null;
const listeners = new Set<() => void>();

function read(): string | null {
  if (current !== null) return current;
  if (typeof localStorage === "undefined") return null;
  current = localStorage.getItem(STORAGE_KEY);
  return current;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setCurrentBranch(branchId: string | null): void {
  current = branchId;
  if (typeof localStorage !== "undefined") {
    if (branchId) localStorage.setItem(STORAGE_KEY, branchId);
    else localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}

/**
 * Joriy filial identifikatori va uni almashtirish.
 *
 * `branchIds` bitta bo'lsa — o'sha filial, almashtirgich ko'rsatilmaydi.
 * Saqlangan tanlov endi ruxsat etilmagan bo'lsa (rol o'zgargan), birinchi
 * mavjud filialga qaytadi — eski tanlov `403 OUT_OF_SCOPE` keltirmasin.
 */
export function useBranch(): {
  branchId?: string;
  branchIds: string[];
  canSwitch: boolean;
  setBranch: (branchId: string) => void;
} {
  const { branchIds } = useAuth();
  const stored = useSyncExternalStore(
    subscribe,
    read,
    () => null, // SSR: server tanlovni bilmaydi.
  );

  const branchId = stored && branchIds.includes(stored) ? stored : branchIds[0];

  const setBranch = useCallback((next: string) => setCurrentBranch(next), []);

  return {
    branchId,
    branchIds,
    canSwitch: branchIds.length > 1,
    setBranch,
  };
}
