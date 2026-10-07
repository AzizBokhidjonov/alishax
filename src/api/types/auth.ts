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

/**
 * Sessiya boshlanishidagi YAGONA so'rov (`GET /auth/bootstrap`).
 *
 * `/auth/me` ham ishlaydi, lekin u faqat shaxs va ruxsatlarni beradi —
 * tashkilot, valyuta, vaqt mintaqasi va ruxsat etilgan filial/guruhlar
 * uchun alohida so'rovlar kerak bo'lardi. Bootstrap ularni bir javobda
 * beradi, ya'ni ilova ochilishi bitta so'rovga qisqaradi (§3).
 *
 * Maydonlar ATAYLAB ixtiyoriy: serverning javob sxemasi hujjatlashtirilmagan
 * va eski o'rnatmada bootstrap umuman bo'lmasligi mumkin. Shuning uchun
 * `MeResponse` ga aylantirish `toMe()` orqali va yetishmagan qism `/auth/me`
 * dan to'ldiriladi.
 */
export interface BootstrapResponse {
  user: AuthUser;
  roles?: RoleRef[];
  permissions?: PermissionMap;
  permissionsVersion?: number;
  branchIds?: Id[];
  /** Tarbiyachining o'z guruhlari — `own_group` qamrovi uchun. */
  groupIds?: Id[];
  organization?: {
    id?: Id;
    code?: string;
    displayName?: string;
    timezone?: string;
    currency?: string;
    defaultLanguage?: "uz" | "ru";
  };
  branches?: { id: Id; code?: string; name?: string }[];
  groups?: { id: Id; name?: string; branchId?: Id }[];
}

/** Bootstrap javobidan sessiya uchun kerakli qismni ajratish. */
export function bootstrapToMe(response: BootstrapResponse): MeResponse {
  return {
    user: response.user,
    branchIds: response.branchIds ?? [],
    roles: response.roles ?? [],
    permissions: response.permissions ?? {},
    permissionsVersion: response.permissionsVersion ?? 0,
  };
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
