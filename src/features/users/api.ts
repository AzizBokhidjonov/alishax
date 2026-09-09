import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  permissionsApi,
  rolesApi,
  usersApi,
  type AssignRoleDto,
  type CloneRoleDto,
  type CreateRoleDto,
  type CreateUserDto,
  type PermissionGrant,
  type PermissionOverrideDto,
  type UpdateRoleDto,
  type UpdateUserDto,
} from "@/api";
import type { UserListParams } from "@/api/endpoints/admin";
import { useAuth } from "@/auth/auth-context";
import { qk, useApiMutation } from "@/lib/query";

export function useUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: qk.users(params),
    queryFn: () => usersApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: qk.user(id),
    queryFn: () => usersApi.get(id),
    enabled: Boolean(id),
  });
}

export function useUserRoles(id: string) {
  return useQuery({
    queryKey: qk.userRoles(id),
    queryFn: () => usersApi.roles(id),
    enabled: Boolean(id),
  });
}

export function useEffectivePermissions(id: string) {
  return useQuery({
    queryKey: qk.userPermissions(id),
    queryFn: () => usersApi.effectivePermissions(id),
    enabled: Boolean(id),
  });
}

export function useUserOverrides(id: string) {
  return useQuery({
    queryKey: qk.userOverrides(id),
    queryFn: () => usersApi.overrides(id),
    enabled: Boolean(id),
  });
}

export function useLoginHistory(id: string) {
  return useQuery({
    queryKey: qk.userLoginHistory(id),
    queryFn: () => usersApi.loginHistory(id),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(dto),
    successMessage: t("common.state.created"),
    invalidate: [["users"]],
  });
}

export function useUpdateUser() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) => usersApi.update(id, dto),
    successMessage: t("common.state.updated"),
    invalidate: [["users"]],
  });
}

/** Foydalanuvchi o'chirilmaydi — faqat faolsizlantiriladi (audit saqlanadi). */
export function useToggleUserActive() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? usersApi.activate(id) : usersApi.deactivate(id),
    successMessage: t("common.state.updated"),
    invalidate: [["users"]],
  });
}

/** Rol/ruxsat o'zgarsa `permissionsVersion` oshadi — `/auth/me` qayta o'qiladi. */
function useRefreshMeAfterChange() {
  const { refreshMe } = useAuth();
  return () => {
    void refreshMe();
  };
}

export function useAssignUserRole(userId: string) {
  const { t } = useTranslation();
  const refresh = useRefreshMeAfterChange();
  return useApiMutation({
    mutationFn: (dto: AssignRoleDto) => usersApi.assignRole(userId, dto),
    successMessage: t("users.roles.assigned"),
    invalidate: [qk.userRoles(userId), qk.userPermissions(userId), ["users"]],
    onSuccess: refresh,
  });
}

export function useRemoveUserRole(userId: string) {
  const { t } = useTranslation();
  const refresh = useRefreshMeAfterChange();
  return useApiMutation({
    mutationFn: ({ roleId, branchId }: { roleId: string; branchId?: string }) =>
      usersApi.removeRole(userId, roleId, branchId),
    successMessage: t("users.roles.removed"),
    invalidate: [qk.userRoles(userId), qk.userPermissions(userId), ["users"]],
    onSuccess: refresh,
  });
}

export function useSetOverride(userId: string) {
  const { t } = useTranslation();
  const refresh = useRefreshMeAfterChange();
  return useApiMutation({
    mutationFn: (dto: PermissionOverrideDto) => usersApi.setOverride(userId, dto),
    successMessage: t("users.overrides.saved"),
    invalidate: [qk.userOverrides(userId), qk.userPermissions(userId)],
    onSuccess: refresh,
  });
}

export function useRemoveOverride(userId: string) {
  const { t } = useTranslation();
  const refresh = useRefreshMeAfterChange();
  return useApiMutation({
    mutationFn: (key: string) => usersApi.removeOverride(userId, key),
    successMessage: t("users.overrides.removed"),
    invalidate: [qk.userOverrides(userId), qk.userPermissions(userId)],
    onSuccess: refresh,
  });
}

/* --------------------------------------------------------------- rollar */

export function useRoles() {
  return useQuery({ queryKey: qk.roles, queryFn: () => rolesApi.list(true) });
}

export function useRolesMatrix() {
  return useQuery({ queryKey: qk.rolesMatrix, queryFn: () => rolesApi.matrix() });
}

export function useRoleUsers(id: string) {
  return useQuery({
    queryKey: qk.roleUsers(id),
    queryFn: () => rolesApi.users(id),
    enabled: Boolean(id),
  });
}

export function usePermissionGroups() {
  return useQuery({
    queryKey: qk.permissionGroups,
    queryFn: () => permissionsApi.groups(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Ruxsatlar katalogi: har bir kalitning ruxsat etilgan qamrovlari va
 * eskirgan-eskirmagani. Matritsa shu ro'yxatsiz kalit qabul qilmaydigan
 * qamrovni ham taklif qilib qo'yardi (§10.2).
 */
export function usePermissionCatalog(includeDeprecated = false) {
  return useQuery({
    queryKey: [...qk.permissions, includeDeprecated],
    queryFn: () => permissionsApi.list({ includeDeprecated }),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateRole() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateRoleDto) => rolesApi.create(dto),
    successMessage: t("roles.created"),
    invalidate: [qk.roles, qk.rolesMatrix],
  });
}

export function useUpdateRole() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRoleDto }) => rolesApi.update(id, dto),
    successMessage: t("roles.updated"),
    invalidate: [qk.roles, qk.rolesMatrix],
  });
}

export function useDeleteRole() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    successMessage: t("roles.deleted"),
    invalidate: [qk.roles, qk.rolesMatrix],
  });
}

export function useCloneRole() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CloneRoleDto }) => rolesApi.clone(id, dto),
    successMessage: t("roles.clone.done"),
    invalidate: [qk.roles, qk.rolesMatrix],
  });
}

/** Matritsani saqlash: rolning ruxsatlari to'liq almashtiriladi. */
export function useReplaceRolePermissions() {
  const { t } = useTranslation();
  const refresh = useRefreshMeAfterChange();
  return useApiMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: PermissionGrant[] }) =>
      rolesApi.replacePermissions(id, permissions),
    successMessage: t("roles.matrix.saved"),
    invalidate: [qk.roles, qk.rolesMatrix],
    onSuccess: refresh,
  });
}
