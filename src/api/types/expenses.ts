import type { Id, IsoDate, IsoDateTime, Tiyin } from "./common";

export type ExpenseType =
  | "electricity"
  | "gas"
  | "cold_water"
  | "hot_water"
  | "heating"
  | "waste"
  | "internet"
  | "telephone"
  | "security"
  | "rent"
  | "other";

export interface Expense {
  id: Id;
  branchId: Id;
  type: ExpenseType;
  provider?: string;
  contractNumber?: string;
  billingYear: number;
  billingMonth: number;
  invoiceNumber?: string;
  amountTiyin: Tiyin;
  dueDate?: IsoDate;
  attachmentFileId?: Id;
  note?: string;
  status?: "unpaid" | "paid" | "partial";
  paidAt?: IsoDateTime;
  paidTiyin?: Tiyin;
}

export interface CreateExpenseDto {
  branchId: Id;
  type: ExpenseType;
  provider?: string;
  contractNumber?: string;
  billingYear: number;
  billingMonth: number;
  invoiceNumber?: string;
  amountTiyin: Tiyin;
  dueDate?: IsoDate;
  attachmentFileId?: Id;
  note?: string;
}

export interface UpdateExpenseDto {
  provider?: string;
  amountTiyin?: Tiyin;
  dueDate?: IsoDate;
  note?: string;
}

export interface PayExpenseDto {
  paidAt: IsoDateTime;
  amountTiyin: Tiyin;
  attachmentFileId?: Id;
}

export interface ExpenseSummaryRow {
  type?: ExpenseType;
  month?: number;
  totalTiyin: Tiyin;
  paidTiyin?: Tiyin;
}
