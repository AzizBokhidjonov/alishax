import { api, requestExport, type QueryParams } from "../http";
import { toPage } from "../types";
import { normalizeChildDebt, normalizeDebtRow, normalizeDebtSummary } from "../adapters/debts";
import { normalizePayment, type PaymentResponse } from "../adapters/payments";
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
  /** Biriktirishni muddatidan oldin yopish — o'chirish EMAS. */
  end: (childId: Id, assignmentId: Id, dto: EndChildTariffDto) =>
    api.patch<ChildTariff>(`/children/${childId}/tariffs/${assignmentId}`, dto),
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

  /**
   * Yurishlar ro'yxati — YARIM QOLGAN ishni tiklash uchun (§5, Monthly billing).
   * Oldindan ko'rish serverda saqlanadi, ya'ni sahifa yopilsa ham yo'qolmaydi.
   */
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

  /** Tasdiqlanmagan oldindan ko'rish serverda saqlanadi. */
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
    const response = await api.get<Paginated<Charge> | Charge[]>("/charges", params as QueryParams);
    return toPage(response);
  },
  ofChild: (childId: Id) => api.get<Charge[]>(`/children/${childId}/charges`),
  createManual: (dto: CreateManualChargeDto) => api.post<Charge>("/charges", dto),

  /**
   * Qo'lda debet/kredit tuzatish. Naqd qaytarish EMAS.
   * `charge:generate` VA `charge:reverse` — ikkalasi ham kerak.
   */
  adjust: (dto: CreateAdjustmentDto) => api.post<Charge>("/charges/adjustments", dto),

  /** To'liq, faqat qo'shiladigan daftarcha: tuzatishlar va qarshi satrlar bilan. */
  async ledger(childId: Id, params: ListParams = {}): Promise<Paginated<ChargeLedgerEntry>> {
    const response = await api.get<Paginated<ChargeLedgerEntry> | ChargeLedgerEntry[]>(
      `/children/${childId}/charge-ledger`,
      params as QueryParams,
    );
    return toPage(response);
  },

  /**
   * Davomat tuzatilgandan keyin oyni qayta hisoblash.
   *
   * Natija uch xil bo'lishi mumkin: ochiq davrdagi hisob qaytarilib qayta
   * yoziladi, keyingi ochiq davrga tuzatish qo'shiladi, yoki qo'lda hal
   * qilish kerak bo'lgan ish paydo bo'ladi — buni javobdagi holat aytadi.
   */
  recalculate: (childId: Id, year: number, month: number) =>
    api.post<BillingRun>(`/children/${childId}/recalculate-billing`, { year, month }),
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
    const response = await api.get<Paginated<unknown> | unknown[]>("/debts", params as QueryParams);
    const page = toPage(response);
    return { ...page, data: page.data.map(normalizeDebtRow) };
  },
  ofChild: (childId: Id) => api.get<unknown>(`/debts/${childId}`).then(normalizeChildDebt),
  summary: () => api.get<unknown>("/debts/summary").then(normalizeDebtSummary),
};
