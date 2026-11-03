import { useSyncExternalStore } from "react";
import { attendanceApi, ApiError, isApiError, type AttendanceRecord } from "@/api";
import { todayIso } from "@/lib/dates";
import { arrivalDay, readArrivals, saveArrivals, type QueuedCheckIn } from "./checkin-storage";
import { bindCheckInEvents } from "./checkin-browser";

interface QueueHandlers {
  onSettled?: () => void;
  onGiveUp?: (childId: string, error: unknown) => void;
}
const queue = new Map<string, QueuedCheckIn>();
const listeners = new Set<() => void>();
const flights = new Map<string, Promise<AttendanceRecord>>();
const empty = { items: [] as QueuedCheckIn[], durable: true };
let snapshot = empty;
const paused = new Map<string, typeof empty>();
let scope: string | null = null;
let enabled = false;
let generation = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let handlers: QueueHandlers = {};

function emit(persist = true): void {
  const items = [...queue.values()];
  const durable = persist && scope ? saveArrivals(scope, items, snapshot.items) : snapshot.durable;
  snapshot = { items: items.map((item) => ({ ...item })), durable };
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function stopTimer(): void {
  if (timer) clearTimeout(timer);
  timer = null;
}
function schedule(): void {
  const pending = [...queue.values()].filter((item) => item.state === "pending");
  if (timer || !enabled || !pending.length) return;
  const attempt = Math.min(...pending.map((item) => item.attempts));
  timer = setTimeout(() => void flushCheckInQueue(), Math.min(1000 * 2 ** attempt, 30_000));
}

/** Chiqish boshlanishida chaqiriladi: eski javob yangi akkauntga ta'sir qilmaydi. */
export function setCheckInQueueScope(userId: string | null, canCheckIn: boolean): void {
  if (scope === userId && enabled === canCheckIn) return;
  generation += 1;
  stopTimer();
  if (scope) paused.set(scope, snapshot);
  queue.clear();
  flights.clear();
  scope = userId;
  enabled = Boolean(userId && canCheckIn);
  snapshot = empty;
  if (scope && typeof window !== "undefined") {
    const memory = paused.get(scope);
    const saved = memory && !memory.durable ? memory : readArrivals(scope);
    snapshot = { items: [], durable: saved.durable };
    for (const item of saved.items) {
      if (arrivalDay(item.at) !== todayIso()) {
        item.state = "review";
        item.errorCode = "USE_ATTENDANCE_CORRECTION";
      }
      queue.set(item.childId, item);
    }
  }
  emit(false);
  schedule();
}

export function isRetryable(error: unknown): boolean {
  return !isApiError(error) || error.status === 0 || error.status >= 500 || error.status === 429;
}
export function checkInQueueGeneration(): number {
  return generation;
}
export function useCheckInQueue() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => empty,
  );
}
export function usePendingCheckIns(): number {
  return useCheckInQueue().items.length;
}
export function setCheckInQueueHandlers(next: QueueHandlers): void {
  handlers = next;
}

/** Boshqa oynada tasdiqlangan/tekshirilgan qayd qayta yuborilmasin. */
function synchronize(): void {
  if (!scope || !snapshot.durable) return;
  const saved = readArrivals(scope);
  if (!saved.durable) {
    snapshot = { ...snapshot, durable: false };
    emit(false);
    return;
  }
  const existing = new Map(queue);
  queue.clear();
  for (const item of saved.items) {
    const current = existing.get(item.childId);
    queue.set(item.childId, current?.at === item.at ? Object.assign(current, item) : item);
  }
  emit(false);
}

/** Birinchi so'rovdan OLDIN saqlanadi. Takroriy urinish asl vaqtni o'zgartirmaydi. */
export function enqueueCheckIn(childId: string, at = new Date().toISOString()): QueuedCheckIn {
  if (!scope || !enabled) throw new ApiError({ code: "UNAUTHENTICATED", status: 401 });
  synchronize();
  const existing =
    queue.get(childId) ?? readArrivals(scope).items.find((item) => item.childId === childId);
  if (existing) {
    queue.set(childId, existing);
    emit(false);
    return existing;
  }
  const item: QueuedCheckIn = { childId, at, attempts: 1, state: "pending" };
  queue.set(childId, item);
  emit();
  schedule();
  return item;
}

export function submitCheckIn(
  dto: { childId: string; at?: string },
  token = generation,
): Promise<AttendanceRecord> {
  if (token !== generation)
    return Promise.reject(new ApiError({ code: "UNAUTHENTICATED", status: 401 }));
  const item = enqueueCheckIn(dto.childId, dto.at);
  const current = flights.get(item.childId);
  if (current) return current;
  if (arrivalDay(item.at) !== todayIso() || item.state === "review") {
    item.state = "review";
    emit();
    return Promise.reject(new ApiError({ code: "CONFLICT", status: 409 }));
  }
  const request = attendanceApi
    .checkIn({ childId: item.childId, at: item.at })
    .then((record) => {
      if (token === generation && queue.get(item.childId)?.at === item.at)
        queue.delete(item.childId);
      return record;
    })
    .catch((error: unknown) => {
      if (token !== generation) throw error;
      synchronize();
      if (queue.get(item.childId)?.at !== item.at) throw error;
      if (isApiError(error) && error.code === "ALREADY_CHECKED_IN") queue.delete(item.childId);
      else if (!isRetryable(error)) {
        item.state = "review";
        item.errorCode = isApiError(error) ? error.code : undefined;
        handlers.onGiveUp?.(item.childId, error);
      } else item.attempts += 1;
      throw error;
    })
    .finally(() => {
      if (token !== generation) return;
      flights.delete(item.childId);
      emit();
      handlers.onSettled?.();
      schedule();
    });
  flights.set(item.childId, request);
  return request;
}

export async function flushCheckInQueue(): Promise<void> {
  stopTimer();
  synchronize();
  const token = generation;
  for (const item of [...queue.values()]) {
    if (!enabled || token !== generation) break;
    synchronize();
    if (queue.get(item.childId)?.at !== item.at) continue;
    if (item.state !== "pending") continue;
    if (arrivalDay(item.at) !== todayIso()) {
      item.state = "review";
      item.errorCode = "USE_ATTENDANCE_CORRECTION";
      emit();
      continue;
    }
    try {
      await submitCheckIn(item);
    } catch {
      /* Navbat holati saqlanadi. */
    }
  }
  schedule();
}

/** Eski kun qaydi faqat o'qiladi; avtomatik tarixiy kirish yaratilmaydi. */
export async function reconcileCheckIn(childId: string): Promise<void> {
  synchronize();
  const item = queue.get(childId);
  if (!scope || !item) return;
  const token = generation;
  const result = await attendanceApi.list({ childId, date: arrivalDay(item.at), limit: 1 });
  if (token !== generation) return;
  if (result.data.some((row) => row.childId === childId && row.checkInAt)) {
    queue.delete(childId);
  } else {
    item.state = "review";
    item.errorCode = "NOT_CHECKED_IN";
  }
  emit();
  handlers.onSettled?.();
}
export function retryCheckIn(childId: string): void {
  synchronize();
  const item = queue.get(childId);
  if (!enabled || !item || arrivalDay(item.at) !== todayIso()) return;
  item.state = "pending";
  item.errorCode = undefined;
  emit();
  void flushCheckInQueue();
}
export function dismissCheckIn(childId: string): void {
  if (flights.has(childId)) return;
  queue.delete(childId);
  emit();
}
bindCheckInEvents(flushCheckInQueue, synchronize, () => snapshot);
