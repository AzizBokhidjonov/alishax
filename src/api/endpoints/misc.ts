import {
  api,
  request,
  requestExport,
  requestResponse,
  fileNameFrom,
  type QueryParams,
  type ExportResult,
} from "../http";
import { toPage } from "../types";
import type {
  CreateExpenseDto,
  AccountantDashboard,
  DirectorDashboard,
  ReceptionDashboard,
  Expense,
  ExpenseSummaryRow,
  ExportJob,
  Id,
  ImportEntity,
  ImportJob,
  ListParams,
  Paginated,
  PayExpenseDto,
  UpdateExpenseDto,
  UploadedFile,
} from "../types";

export interface ExpenseListParams extends ListParams {
  year?: number;
  month?: number;
  type?: string;
  status?: string;
}

export const expensesApi = {
  async list(params: ExpenseListParams = {}): Promise<Paginated<Expense>> {
    const response = await api.get<Paginated<Expense> | Expense[]>(
      "/expenses",
      params as QueryParams,
    );
    return toPage(response);
  },
  create: (dto: CreateExpenseDto) => api.post<Expense>("/expenses", dto),
  update: (id: Id, dto: UpdateExpenseDto) => api.patch<Expense>(`/expenses/${id}`, dto),
  pay: (id: Id, dto: PayExpenseDto) => api.post<Expense>(`/expenses/${id}/pay`, dto),
  summary: (year: number) => api.get<ExpenseSummaryRow[]>("/expenses/summary", { year }),
};

/** Server cheklovlari bilan bir xil bo'lishi kerak (B20). */
export const MAX_UPLOAD_MB = 20;
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const filesApi = {
  upload: (file: File, entityType?: string, entityId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<UploadedFile>("/files", {
      method: "POST",
      formData,
      query: { entityType, entityId },
    });
  },
  /**
   * Fayl baytlari. Imzolangan havola YO'Q — server har so'rovda ruxsatni
   * tekshiradi va oqimni qaytaradi (B20). Shuning uchun `<img src>` yoki
   * oddiy `<a href>` ishlamaydi: 401 keladi. Faqat shu funksiya orqali.
   */
  download: async (id: Id): Promise<{ blob: Blob; fileName?: string }> => {
    const response = await requestResponse(`/files/${id}`);
    return { blob: await response.blob(), fileName: fileNameFrom(response) };
  },
  remove: (id: Id) => api.delete<void>(`/files/${id}`),
};

export const dashboardApi = {
  director: () => api.get<DirectorDashboard>("/dashboard/director"),
  accountant: () => api.get<AccountantDashboard>("/dashboard/accountant"),
  reception: () => api.get<ReceptionDashboard>("/dashboard/reception"),
};

export type ReportPath =
  | "attendance/daily"
  | "attendance/monthly"
  | "attendance/corrections"
  | "children/active"
  | "children/enrollments"
  | "children/documents-expiring"
  | "children/medical-alerts"
  | "finance/charges"
  | "finance/payments"
  | "finance/debts"
  | "finance/discounts"
  | "finance/cancellations"
  | "expenses/monthly";

export const reportsApi = {
  json: <T>(report: ReportPath, params: QueryParams = {}) =>
    api.get<T>(`/reports/${report}`, { ...params, format: "json" }),
  /** `xlsx`/`pdf` — fayl yoki `202 { jobId }` qaytaradi. */
  export: (
    report: ReportPath,
    format: "xlsx" | "pdf",
    params: QueryParams = {},
  ): Promise<ExportResult> => requestExport(`/reports/${report}`, { ...params, format }),
  job: (id: Id) => api.get<ExportJob>(`/exports/${id}`),
};

export const importsApi = {
  /** Havolaning o'zi; yuklab olish `downloadTemplate` orqali bajariladi. */
  downloadTemplate: (entity: ImportEntity) => requestExport(`/imports/templates/${entity}`),
  validate: (entity: ImportEntity, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ImportJob>("/imports/validate", {
      method: "POST",
      formData,
      query: { entity },
    });
  },
  commit: (importJobId: Id, skipInvalid = false) =>
    api.post<ImportJob>("/imports/commit", { importJobId, skipInvalid }),
  get: (id: Id) => api.get<ImportJob>(`/imports/${id}`),
};
