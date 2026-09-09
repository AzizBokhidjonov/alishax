import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  billingApi,
  discountsApi,
  periodsApi,
  tariffsApi,
  type AssignChildTariffDto,
  type CreateBillingRulesDto,
  type CreateDiscountDto,
  type CreateTariffDto,
  type SimulateBillingDto,
  type UpdateTariffDto,
} from "@/api";
import { qk, useApiMutation } from "@/lib/query";

/* ---------------------------------------------------------------- tariflar */

export function useTariffs(params: { active?: boolean } = {}) {
  return useQuery({ queryKey: qk.tariffs(params), queryFn: () => tariffsApi.list(params) });
}

export function useCreateTariff() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateTariffDto) => tariffsApi.create(dto),
    successMessage: t("common.state.created"),
    invalidate: [["tariffs"]],
  });
}

export function useUpdateTariff() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTariffDto }) => tariffsApi.update(id, dto),
    successMessage: t("common.state.updated"),
    invalidate: [["tariffs"]],
  });
}

export function useChildTariffs(childId: string) {
  return useQuery({
    queryKey: qk.childTariffs(childId),
    queryFn: () => tariffsApi.ofChild(childId),
    enabled: Boolean(childId),
  });
}

export function useAssignTariff(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: AssignChildTariffDto) => tariffsApi.assign(childId, dto),
    successMessage: t("tariffs.assign.done"),
    invalidate: [qk.childTariffs(childId), qk.child(childId)],
  });
}

/* -------------------------------------------------------------- chegirmalar */

export function useDiscounts(childId: string) {
  return useQuery({
    queryKey: qk.childDiscounts(childId),
    queryFn: () => discountsApi.ofChild(childId),
    enabled: Boolean(childId),
  });
}

export function useCreateDiscount(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateDiscountDto) => discountsApi.create(childId, dto),
    successMessage: t("tariffs.discounts.created"),
    invalidate: [qk.childDiscounts(childId)],
  });
}

export function useRevokeDiscount(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (discountId: string) => discountsApi.revoke(childId, discountId),
    successMessage: t("common.state.deleted"),
    invalidate: [qk.childDiscounts(childId)],
  });
}

/* ------------------------------------------------------------------ davrlar */

export function usePeriods(year?: number) {
  return useQuery({ queryKey: qk.periods(year), queryFn: () => periodsApi.list(year) });
}

export function useCreatePeriod() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      periodsApi.create(year, month),
    successMessage: t("periods.created"),
    invalidate: [["periods"]],
  });
}

export function useClosePeriod() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (id: string) => periodsApi.close(id),
    successMessage: t("periods.closed"),
    invalidate: [["periods"]],
  });
}

/** Faqat Ega; sabab majburiy va audit jurnaliga yoziladi. */
export function useReopenPeriod() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => periodsApi.reopen(id, reason),
    successMessage: t("periods.reopened"),
    invalidate: [["periods"]],
  });
}

/* --------------------------------------------------------------- hisoblash */

export function useBillingRules() {
  return useQuery({ queryKey: qk.billingRules, queryFn: () => billingApi.rules() });
}

export function useCreateBillingRules() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateBillingRulesDto) => billingApi.createRules(dto),
    successMessage: t("billing.rules.created"),
    invalidate: [qk.billingRules],
  });
}

export function useSimulateBilling() {
  return useApiMutation({
    mutationFn: (dto: SimulateBillingDto) => billingApi.simulate(dto),
  });
}

export function useBillingRun(id: string) {
  return useQuery({
    queryKey: qk.billingRun(id),
    queryFn: () => billingApi.run(id),
    enabled: Boolean(id),
  });
}

export function usePreviewBilling() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      billingApi.preview(year, month),
    successMessage: t("billing.preview.created"),
  });
}

export function useCommitBilling() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
      billingApi.commit(id, idempotencyKey),
    successMessage: t("billing.commit.done"),
    invalidate: [["charges"], ["debts"], ["periods"]],
  });
}

export function useDiscardBilling() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (id: string) => billingApi.discard(id),
    successMessage: t("billing.preview.discarded"),
  });
}
