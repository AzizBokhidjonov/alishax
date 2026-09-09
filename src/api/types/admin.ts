import type { Id, IsoDate, IsoDateTime, Scope, Tiyin } from "./common";
import type { AuthUser, RoleRef } from "./auth";

export interface User extends AuthUser {
  branchIds?: Id[];
  roles?: RoleRef[];
  lastLoginAt?: IsoDateTime;
  createdAt?: IsoDateTime;
}

export interface CreateUserDto {
  fullName: string;
  phone: string;
  email?: string;
  username?: string;
  password: string;
  roleId: Id;
  branchIds: Id[];
}

export interface UpdateUserDto {
  fullName?: string;
  phone?: string;
  email?: string;
  language?: "uz" | "ru";
  password?: string;
}

export interface AssignRoleDto {
  roleId: Id;
  branchId?: Id;
}

export interface UserRoleGrant {
  roleId: Id;
  code?: string;
  nameUz?: string;
  nameRu?: string;
  branchId?: Id;
  branchName?: string;
}

export interface LoginHistoryEntry {
  id: Id;
  at: IsoDateTime;
  ip?: string;
  userAgent?: string;
  success?: boolean;
}

export interface EffectivePermission {
  key: string;
  scope: Scope;
  /** Qaysi rol bergani — «nega ruxsati bor?» ko'rinishi uchun. */
  grantedBy?: string;
  source?: "role" | "override";
}

export interface PermissionOverride {
  key: string;
  scope: Scope;
  effect: "grant" | "deny";
  reason: string;
  validUntil?: IsoDateTime;
  createdAt?: IsoDateTime;
  createdBy?: string;
}

export interface PermissionOverrideDto {
  key: string;
  scope: Scope;
  effect: "grant" | "deny";
  reason: string;
  validUntil?: IsoDateTime;
}

export interface Permission {
  key: string;
  group: string;
  descriptionUz?: string;
  descriptionRu?: string;
  allowedScopes: Scope[];
  sensitive?: boolean;
  deprecated?: boolean;
}

/** `GET /permissions/groups` faqat guruh nomlarini qaytaradi. */
export type PermissionGroup = string;

export interface Role {
  id: Id;
  code: string;
  nameUz: string;
  nameRu: string;
  description?: string;
  isSystem?: boolean;
  isProtected?: boolean;
  userCount?: number;
  permissionCount?: number;
  permissions?: PermissionGrant[];
}

export interface PermissionGrant {
  key: string;
  scope: Scope;
}

export interface CreateRoleDto {
  code: string;
  nameUz: string;
  nameRu: string;
  description?: string;
  permissions: PermissionGrant[];
}

export interface UpdateRoleDto {
  nameUz?: string;
  nameRu?: string;
  description?: string;
}

export interface CloneRoleDto {
  code: string;
  nameUz: string;
  nameRu: string;
}

/** `/roles/matrix` — rollar x ruxsatlar to'ri bitta so'rovda. */
export interface MatrixPermission {
  key: string;
  group: string;
  sensitive?: boolean;
}

export interface MatrixRole {
  id: Id;
  code: string;
  nameUz?: string;
  nameRu?: string;
  isProtected?: boolean;
  /** Ruxsat kaliti -> berilgan qamrov. */
  grants: Record<string, Scope>;
}

export interface RolesMatrix {
  permissions: MatrixPermission[];
  roles: MatrixRole[];
}

export interface RoleDiffEntry {
  key: string;
  left?: Scope;
  right?: Scope;
}
