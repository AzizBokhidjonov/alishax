import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  groupsApi,
  type AssignChildDto,
  type CreateGroupDto,
  type SetStaffDto,
  type TransferChildDto,
  type UpdateGroupDto,
} from "@/api";
import type { GroupListParams } from "@/api/endpoints/groups";
import { qk, useApiMutation } from "@/lib/query";

export function useGroups(params: GroupListParams = {}) {
  return useQuery({
    queryKey: qk.groups(params),
    queryFn: () => groupsApi.list(params),
    staleTime: 60 * 1000,
  });
}

/** Filtr va formalar uchun tayyor variantlar. */
export function useGroupOptions(): { value: string; label: string }[] {
  const { data } = useGroups({ limit: 200 });
  return (data?.data ?? []).map((group) => ({ value: group.id, label: group.name }));
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: qk.group(id),
    queryFn: () => groupsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useGroupChildren(id: string) {
  return useQuery({
    queryKey: qk.groupChildren(id),
    queryFn: () => groupsApi.children(id),
    enabled: Boolean(id),
  });
}

export function useGroupStaff(id: string) {
  return useQuery({
    queryKey: qk.groupStaff(id),
    queryFn: () => groupsApi.staff(id),
    enabled: Boolean(id),
  });
}

export function useGroupHistory(id: string) {
  return useQuery({
    queryKey: qk.groupHistory(id),
    queryFn: () => groupsApi.history(id),
    enabled: Boolean(id),
  });
}

export function useCreateGroup() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateGroupDto) => groupsApi.create(dto),
    successMessage: t("common.state.created"),
    invalidate: [["groups"]],
  });
}

export function useUpdateGroup() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGroupDto }) => groupsApi.update(id, dto),
    successMessage: t("common.state.updated"),
    invalidate: [["groups"]],
  });
}

export function useSetGroupStaff(id: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: SetStaffDto) => groupsApi.setStaff(id, dto),
    successMessage: t("groups.staff.saved"),
    invalidate: [qk.groupStaff(id), qk.group(id)],
  });
}

/**
 * Sig'im to'lganda server `409 CAPACITY_EXCEEDED` qaytaradi; `force`
 * bilan qayta yuborish faqat Director+ uchun va audit yoziladi.
 */
export function useAssignChild(id: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ dto, force }: { dto: AssignChildDto; force?: boolean }) =>
      groupsApi.assignChild(id, dto, force),
    successMessage: t("groups.assign.done"),
    invalidate: [qk.groupChildren(id), qk.group(id), ["children"]],
  });
}

/**
 * Guruh oldindan ma'lum bo'lmagan holat uchun (bola qabul qilish ustasi):
 * guruh identifikatori chaqiruv paytida beriladi.
 */
export function useAssignChildToGroup() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({
      groupId,
      dto,
      force,
    }: {
      groupId: string;
      dto: AssignChildDto;
      force?: boolean;
    }) => groupsApi.assignChild(groupId, dto, force),
    successMessage: t("groups.assign.done"),
    invalidate: [["groups"], ["children"]],
  });
}

export function useTransferChild(id: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ dto, force }: { dto: TransferChildDto; force?: boolean }) =>
      groupsApi.transfer(id, dto, force),
    successMessage: t("groups.transfer.done"),
    invalidate: [["groups"], ["children"]],
  });
}
