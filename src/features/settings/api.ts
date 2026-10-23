import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  settingsApi,
  type CreateBranchDto,
  type CreateHolidayDto,
  type Holiday,
  type UpdateBranchDto,
  type UpdateSettingsDto,
} from "@/api";
import { qk, useApiMutation } from "@/lib/query";
import { useBootstrapLookups } from "@/auth/auth-context";

export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: () => settingsApi.get() });
}

/** Filiallar ro'yxati — bola, guruh va xarajat formalarida kerak. */
export function useBranches() {
  return useQuery({
    queryKey: qk.branches,
    queryFn: () => settingsApi.branches(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBranchOptions(): { value: string; label: string }[] {
  const { data } = useBootstrapLookups();
  return (data?.branches ?? []).map((branch) => ({
    value: branch.id,
    label: branch.name ?? branch.id,
  }));
}

export function useHolidays(params: { year?: number; branchId?: string }) {
  return useQuery({
    queryKey: qk.holidays(params),
    queryFn: () => settingsApi.holidays(params),
  });
}

export function useUpdateSettings() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: UpdateSettingsDto) => settingsApi.update(dto),
    successMessage: t("settings.form.saved"),
    invalidate: [qk.settings],
  });
}

export function useCreateBranch() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateBranchDto) => settingsApi.createBranch(dto),
    successMessage: t("common.state.created"),
    invalidate: [qk.branches],
  });
}

export function useUpdateBranch() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBranchDto }) =>
      settingsApi.updateBranch(id, dto),
    successMessage: t("common.state.updated"),
    invalidate: [qk.branches],
  });
}

export function useCreateHoliday() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateHolidayDto) => settingsApi.createHoliday(dto),
    successMessage: t("common.state.created"),
    invalidate: [["holidays"]],
  });
}

export function useDeleteHoliday() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (holiday: Holiday) => settingsApi.removeHoliday(holiday.id),
    successMessage: t("common.state.deleted"),
    invalidate: [["holidays"]],
  });
}
