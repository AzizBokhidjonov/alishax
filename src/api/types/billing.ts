import type { Id, IsoDate, IsoDateTime, Tiyin } from "./common";
import type { TariffKind } from "./finance";

export interface BillingRunLine {
  childId: Id;
  childName?: string;
  groupName?: string;
  amountTiyin: Tiyin;
  kind?: TariffKind | string;
  warnings?: string[];
}

export interface BillingRun {
  id: Id;
  year: number;
  month: number;
  status: "preview" | "committed" | "discarded";
  createdAt?: IsoDateTime;
  committedAt?: IsoDateTime;
  totalTiyin?: Tiyin;
  childrenCount?: number;
  lines?: BillingRunLine[];
  warnings?: string[];
}

export interface BillingTraceStep {
  step: string;
  amount?: string;
  note?: string;
  factor?: string;
}

export interface BillingExplain {
  id?: Id;
  kind?: string;
  label?: string;
  childId: Id;
  childName?: string;
  amountTiyin?: Tiyin;
  trace?: BillingTraceStep[];
}

export interface BillingRules {
  id: Id;
  version: number;
  effectiveFrom: IsoDate;
  effectiveTo?: IsoDate;
  note?: string;
  createdAt?: IsoDateTime;
  createdBy?: string;
  rules: Record<string, unknown>;
}

export interface CreateBillingRulesDto {
  effectiveFrom: IsoDate;
  rules: Record<string, unknown>;
  note?: string;
}

export interface SimulateBillingDto {
  childId: Id;
  year: number;
  month: number;
  rules?: Record<string, unknown>;
}

export interface SimulateBillingResult {
  amountTiyin: Tiyin;
  trace?: BillingTraceStep[];
}

export interface Charge {
  id: Id;
  childId: Id;
  childName?: string;
  periodId?: Id;
  period?: { year: number; month: number };
  kind?: string;
  description?: string;
  amountTiyin: Tiyin;
  paidTiyin?: Tiyin;
  /** Teskari yozuvda -1 — hisob o'chirilmaydi, qarshi satr qo'shiladi. */
  sign?: 1 | -1;
  reversedAt?: IsoDateTime;
  reversalReason?: string;
  createdAt?: IsoDateTime;
}

/**
 * Qo'lda tuzatish — oilaga kredit yoki qo'shimcha qarz (§5, Adjustments).
 *
 * `amountTiyin` har doim MUSBAT, ishora esa alohida: `-1` oilaning
 * foydasiga (chegirma/kredit), `+1` qarz qo'shadi. Ikkala ruxsat ham kerak:
 * `charge:generate` va `charge:reverse`.
 *
 * Bu naqd pul QAYTARISH emas — qaytarishning alohida jarayoni yo'q.
 */
export interface CreateAdjustmentDto {
  childId: Id;
  periodId: Id;
  /** `-1` — oilaga kredit, `+1` — qarz qo'shiladi. */
  sign: -1 | 1;
  /** Musbat butun tiyin satri. */
  amountTiyin: Tiyin;
  /** Kamida 10 belgi — serverda ham tekshiriladi. */
  reason: string;
  dueDate?: IsoDate;
}

/**
 * Daftarchaning BITTA satri (`GET /children/{id}/charge-ledger`).
 *
 * `/charges` dan farqi: u faqat joriy MUSBAT hisoblarni ko'rsatadi, daftarcha
 * esa to'liq va faqat qo'shiladigan tarix — tuzatishlar va qarshi satrlar
 * bilan. Shuning uchun bu yerda `sign` va «qaysi satrni qaytaradi» havolasi
 * bor va hech narsa o'chirilmaydi.
 */
export interface ChargeLedgerEntry {
  id: Id;
  childId: Id;
  periodId?: Id;
  period?: { year: number; month: number };
  kind?: string;
  description?: string;
  amountTiyin: Tiyin;
  sign?: 1 | -1;
  /** Qaysi yozuvni teskari qiladi — juftlab ko'rsatish uchun. */
  reversesChargeId?: Id | null;
  reversedAt?: IsoDateTime | null;
  reversalReason?: string;
  /** Tuzatish satrining sababi. */
  reason?: string;
  dueDate?: IsoDate;
  createdAt?: IsoDateTime;
  createdByName?: string;
}

export interface CreateManualChargeDto {
  childId: Id;
  periodId: Id;
  amountTiyin: Tiyin;
  description: string;
}

export type PaymentMethod = "cash" | "bank" | "card" | "online" | "other";

export interface PaymentAllocation {
  chargeId: Id;
  chargeDescription?: string;
  amountTiyin: Tiyin;
}

export interface Payment {
  id: Id;
  childId: Id;
  childName?: string;
  payerGuardianId?: Id;
  payerName?: string;
  amountTiyin: Tiyin;
  method: PaymentMethod;
  paidAt: IsoDateTime;
  receiptNo?: string;
  bankRef?: string;
  attachmentFileId?: Id;
  note?: string;
  sign?: 1 | -1;
  cancelledAt?: IsoDateTime;
  cancelReason?: string;
  recordedBy?: string;
  allocations?: PaymentAllocation[];
  advanceTiyin?: Tiyin;
}

export interface CreatePaymentDto {
  childId: Id;
  payerGuardianId?: Id;
  amountTiyin: Tiyin;
  method: PaymentMethod;
  paidAt: IsoDateTime;
  receiptNo?: string;
  bankRef?: string;
  attachmentFileId?: Id;
  note?: string;
  allocations?: { chargeId: Id; amountTiyin: Tiyin }[];
}

export interface DebtAgeing {
  notOverdue: Tiyin;
  d1_7: Tiyin;
  d8_30: Tiyin;
  d30plus: Tiyin;
}

export interface DebtRow {
  childId: Id;
  childName?: string;
  groupId?: Id;
  groupName?: string;
  currentDebt: Tiyin;
  overdueAmount?: Tiyin;
  advanceBalance?: Tiyin;
  ageing?: DebtAgeing;
}

export interface ChildDebt {
  childId?: Id;
  currentCharge?: Tiyin;
  previousDebt?: Tiyin;
  totalPaid?: Tiyin;
  advanceBalance?: Tiyin;
  currentDebt: Tiyin;
  overdueAmount?: Tiyin;
  ageing?: DebtAgeing;
}

export interface DebtSummary {
  totalDebt?: Tiyin;
  byGroup?: {
    groupId: Id | null;
    groupName: string | null;
    amountTiyin: Tiyin;
    childrenCount?: number;
  }[];
  byAgeing?: DebtAgeing;
}

export * from "./expenses";
