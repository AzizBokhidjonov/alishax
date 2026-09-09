import { useSyncExternalStore } from "react";
import { attendanceApi, isApiError } from "@/api";

/**
 * Kirish qaydlari navbati — eshik oldidagi uzilishlarga chidamlilik (§4.9).
 *
 * Ertalabki navbatda planshet wifi'si uziladi, ota-ona esa qarshida turadi.
 * So'rov muvaffaqiyatsiz bo'lsa ekranni ORQAGA QAYTARISH eng yomon javob:
 * qabulxona bolani ikkinchi marta belgilaydi yoki umuman belgilamay ketadi.
 *
 * Shuning uchun tarmoq nosozligida optimistik holat EKRANDA QOLADI, qayd esa
 * shu navbatga tushadi va fonda qayta yuboriladi. Bu xavfsiz: bazadagi
 * `UNIQUE(tenant, child, date)` cheklovi tufayli takroriy so'rov yangi yozuv
 * yaratmaydi, `409 ALREADY_CHECKED_IN` esa muvaffaqiyat kabi qaraladi.
 *
 * Navbat DIQQAT bilan xotirada saqlanadi: sahifa yangilansa yo'qoladi, lekin
 * shu paytgacha qayd allaqachon serverga yetgan yoki taxta uni «belgilanmagan»
 * ko'rinishida qaytadan ko'rsatadi — ya'ni yo'qolgan qayd jimgina yo'qolmaydi.
 */
interface QueuedCheckIn {
  childId: string;
  /** Nechanchi urinish — kechikish shundan hisoblanadi. */
  attempts: number;
}

interface QueueHandlers {
  /** Har navbat urinishidan keyin — keshni yangilash uchun. */
  onSettled?: () => void;
  /** Qayta urinib bo'lmaydigan xato — qayd navbatdan chiqarildi. */
  onGiveUp?: (childId: string, error: unknown) => void;
}

const MAX_DELAY_MS = 30_000;

const queue = new Map<string, QueuedCheckIn>();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
let handlers: QueueHandlers = {};

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Qayta urinishga arziydigan nosozlik: tarmoq uzilishi (`ApiError` umuman
 * kelmaydi) yoki server tomonidagi vaqtinchalik holat. `403`, `404`, `422`
 * kabi javoblar takrorlansa ham o'zgarmaydi — ular navbatda saqlanmaydi.
 */
export function isRetryable(error: unknown): boolean {
  if (!isApiError(error)) return true;
  return error.status >= 500 || error.status === 429;
}

/** Navbatdagi qaydlar soni — «3 ta yuborilmoqda» ko'rsatkichi uchun. */
export function usePendingCheckIns(): number {
  return useSyncExternalStore(
    subscribe,
    () => queue.size,
    () => 0, // SSR: navbat faqat brauzerda yashaydi.
  );
}

export function setCheckInQueueHandlers(next: QueueHandlers): void {
  handlers = next;
}

export function enqueueCheckIn(childId: string): void {
  // Bir bola — bitta yozuv: takroriy bosish navbatni shishirmaydi.
  if (queue.has(childId)) return;
  queue.set(childId, { childId, attempts: 1 });
  emit();
  schedule();
}

/** Eksponensial kechikish: 2s, 4s, 8s … 30s dan oshmaydi. */
function schedule(): void {
  if (timer || queue.size === 0) return;
  const attempts = Math.min(...[...queue.values()].map((item) => item.attempts));
  timer = setTimeout(() => void flushCheckInQueue(), Math.min(1000 * 2 ** attempts, MAX_DELAY_MS));
}

export async function flushCheckInQueue(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (queue.size === 0) return;

  for (const item of [...queue.values()]) {
    try {
      await attendanceApi.checkIn({ childId: item.childId });
      queue.delete(item.childId);
    } catch (error) {
      // Yozuv allaqachon bor — aynan shuni xohlagan edik.
      if (isApiError(error) && error.code === "ALREADY_CHECKED_IN") {
        queue.delete(item.childId);
        continue;
      }
      if (!isRetryable(error)) {
        queue.delete(item.childId);
        handlers.onGiveUp?.(item.childId, error);
        continue;
      }
      item.attempts += 1;
    }
  }

  emit();
  handlers.onSettled?.();
  schedule();
}

// Aloqa tiklanishi — kutishning eng aniq belgisi: darhol urinib ko'ramiz.
if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flushCheckInQueue());
}
