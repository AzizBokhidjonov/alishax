import type { UserRoleGrant, LoginHistoryEntry } from "../types";
export interface UserRoleResponse extends UserRoleGrant {
  role?: { code: string; nameUz: string; nameRu: string };
  branch?: { code: string; name?: string } | null;
}
export function normalizeUserRole(row: UserRoleResponse): UserRoleGrant {
  return {
    ...row,
    code: row.role?.code ?? row.code,
    nameUz: row.role?.nameUz ?? row.nameUz,
    nameRu: row.role?.nameRu ?? row.nameRu,
    branchName: row.branch?.name ?? row.branch?.code ?? row.branchName,
  };
}
export interface LoginHistoryResponse extends LoginHistoryEntry {
  attemptedAt?: string;
}
export function normalizeLoginHistory(row: LoginHistoryResponse): LoginHistoryEntry {
  return { ...row, at: row.attemptedAt ?? row.at };
}
