import { api, requestExport, type QueryParams } from "../http";
import { toPage } from "../types";
import type {
  AssignChildTariffDto,
  BillingExplain,
  BillingRules,
  BillingRun,
  Charge,
  ChildDebt,
  ChildTariff,
  CreateBillingRulesDto,
  CreateDiscountDto,
  CreateManualChargeDto,
  CreatePaymentDto,
  CreateTariffDto,
  DebtRow,
  DebtSummary,
  Discount,
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

  ofChild: (childId: Id) => api.get<ChildTariff[]>(`/children/${childId}/tariffs`),
  assign: (childId: Id, dto: AssignChildTariffDto) =>
    api.post<ChildTariff>(`/children/${childId}/tariffs`, dto),
};

export const discountsApi = {
  ofChild: (childId: Id) => api.get<Discount[]>(`/children/${childId}/discounts`),
  create: (childId: Id, dto: CreateDiscountDto) =>
    api.post<Discount>(`/children/${childId}/discounts`, dto),
  revoke: (childId: Id, discountId: Id) =>
    api.delete<void>(`/children/${childId}/discounts/${discountId}`),
};

export const periodsApi = {
  list: (year?: number) => api.get<Period[]>("/periods", { year }),
  create: (year: number, month: number) => api.post<Period>("/periods", { year, month }),
  close: (id: Id) => api.post<Period>(`/periods/${id}/close`),
  /** Faqat Owner; sabab majburiy va audit yoziladi. */
  reopen: (id: Id, reason: string) => api.post<Period>(`/periods/${id}/reopen`, { reason }),
};

export const billingApi = {
  rules: () => api.get<BillingRules[]>("/billing-rules"),
  /** Sana bo'yicha amaldagi versiya; ro'yxatda ham `effectiveTo` bo'yicha ko'rinadi. */
  activeRules: (date?: string) => api.get<BillingRules>("/billing-rules/active", { date }),
  /** Bitta versiya; ro'yxat to'liq `rules` bilan qaytgani uchun UI'da kerak emas. */
  rulesById: (id: Id) => api.get<BillingRules>(`/billing-rules/${id}`),
  rulesDiff: (id: Id, against: Id) =>
    api.get<Record<string, unknown>>(`/billing-rules/${id}/diff`, { against }),
  createRules: (dto: CreateBillingRulesDto) => api.post<BillingRules>("/billing-rules", dto),
  simulate: (dto: SimulateBillingDto) =>
    api.post<SimulateBillingResult>("/billing-rules/simulate", dto),

  /** Hech narsa yozmaydigan oldindan ko'rish. */
  preview: (year: number, month: number) => api.post<BillingRun>("/billing-runs", { year, month }),
  run: (id: Id) => api.get<BillingRun>(`/billing-runs/${id}`),
  explain: (id: Id, childId: Id) =>
    api.get<BillingExplain>(`/billing-runs/${id}/explain/${childId}`),
  commit: (id: Id, idempotencyKey: string) =>
    api.post<BillingRun>(`/billing-runs/${id}/commit`, undefined, { idempotencyKey }),
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
    const response = await api.get<Paginated<Charge> | Charge[]>("/charges", params as QueryParams);
    return toPage(response);
  },
  ofChild: (childId: Id) => api.get<Charge[]>(`/children/${childId}/charges`),
  createManual: (dto: CreateManualChargeDto) => api.post<Charge>("/charges", dto),
  /** O'chirmaydi — `sign=-1` qarshi satr qo'shadi. */
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
    const response = await api.get<Paginated<Payment> | Payment[]>(
      "/payments",
      params as QueryParams,
    );
    return toPage(response);
  },
  get: (id: Id) => api.get<Payment>(`/payments/${id}`),
  create: (dto: CreatePaymentDto, idempotencyKey: string) =>
    api.post<Payment>("/payments", dto, { idempotencyKey }),
  cancel: (id: Id, reason: string) => api.post<Payment>(`/payments/${id}/cancel`, { reason }),
  /**
   * Kvitansiya serverda render qilinadi va Bearer token talab qiladi —
   * shuning uchun oddiy havola bilan ochilmaydi, avval fayl olib kelinadi.
   */
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
    const response = await api.get<Paginated<DebtRow> | DebtRow[]>("/debts", params as QueryParams);
    return toPage(response);
  },
  ofChild: (childId: Id) => api.get<ChildDebt>(`/debts/${childId}`),
  summary: () => api.get<DebtSummary>("/debts/summary"),
};
