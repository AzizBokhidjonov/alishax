import type { Id, IsoDate, IsoDateTime } from "./common";

export type PermissionType = "permanent" | "temporary";

export interface PickupPerson {
  id: Id;
  childId?: Id;
  fullName: string;
  relationship?: string;
  phone?: string;
  photoFileId?: Id;
  photoUrl?: string;
  idDocType?: string;
  idDocNumber?: string;
  note?: string;
  permissionType: PermissionType;
  validFrom?: IsoDate;
  validTo?: IsoDate;
  grantedByGuardianId?: Id;
  revokedAt?: IsoDateTime;
  revokeReason?: string;
}

export interface CreatePickupPersonDto {
  fullName: string;
  relationship?: string;
  phone?: string;
  photoFileId?: Id;
  idDocType?: string;
  idDocNumber?: string;
  note?: string;
  permissionType: PermissionType;
  validFrom: IsoDate;
  validTo?: IsoDate;
  grantedByGuardianId?: Id;
}

export type UpdatePickupPersonDto = Partial<
  Omit<CreatePickupPersonDto, "permissionType" | "validFrom" | "validTo" | "grantedByGuardianId">
>;

/**
 * Faol olib ketish ruxsati (`GET /pickup-permissions/active`).
 *
 * Ikki xil bo'ladi: ro'yxatdagi shaxsga berilgan (`pickupPerson` to'la) va
 * BIR MARTALIK — o'shanda `pickupPerson` `null`, ism/telefon esa
 * `adhocFullName`/`adhocPhone` da keladi (Handbook, 2026-10-04).
 *
 * `id` — RUXSAT id'si, shaxs id'si emas: chiqishda u `pickupPermissionId`
 * bo'lib yuboriladi.
 */
export interface ActivePickupPermission {
  id: Id;
  childId?: Id;
  permissionType?: PermissionType;
  validFrom?: IsoDate;
  validTo?: IsoDate;
  revokedAt?: IsoDateTime | null;
  reason?: string;
  grantedByGuardianId?: Id;
  pickupPerson?: PickupPerson | null;
  adhocFullName?: string | null;
  adhocPhone?: string | null;
}

/** Ruxsat egasining ismi — ro'yxatdagi shaxs yoki bir martalik ism. */
export function permissionHolderName(permission: ActivePickupPermission): string {
  return permission.pickupPerson?.fullName ?? permission.adhocFullName ?? "";
}

export interface TemporaryPermissionDto {
  childId: Id;
  pickupPersonId?: Id;
  fullName?: string;
  phone?: string;
  idDocNumber?: string;
  validFrom: IsoDate;
  validTo: IsoDate;
  grantedByGuardianId?: Id;
  reason: string;
}

/**
 * Tekshiruv natijasi.
 *
 * `allowed: false` — MUVAFFAQIYATLI HTTP javob ichidagi rad etish verdikti.
 * Shuning uchun holat kodiga emas, mana shu mantiqiy qiymatga qaraladi.
 *
 * Vasiy yo'lida `permissionId`, `photoUrl` va `expiresAt` KELMASLIGI mumkin —
 * ular faqat berilganda chiziladi.
 */
export interface PickupVerifyResult {
  allowed: boolean;
  reason?: string | null;
  person?: PickupPerson;
  /** Vasiy orqali tekshirilganda qaytadi. */
  guardianId?: Id;
  /** Serverning tanlagan nomi — ko'rsatish uchun eng ishonchli manba. */
  pickupName?: string;
  permissionId?: Id;
  photoUrl?: string;
  expiresAt?: IsoDateTime;
}

export interface PickupHistoryEntry {
  id: Id;
  childId?: Id;
  pickupPersonId?: Id;
  pickupPersonName?: string;
  pickupGuardianId?: Id | null;
  pickupPermissionId?: Id | null;
  at: IsoDateTime;
  action?: string;
  userName?: string;
  note?: string;
}
