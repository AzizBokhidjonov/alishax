import { useSyncExternalStore } from "react";
import { z } from "zod";
import { API_BASE_URL } from "@/api/http";
import type { CreatePaymentDto } from "@/api";

const money = z.string().regex(/^\d+$/);
const recordSchema = z.object({
  key: z.string().min(1),
  attempts: z.number().int().nonnegative().default(0),
  dto: z.object({
    childId: z.string().min(1),
    payerGuardianId: z.string().optional(),
    amountTiyin: money,
    method: z.enum(["cash", "bank", "card", "online", "other"]),
    paidAt: z.string().datetime({ offset: true }),
    receiptNo: z.string().optional(),
    bankRef: z.string().optional(),
    attachmentFileId: z.string().optional(),
    note: z.string().optional(),
    allocations: z.array(z.object({ chargeId: z.string().min(1), amountTiyin: money })).optional(),
  }),
  childName: z.string(),
  payerName: z.string(),
  chargeLabels: z.record(z.string()),
});
export type PaymentRecoveryRecord = z.infer<typeof recordSchema>;
type Snapshot = {
  record: PaymentRecoveryRecord | null;
  error: boolean;
  enabled: boolean;
  scopeId: string | null;
};
const empty: Snapshot = { record: null, error: false, enabled: false, scopeId: null };
let snapshot = empty;
let scope: string | null = null;
let generation = 0;
const listeners = new Set<() => void>();
const emit = (next: Snapshot) => {
  snapshot = next;
  listeners.forEach((listener) => listener());
};

function read(key: string): PaymentRecoveryRecord | null {
  const raw = window.localStorage.getItem(key);
  return raw ? recordSchema.parse(JSON.parse(raw)) : null;
}

function reload() {
  if (!scope) return;
  try {
    emit({ ...snapshot, record: read(scope), error: false });
  } catch {
    emit({ ...snapshot, error: true });
  }
}

/** AuthProvider chiqishni boshlashi bilanoq ko'rinadigan ma'lumotlar ajratiladi. */
export function setPaymentRecoveryScope(userId: string | null, enabled: boolean) {
  const nextScope = userId
    ? `payment-recovery:v1:${encodeURIComponent(API_BASE_URL)}:${encodeURIComponent(userId)}`
    : null;
  if (scope !== nextScope || snapshot.enabled !== (!!nextScope && enabled)) generation++;
  scope = nextScope;
  snapshot = { ...empty, enabled: !!scope && enabled, scopeId: scope };
  if (scope) reload();
  else emit(snapshot);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === scope || event.key === null) reload();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePaymentRecovery() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => empty,
  );
}

async function withPaymentLock<T>(requestedScope: string, action: () => T): Promise<T> {
  try {
    return await navigator.locks.request(requestedScope, action);
  } catch (error) {
    const expected =
      error instanceof Error &&
      ["PAYMENT_SCOPE_CHANGED", "PAYMENT_UNRESOLVED"].includes(error.message);
    if (scope === requestedScope && !expected) emit({ ...snapshot, error: true });
    throw error;
  }
}

/** So'rov yuborilishidan OLDIN asl DTO va kalit barqaror xotiraga yoziladi. */
function beginPaymentRecovery(
  dto: CreatePaymentDto,
  childName: string,
  payerName: string,
  chargeLabels: Record<string, string>,
): PaymentRecoveryRecord {
  if (!scope || !snapshot.enabled || snapshot.error)
    throw new Error("PAYMENT_RECOVERY_UNAVAILABLE");
  try {
    const existing = read(scope);
    if (existing) {
      emit({ ...snapshot, record: existing });
      throw new Error("PAYMENT_UNRESOLVED");
    }
    const record = recordSchema.parse({
      key: crypto.randomUUID(),
      dto,
      childName,
      payerName,
      chargeLabels,
    });
    window.localStorage.setItem(scope, JSON.stringify(record));
    emit({ ...snapshot, record });
    return record;
  } catch (error) {
    if (!snapshot.record) emit({ ...snapshot, error: true });
    throw error;
  }
}

/** Ikki varaq bir vaqtda bo'sh joyni egallab, asl so'rovni yo'qotmasligi uchun. */
export async function reservePaymentRecovery(
  dto: CreatePaymentDto,
  childName: string,
  payerName: string,
  chargeLabels: Record<string, string>,
): Promise<PaymentRecoveryRecord> {
  const requestedScope = scope;
  const requestedGeneration = generation;
  if (!requestedScope || !navigator.locks) {
    emit({ ...snapshot, error: true });
    throw new Error("PAYMENT_RECOVERY_UNAVAILABLE");
  }
  return withPaymentLock(requestedScope, () => {
    if (scope !== requestedScope || generation !== requestedGeneration)
      throw new Error("PAYMENT_SCOPE_CHANGED");
    return beginPaymentRecovery(dto, childName, payerName, chargeLabels);
  });
}

/** Har urinish asl saqlangan nusxadan olinadi; tahrirlangan forma ishlatilmaydi. */
export function originalPayment(record: Pick<PaymentRecoveryRecord, "key">) {
  if (!scope || !snapshot.enabled || snapshot.error)
    throw new Error("PAYMENT_RECOVERY_UNAVAILABLE");
  const current = read(scope);
  if (!current || current.key !== record.key) throw new Error("PAYMENT_SCOPE_CHANGED");
  return { dto: current.dto, idempotencyKey: current.key };
}

export type PaymentAttempt = {
  dto: CreatePaymentDto;
  idempotencyKey: string;
  recoveryScope: string;
  recoveryGeneration: number;
};

/** Mutatsiya navbatidan keyin, API chaqirilishidan bevosita oldin tekshiriladi. */
export function paymentAttemptPayload(attempt: PaymentAttempt) {
  if (
    scope !== attempt.recoveryScope ||
    generation !== attempt.recoveryGeneration ||
    !snapshot.enabled
  )
    throw new Error("PAYMENT_SCOPE_CHANGED");
  return originalPayment({ key: attempt.idempotencyKey });
}

/** Har yuborishdan oldin urinish soni yoziladi; parallel qayta urinish 422'ni noaniq qiladi. */
export async function claimPaymentAttempt(record: PaymentRecoveryRecord) {
  const requestedScope = scope;
  const requestedGeneration = generation;
  if (!requestedScope || !navigator.locks) throw new Error("PAYMENT_RECOVERY_UNAVAILABLE");
  return withPaymentLock(requestedScope, () => {
    if (scope !== requestedScope || generation !== requestedGeneration)
      throw new Error("PAYMENT_SCOPE_CHANGED");
    const payload = originalPayment(record);
    try {
      const current = read(requestedScope)!;
      const updated = { ...current, attempts: current.attempts + 1 };
      window.localStorage.setItem(requestedScope, JSON.stringify(updated));
      emit({ ...snapshot, record: updated });
    } catch (error) {
      emit({ ...snapshot, error: true });
      throw error;
    }
    return { ...payload, recoveryScope: requestedScope, recoveryGeneration: requestedGeneration };
  });
}

export function rejectInitialPaymentRecovery(record: PaymentRecoveryRecord) {
  return clearRecovery(record, true);
}

export function completePaymentRecovery(record: PaymentRecoveryRecord) {
  return clearRecovery(record, false);
}

async function clearRecovery(record: PaymentRecoveryRecord, onlyFirst: boolean) {
  const requestedScope = scope;
  if (!requestedScope || !navigator.locks) return;
  await withPaymentLock(requestedScope, () => {
    if (scope !== requestedScope || snapshot.record?.key !== record.key) return;
    try {
      const current = read(requestedScope);
      if (current?.key !== record.key || (onlyFirst && current.attempts !== 1)) return;
      window.localStorage.removeItem(requestedScope);
      emit({ ...snapshot, record: null, error: false });
    } catch {
      emit({ ...snapshot, error: true });
    }
  });
}
