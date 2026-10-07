import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  chargesApi,
  debtsApi,
  paymentsApi,
  type CreateAdjustmentDto,
  type CreateManualChargeDto,
  type CreatePaymentDto,
} from "@/api";
import type { ChargeListParams, DebtListParams, PaymentListParams } from "@/api/endpoints/finance";
import { qk, useApiMutation } from "@/lib/query";

/* ---------------------------------------------------------------- hisoblar */

export function useCharges(params: ChargeListParams) {
  return useQuery({
    queryKey: qk.charges(params),
    queryFn: () => chargesApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useChildCharges(childId: string) {
  return useQuery({
    queryKey: qk.childCharges(childId),
    queryFn: () => chargesApi.ofChild(childId),
    enabled: Boolean(childId),
  });
}

export function useCreateManualCharge() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateManualChargeDto) => chargesApi.createManual(dto),
    successMessage: t("charges.manual.created"),
    invalidate: [["charges"], ["debts"]],
  });
}

export function useReverseCharge() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => chargesApi.reverse(id, reason),
    successMessage: t("charges.reverse.done"),
    invalidate: [["charges"], ["debts"]],
  });
}

/**
 * To'liq daftarcha — tuzatishlar va qarshi satrlar bilan.
 *
 * `useChildCharges` dan farqi: u faqat joriy MUSBAT hisoblarni beradi.
 * Daftarcha esa faqat qo'shiladigan tarix, shuning uchun unda o'chirish yo'q
 * va har bir qaytarish o'z asli yonida ko'rinadi.
 */
export function useChargeLedger(childId: string, params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["charge-ledger", childId, params],
    queryFn: () => chargesApi.ledger(childId, params),
    enabled: Boolean(childId),
    placeholderData: (previous) => previous,
  });
}

/**
 * Qo'lda tuzatish: oilaga kredit (`sign: -1`) yoki qo'shimcha qarz (`+1`).
 *
 * Bu naqd pul QAYTARISH emas. Ikkala ruxsat ham kerak — `charge:generate`
 * va `charge:reverse` — shuning uchun tugma ikkisini birga tekshiradi.
 */
export function useCreateAdjustment() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateAdjustmentDto) => chargesApi.adjust(dto),
    successMessage: t("charges.adjust.done"),
    invalidate: [["charges"], ["charge-ledger"], ["debts"]],
  });
}

/**
 * Davomat tuzatilgandan keyin oyni qayta hisoblash.
 *
 * Natijasi uch xil bo'ladi va uni yashirmaslik kerak: ochiq davrda hisob
 * qaytarilib qayta yoziladi, keyingi ochiq davrga tuzatish qo'shiladi, yoki
 * qo'lda hal qilinadigan ish paydo bo'ladi.
 */
export function useRecalculateChildBilling(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      chargesApi.recalculate(childId, year, month),
    successMessage: t("charges.recalculate.done"),
    invalidate: [["charges"], ["charge-ledger"], ["debts"], ["attendance"]],
  });
}

/* ---------------------------------------------------------------- to'lovlar */

export function usePayments(params: PaymentListParams) {
  return useQuery({
    queryKey: qk.payments(params),
    queryFn: () => paymentsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: qk.payment(id),
    queryFn: () => paymentsApi.get(id),
    enabled: Boolean(id),
  });
}

/** `Idempotency-Key` majburiy — forma ochilganda yaratiladi. */
export function useCreatePayment() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ dto, idempotencyKey }: { dto: CreatePaymentDto; idempotencyKey: string }) =>
      paymentsApi.create(dto, idempotencyKey),
    successMessage: t("payments.form.created"),
    invalidate: [["payments"], ["charges"], ["debts"]],
  });
}

export function useCancelPayment() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => paymentsApi.cancel(id, reason),
    successMessage: t("payments.cancel.done"),
    invalidate: [["payments"], ["charges"], ["debts"]],
  });
}

/* ----------------------------------------------------------------- qarzlar */

export function useDebts(params: DebtListParams) {
  return useQuery({
    queryKey: qk.debts(params),
    queryFn: () => debtsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useDebtSummary() {
  return useQuery({ queryKey: qk.debtSummary, queryFn: () => debtsApi.summary() });
}

export function useChildDebt(childId: string) {
  return useQuery({
    queryKey: qk.childDebt(childId),
    queryFn: () => debtsApi.ofChild(childId),
    enabled: Boolean(childId),
  });
}
