import type { Id, Scope } from "./common";

export interface AuthUser {
  id: Id;
  fullName: string;
  phone?: string;
  email?: string;
  username?: string;
  language?: "uz" | "ru";
  status?: "active" | "inactive";
  avatarUrl?: string;
}

export interface RoleRef {
  id: Id;
  code: string;
  nameUz: string;
  nameRu: string;
}

/** Ruxsat kaliti -> berilgan qamrov. */
export type PermissionMap = Record<string, Scope>;

export interface MeResponse {
  user: AuthUser;
  branchIds: Id[];
  roles: RoleRef[];
  permissions: PermissionMap;
  permissionsVersion: number;
}

export interface LoginDto {
  login: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}
