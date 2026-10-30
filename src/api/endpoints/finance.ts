import { normalizeDiscount, type DiscountResponse } from "../adapters/discounts";
import { normalizeChildTariff, type ChildTariffResponse } from "../adapters/tariffs";
import { api, requestExport, type QueryParams } from "../http";
import { toPage } from "../types";
import { normalizeChildDebt, normalizeDebtRow, normalizeDebtSummary } from "../adapters/debts";
import { normalizePayment, type PaymentResponse } from "../adapters/payments";
import { normalizeCharge, type ChargeResponse } from "../adapters/charges";
import {
  normalizeBillingRun,
  normalizeBillingExplanation,
  type BillingRunResponse,
  type BillingLineResponse,
} from "../adapters/billing";
import type {
  AssignChildTariffDto,
  ChargeLedgerEntry,
  CreateAdjustmentDto,
  EndChildTariffDto,
  BillingRules,
  BillingRun,
  Charge,
  ChildTariff,
  CreateBillingRulesDto,
  CreateDiscountDto,
  CreateManualChargeDto,
  CreatePaymentDto,
  CreateTariffDto,
  DebtRow,
  Id,
  ListParams,
  Paginated,
  Payment,
  Period,
  SimulateBillingDto,
  SimulateBillingResult,
  Tariff,
  UpdateTariffDto,
} from "../types";

export const tariffsApi = {
  async list(params: { active?: boolean } & ListParams = {}): Promise<Paginated<Tariff>> {
    const response = await api.get<Paginated<Tariff> | Tariff[]>("/tariffs", params as QueryParams);
    return toPage(response);
  },
  create: (dto: CreateTariffDto) => api.post<Tariff>("/tariffs", dto),
  update: (id: Id, dto: UpdateTariffDto) => api.patch<Tariff>(`/tariffs/${id}`, dto),

  ofChild: (childId: Id) =>
    api
      .get<ChildTariffResponse[]>(`/children/${childId}/tariffs`)
      .then((rows) => rows.map(normalizeChildTariff)),
  assign: (childId: Id, dto: AssignChildTariffDto) =>
    api.post<ChildTariff>(`/children/${childId}/tariffs`, dto),

  end: (childId: Id, assignmentId: Id, dto: EndChildTariffDto) =>
    api.patch<ChildTariff>(`/children/${childId}/tariffs/${assignmentId}`, dto),
};

export const discountsApi = {
  ofChild: (childId: Id) =>
    api
      .get<DiscountResponse[]>(`/children/${childId}/discounts`)
      .then((rows) => rows.map(normalizeDiscount)),
  create: (childId: Id, dto: CreateDiscountDto) =>
    api.post<DiscountResponse>(`/children/${childId}/discounts`, dto).then(normalizeDiscount),
  revoke: (childId: Id, discountId: Id) =>
    api.delete<void>(`/children/${childId}/discounts/${discountId}`),
};

export const periodsApi = {
  list: (year?: number) => api.get<Period[]>("/periods", { year }),
  create: (year: number, month: number) => api.post<Period>("/periods", { year, month }),
  close: (id: Id) => api.post<Period>(`/periods/${id}/close`),

  reopen: (id: Id, reason: string) => api.post<Period>(`/periods/${id}/reopen`, { reason }),
};

export const billingApi = {
  rules: () => api.get<BillingRules[]>("/billing-rules"),

  activeRules: (date?: string) => api.get<BillingRules>("/billing-rules/active", { date }),

  rulesById: (id: Id) => api.get<BillingRules>(`/billing-rules/${id}`),
  rulesDiff: (id: Id, against: Id) =>
    api.get<Record<string, unknown>>(`/billing-rules/${id}/diff`, { against }),
  createRules: (dto: CreateBillingRulesDto) => api.post<BillingRules>("/billing-rules", dto),
  simulate: (dto: SimulateBillingDto) =>
    api.post<SimulateBillingResult>("/billing-rules/simulate", dto),

  async runs(
    params: { periodId?: string; status?: string } & ListParams = {},
  ): Promise<Paginated<BillingRun>> {
    const response = await api.get<Paginated<BillingRunResponse> | BillingRunResponse[]>(
      "/billing-runs",
      params as QueryParams,
    );
    const page = toPage(response);
    return { ...page, data: page.data.map((run) => normalizeBillingRun(run)) };
  },

  preview: (year: number, month: number) =>
    api
      .post<BillingRunResponse>("/billing-runs", { year, month })
      .then((run) => normalizeBillingRun(run, { year, month })),
  run: (id: Id) =>
    api.get<BillingRunResponse>(`/billing-runs/${id}`).then((run) => normalizeBillingRun(run)),
  explain: (id: Id, childId: Id) =>
    api
      .get<BillingLineResponse[]>(`/billing-runs/${id}/explain/${childId}`)
      .then(normalizeBillingExplanation),
  commit: (id: Id, idempotencyKey: string) =>
    api
      .post<BillingRunResponse>(`/billing-runs/${id}/commit`, undefined, { idempotencyKey })
      .then((run) => normalizeBillingRun(run)),
  discard: (id: Id) => api.delete<void>(`/billing-runs/${id}`),
};

export interface ChargeListParams extends ListParams {
  childId?: string;
  periodId?: string;
  kind?: string;
  unpaidOnly?: boolean;
}

export const chargesApi = {
  async list(params: ChargeListParams = {}): Promise<Paginated<Charge>> {
    const response = await api.get<Paginated<ChargeResponse> | ChargeResponse[]>(
      "/charges",
      params as QueryParams,
    );
    const page = toPage(response);
    return { ...page, data: page.data.map(normalizeCharge) };
  },
  ofChild: (childId: Id) =>
    api
      .get<ChargeResponse[]>(`/children/${childId}/charges`)
      .then((rows) => rows.map(normalizeCharge)),
  createManual: (dto: CreateManualChargeDto) => api.post<Charge>("/charges", dto),

  adjust: (dto: CreateAdjustmentDto) => api.post<Charge>("/charges/adjustments", dto),

  async ledger(childId: Id, params: ListParams = {}): Promise<Paginated<ChargeLedgerEntry>> {
    const response = await api.get<Paginated<ChargeLedgerEntry> | ChargeLedgerEntry[]>(
      `/children/${childId}/charge-ledger`,
      params as QueryParams,
    );
    return toPage(response);
  },

  recalculate: (childId: Id, year: number, month: number) =>
    api.post<BillingRun>(`/children/${childId}/recalculate-billing`, { year, month }),

  reverse: (id: Id, reason: string) => api.post<Charge>(`/charges/${id}/reverse`, { reason }),
};

export interface PaymentListParams extends ListParams {
  childId?: string;
  from?: string;
  to?: string;
  method?: string;
  recordedBy?: string;
}

export const paymentsApi = {
  async list(params: PaymentListParams = {}): Promise<Paginated<Payment>> {
    const response = await api.get<Paginated<PaymentResponse> | PaymentResponse[]>(
      "/payments",
      params as QueryParams,
    );
    const page = toPage(response);
    return { ...page, data: page.data.map(normalizePayment) };
  },
  get: (id: Id) => api.get<PaymentResponse>(`/payments/${id}`).then(normalizePayment),
  create: (dto: CreatePaymentDto, idempotencyKey: string) =>
    api.post<PaymentResponse>("/payments", dto, { idempotencyKey }).then(normalizePayment),
  cancel: (id: Id, reason: string) =>
    api.post<PaymentResponse>(`/payments/${id}/cancel`, { reason }).then(normalizePayment),

  receipt: (id: Id, format: "pdf" | "html" = "pdf") =>
    requestExport(`/payments/${id}/receipt`, { format }),
};

export interface DebtListParams extends ListParams {
  groupId?: string;
  overdueOnly?: boolean;
  minAmountTiyin?: string;
  ageing?: string;
}

export const debtsApi = {
  async list(params: DebtListParams = {}): Promise<Paginated<DebtRow>> {
    const response = await api.get<Paginated<unknown> | unknown[]>("/debts", params as QueryParams);
    const page = toPage(response);
    return { ...page, data: page.data.map(normalizeDebtRow) };
  },
  ofChild: (childId: Id) => api.get<unknown>(`/debts/${childId}`).then(normalizeChildDebt),
  summary: () => api.get<unknown>("/debts/summary").then(normalizeDebtSummary),
};
