import { api, type QueryParams } from "../http";
import { toPage } from "../types";
import {
  normalizeUserRole,
  normalizeLoginHistory,
  type UserRoleResponse,
  type LoginHistoryResponse,
} from "../adapters/users";
import type {
  AssignRoleDto,
  AuditEntry,
  Branch,
  CloneRoleDto,
  CreateBranchDto,
  CreateHolidayDto,
  CreateRoleDto,
  CreateUserDto,
  EffectivePermission,
  Holiday,
  Id,
  ListParams,
  Paginated,
  Permission,
  PermissionGrant,
  PermissionGroup,
  PermissionOverride,
  PermissionOverrideDto,
  Role,
  RoleDiffEntry,
  RolesMatrix,
  Settings,
  UpdateBranchDto,
  UpdateRoleDto,
  UpdateSettingsDto,
  UpdateUserDto,
  User,
} from "../types";

export interface UserListParams extends ListParams {
  role?: string;
  status?: string;
  branchId?: string;
}

export const usersApi = {
  async list(params: UserListParams = {}): Promise<Paginated<User>> {
    const response = await api.get<Paginated<User> | User[]>("/users", params as QueryParams);
    return toPage(response);
  },
  get: (id: Id) => api.get<User>(`/users/${id}`),
  create: (dto: CreateUserDto) => api.post<User>("/users", dto),
  update: (id: Id, dto: UpdateUserDto) => api.patch<User>(`/users/${id}`, dto),
  /** Foydalanuvchi hech qachon o'chirilmaydi — faqat faolsizlantiriladi. */
  activate: (id: Id) => api.post<User>(`/users/${id}/activate`),
  deactivate: (id: Id) => api.post<User>(`/users/${id}/deactivate`),

  loginHistory: (id: Id) =>
    api
      .get<LoginHistoryResponse[]>(`/users/${id}/login-history`)
      .then((rows) => rows.map(normalizeLoginHistory)),

  roles: (id: Id) =>
    api.get<UserRoleResponse[]>(`/users/${id}/roles`).then((rows) => rows.map(normalizeUserRole)),
  assignRole: (id: Id, dto: AssignRoleDto) => api.post<void>(`/users/${id}/roles`, dto),
  removeRole: (id: Id, roleId: Id, branchId?: string) =>
    api.delete<void>(
      `/users/${id}/roles/${roleId}`,
      branchId ? { query: { branchId } } : undefined,
    ),
  /** Muqobil yo'l: interfeys rolni bitta-bitta qo'shadi/oladi. */
  replaceRoles: (id: Id, roles: AssignRoleDto[]) => api.put<void>(`/users/${id}/roles`, { roles }),

  effectivePermissions: (id: Id) =>
    api.get<EffectivePermission[]>(`/users/${id}/effective-permissions`),
  overrides: (id: Id) => api.get<PermissionOverride[]>(`/users/${id}/permission-overrides`),
  setOverride: (id: Id, dto: PermissionOverrideDto) =>
    api.post<PermissionOverride>(`/users/${id}/permission-overrides`, dto),
  removeOverride: (id: Id, key: string) =>
    api.delete<void>(`/users/${id}/permission-overrides/${encodeURIComponent(key)}`),
};

export const rolesApi = {
  list: (includeSystem = true) => api.get<Role[]>("/roles", { includeSystem }),
  get: (id: Id) => api.get<Role>(`/roles/${id}`),
  create: (dto: CreateRoleDto) => api.post<Role>("/roles", dto),
  update: (id: Id, dto: UpdateRoleDto) => api.patch<Role>(`/roles/${id}`, dto),
  remove: (id: Id) => api.delete<void>(`/roles/${id}`),
  clone: (id: Id, dto: CloneRoleDto) => api.post<Role>(`/roles/${id}/clone`, dto),

  users: (id: Id) => api.get<User[]>(`/roles/${id}/users`),
  matrix: () => api.get<RolesMatrix>("/roles/matrix"),
  diff: (id: Id, against: Id) => api.get<RoleDiffEntry[]>(`/roles/${id}/diff`, { against }),

  /** To'liq almashtirish — matritsani saqlash shu orqali ketadi. */
  replacePermissions: (id: Id, permissions: PermissionGrant[]) =>
    api.put<Role>(`/roles/${id}/permissions`, { permissions }),
  /** Muqobil yo'l: matritsa `replacePermissions` bilan to'liq almashtiradi. */
  grant: (id: Id, grant: PermissionGrant) => api.post<Role>(`/roles/${id}/permissions`, grant),
  revoke: (id: Id, key: string) =>
    api.delete<void>(`/roles/${id}/permissions/${encodeURIComponent(key)}`),
};

export const permissionsApi = {
  /** Javob `{ data: [...] }` konvertida keladi. */
  async list(params: { group?: string; includeDeprecated?: boolean } = {}): Promise<Permission[]> {
    const response = await api.get<{ data: Permission[] } | Permission[]>(
      "/permissions",
      params as QueryParams,
    );
    return Array.isArray(response) ? response : (response.data ?? []);
  },
  async groups(): Promise<PermissionGroup[]> {
    const response = await api.get<{ data: PermissionGroup[] } | PermissionGroup[]>(
      "/permissions/groups",
    );
    return Array.isArray(response) ? response : (response.data ?? []);
  },
};

export const settingsApi = {
  get: () => api.get<Settings>("/settings"),
  update: (dto: UpdateSettingsDto) => api.put<Settings>("/settings", dto),

  branches: () => api.get<Branch[]>("/branches"),
  createBranch: (dto: CreateBranchDto) => api.post<Branch>("/branches", dto),
  updateBranch: (id: Id, dto: UpdateBranchDto) => api.patch<Branch>(`/branches/${id}`, dto),

  holidays: (params: { year?: number; branchId?: string } = {}) =>
    api.get<Holiday[]>("/holidays", params as QueryParams),
  createHoliday: (dto: CreateHolidayDto) => api.post<Holiday>("/holidays", dto),
  removeHoliday: (id: Id) => api.delete<void>(`/holidays/${id}`),
};

export interface AuditListParams extends ListParams {
  entity?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
}

export const auditApi = {
  async list(params: AuditListParams = {}): Promise<Paginated<AuditEntry>> {
    const response = await api.get<Paginated<AuditEntry> | AuditEntry[]>(
      "/audit",
      params as QueryParams,
    );
    return toPage(response);
  },
  get: (id: Id) => api.get<AuditEntry>(`/audit/${id}`),
};
