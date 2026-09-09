import { useCallback } from "react";
import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { errorMessage, errorTraceId } from "./errors";

/**
 * So'rov kalitlari: `[resurs, parametrlar]` — filtr/sahifa o'zgarsa kesh
 * o'zi ajraladi (Integration Guide §7).
 */
export const qk = {
  me: ["auth", "me"] as const,
  children: (params: unknown = {}) => ["children", params] as const,
  child: (id: string) => ["children", "detail", id] as const,
  childDocuments: (id: string) => ["children", id, "documents"] as const,
  childMedical: (id: string) => ["children", id, "medical"] as const,
  childAlerts: (id: string) => ["children", id, "alerts"] as const,
  childConsents: (id: string) => ["children", id, "consents"] as const,
  childHistory: (id: string) => ["children", id, "history"] as const,
  childGuardians: (id: string) => ["children", id, "guardians"] as const,
  childTariffs: (id: string) => ["children", id, "tariffs"] as const,
  childDiscounts: (id: string) => ["children", id, "discounts"] as const,
  childCharges: (id: string) => ["children", id, "charges"] as const,
  childPickup: (id: string) => ["children", id, "pickup"] as const,
  documentsExpiring: (days: number) => ["documents", "expiring", days] as const,

  guardians: (params: unknown = {}) => ["guardians", params] as const,
  guardian: (id: string) => ["guardians", "detail", id] as const,
  telegram: ["telegram"] as const,

  groups: (params: unknown = {}) => ["groups", params] as const,
  group: (id: string) => ["groups", "detail", id] as const,
  groupChildren: (id: string) => ["groups", id, "children"] as const,
  groupStaff: (id: string) => ["groups", id, "staff"] as const,
  groupHistory: (id: string) => ["groups", id, "history"] as const,

  attendance: (params: unknown = {}) => ["attendance", params] as const,
  attendanceToday: (params: unknown = {}) => ["attendance", "today", params] as const,
  attendanceInside: ["attendance", "inside"] as const,
  attendanceAbsent: (date: string) => ["attendance", "absent", date] as const,
  attendanceNotPickedUp: ["attendance", "not-picked-up"] as const,
  attendanceCalendar: (params: unknown) => ["attendance", "calendar", params] as const,
  attendanceSummary: (params: unknown) => ["attendance", "summary", params] as const,
  attendanceCorrections: (params: unknown) => ["attendance", "corrections", params] as const,

  pickupPersons: (childId: string) => ["pickup", "persons", childId] as const,
  pickupHistory: (childId: string) => ["pickup", "history", childId] as const,
  pickupVerify: (params: unknown) => ["pickup", "verify", params] as const,

  tariffs: (params: unknown = {}) => ["tariffs", params] as const,
  periods: (year?: number) => ["periods", year ?? "all"] as const,
  billingRules: ["billing", "rules"] as const,
  billingRun: (id: string) => ["billing", "run", id] as const,
  charges: (params: unknown = {}) => ["charges", params] as const,
  payments: (params: unknown = {}) => ["payments", params] as const,
  payment: (id: string) => ["payments", "detail", id] as const,
  debts: (params: unknown = {}) => ["debts", params] as const,
  debtSummary: ["debts", "summary"] as const,
  childDebt: (childId: string) => ["debts", "child", childId] as const,
  expenses: (params: unknown = {}) => ["expenses", params] as const,
  expenseSummary: (year: number) => ["expenses", "summary", year] as const,

  announcements: (params: unknown = {}) => ["announcements", params] as const,
  announcement: (id: string) => ["announcements", "detail", id] as const,
  notifications: (params: unknown = {}) => ["notifications", params] as const,
  notification: (id: string) => ["notifications", "detail", id] as const,
  templates: ["notification-templates"] as const,

  users: (params: unknown = {}) => ["users", params] as const,
  user: (id: string) => ["users", "detail", id] as const,
  userRoles: (id: string) => ["users", id, "roles"] as const,
  userPermissions: (id: string) => ["users", id, "effective-permissions"] as const,
  userOverrides: (id: string) => ["users", id, "overrides"] as const,
  userLoginHistory: (id: string) => ["users", id, "login-history"] as const,

  roles: ["roles"] as const,
  role: (id: string) => ["roles", "detail", id] as const,
  rolesMatrix: ["roles", "matrix"] as const,
  roleUsers: (id: string) => ["roles", id, "users"] as const,
  permissions: ["permissions"] as const,
  permissionGroups: ["permissions", "groups"] as const,

  settings: ["settings"] as const,
  branches: ["branches"] as const,
  holidays: (params: unknown = {}) => ["holidays", params] as const,

  audit: (params: unknown = {}) => ["audit", params] as const,
  auditEntry: (id: string) => ["audit", "detail", id] as const,
  importJob: (id: string) => ["imports", id] as const,
  dashboard: (view: string) => ["dashboard", view] as const,
  report: (report: string, params: unknown) => ["reports", report, params] as const,

  landing: ["landing"] as const,
  landingBlockTypes: ["landing", "block-types"] as const,
  landingVersions: ["landing", "versions"] as const,
  landingVersion: (version: number) => ["landing", "versions", version] as const,
  publicLanding: (lang: string) => ["public-landing", lang] as const,
};

/** Xatoni kod bo'yicha tarjima qilib toast ko'rsatadi. */
export function useErrorToast(): (error: unknown) => void {
  const { t } = useTranslation();
  return useCallback(
    (error: unknown) => {
      const traceId = errorTraceId(error);
      toast.error(errorMessage(t, error), {
        description: traceId ? t("errors.traceId", { traceId }) : undefined,
      });
    },
    [t],
  );
}

export interface ApiMutationOptions<TData, TVars> {
  mutationFn: (variables: TVars) => Promise<TData>;
  /** Muvaffaqiyatda ko'rsatiladigan matn (allaqachon tarjima qilingan). */
  successMessage?: string;
  /** Muvaffaqiyatdan keyin bekor qilinadigan so'rov kalitlari. */
  invalidate?: QueryKey[];
  onSuccess?: (data: TData, variables: TVars) => void;
  onError?: (error: unknown, variables: TVars) => void;
}

/**
 * Barcha yozish amallari uchun umumiy o'ram: xatoni kod bo'yicha lokalizatsiya
 * qiladi, muvaffaqiyatda keshni yangilaydi.
 */
export function useApiMutation<TData, TVars>({
  mutationFn,
  successMessage,
  invalidate,
  onSuccess,
  onError,
}: ApiMutationOptions<TData, TVars>): UseMutationResult<TData, unknown, TVars> {
  const queryClient = useQueryClient();
  const showError = useErrorToast();

  return useMutation<TData, unknown, TVars>({
    mutationFn,
    onSuccess: (data, variables) => {
      if (invalidate?.length) {
        for (const key of invalidate) void queryClient.invalidateQueries({ queryKey: key });
      }
      if (successMessage) toast.success(successMessage);
      onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      if (onError) onError(error, variables);
      else showError(error);
    },
  });
}
