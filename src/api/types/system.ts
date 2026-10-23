import type { Id, IsoDate, IsoDateTime, Tiyin } from "./common";

export interface Branch {
  id: Id;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  status?: "active" | "closed";
}

export interface CreateBranchDto {
  code: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  phone?: string;
  status?: "active" | "closed";
}

export interface Settings {
  displayName: string;
  logoFileId?: Id | null;
  logoUrl?: string;
  address?: string | null;
  phones?: string[];
  bankDetails?: Record<string, unknown> | null;
  taxInfo?: Record<string, unknown> | null;
  workingDays?: number[];
  workingHours?: { open?: string; close?: string } | null;
  defaultLanguage: "uz" | "ru";
  currency: string;
  timezone: string;
  receiptNumberFormat: string;
  paymentDueDay: number;
}

export type UpdateSettingsDto = Partial<Omit<Settings, "logoFileId" | "logoUrl">>;

export interface Holiday {
  id: Id;
  branchId?: Id;
  holidayDate: IsoDate;
  name: string;
  isWorking?: boolean;
}

export interface CreateHolidayDto {
  branchId?: Id;
  holidayDate: IsoDate;
  name: string;
  isWorking?: boolean;
}

export interface AuditEntry {
  id: Id;
  at: IsoDateTime;
  entity: string;
  entityId?: Id;
  action: string;
  userId?: Id;
  userName?: string;
  ip?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export type ImportEntity =
  "children" | "guardians" | "groups" | "users" | "opening_balances" | "expenses";

export interface ImportRowError {
  row: number;
  field?: string;
  message?: string;
  code?: string;
}

export interface ImportJob {
  id: Id;
  entity?: ImportEntity;
  status: "validated" | "processing" | "completed" | "failed";
  totalRows?: number;
  processed?: number;
  failed?: number;
  errors?: ImportRowError[];
}

export interface UploadedFile {
  fileId: Id;
  url?: string;
  size?: number;
  mime?: string;
}

export interface ExportJob {
  id?: Id;
  jobId?: Id;
  status: "processing" | "ready" | "failed";
  downloadUrl?: string;
  expiresAt?: IsoDateTime;
}

export interface DebtBreakdown {
  byGroup: { groupId?: Id; groupName?: string; amountTiyin: Tiyin; childrenCount?: number }[];
  ageing: { notOverdue: Tiyin; d1_7: Tiyin; d8_30: Tiyin; d30plus: Tiyin };
}

/** `GET /dashboard/director`. */
export interface DirectorDashboard {
  activeChildren: number;
  currentlyInside: number;
  absentToday: number;
  debt: DebtBreakdown;
  telegramBoundRate: number;
  telegramBound: number;
  telegramGuardianTotal: number;
  revenueThisMonthTiyin: Tiyin;
  expensesThisMonthTiyin: Tiyin;
}

/** `GET /dashboard/accountant`. */
export interface AccountantDashboard {
  paymentsToday: { count: number; totalTiyin: Tiyin };
  chargesThisMonthTiyin: Tiyin;
  debt: DebtBreakdown;
  unpaidExpenses: { count: number; totalTiyin: Tiyin };
  openPeriod: { id: Id; year: number; month: number } | null;
}

/** `GET /dashboard/reception`. */
export interface ReceptionDashboard {
  currentlyInside: number;
  absentToday: number;
  notPickedUpYet: number;
  unboundGuardianCount: number;
}
