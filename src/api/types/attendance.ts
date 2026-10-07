import type { Id, IsoDate, IsoDateTime } from "./common";
import type { MedicalAlert } from "./people";

export type AttendanceStatus =
  "present" | "late" | "early_departure" | "absent" | "sick" | "vacation" | "excused";

/** Davomat yozuvida foydalanuvchi qo'lda qo'yadigan holatlar. */
export type AbsenceStatus = "absent" | "sick" | "vacation" | "excused";

export interface AttendanceRecord {
  id: Id;
  childId: Id;
  childName?: string;
  groupId?: Id;
  groupName?: string;
  date: IsoDate;
  status?: AttendanceStatus;
  checkInAt?: IsoDateTime;
  checkOutAt?: IsoDateTime;
  pickupPersonId?: Id;
  pickupPersonName?: string;
  /** Faol ruxsat (vaqtinchalik va ro'yxatdan tashqari shaxslar ham) orqali berilgan. */
  pickupPermissionId?: Id | null;
  /*
    Ota-ona olib ketganda shu maydon to'ladi (Handbook, 2026-10-04).
    DIQQAT: so'rovda maydon `guardianId`, javobda esa `pickupGuardianId` —
    nomlari ATAYLAB boshqa va ularni almashtirib yuborish 422 beradi.
    Eski yozuvlarda `null` bo'lishi normal.
  */
  pickupGuardianId?: Id | null;
  note?: string;
  healthObservation?: string;
  alerts?: MedicalAlert[];
}

export interface CheckInDto {
  childId: Id;
  at?: IsoDateTime;
  note?: string;
  healthObservation?: string;
}

/**
 * Bolani kim olib ketadi — uch xil manba va ular O'ZARO INKOR ETADI.
 * `guardianId` ni boshqasi bilan birga yuborish serverda `422` beradi.
 */
export type PickupRecipient =
  { kind: "guardian"; id: Id } | { kind: "permission"; id: Id } | { kind: "person"; id: Id };

/** Qabul qiluvchini so'rov maydoniga aylantirish — yagona joyda. */
export function recipientField(recipient: PickupRecipient): {
  guardianId?: Id;
  pickupPermissionId?: Id;
  pickupPersonId?: Id;
} {
  switch (recipient.kind) {
    case "guardian":
      return { guardianId: recipient.id };
    case "permission":
      return { pickupPermissionId: recipient.id };
    case "person":
      return { pickupPersonId: recipient.id };
  }
}

export interface CheckOutDto {
  childId: Id;
  pickupPersonId?: Id;
  pickupPermissionId?: Id;
  /** Bolaga bog'langan vasiy; pickup person/permission bilan birga YUBORILMAYDI. */
  guardianId?: Id;
  at?: IsoDateTime;
  note?: string;
}

export interface SetAttendanceStatusDto {
  childId: Id;
  date: IsoDate;
  status: AbsenceStatus;
  note?: string;
}

export type CorrectableField = "status" | "checkInAt" | "checkOutAt" | "pickupPersonId";

export interface CorrectAttendanceDto {
  field: CorrectableField;
  newValue: string;
  /** Kamida 10 belgi — bazada ham tekshiriladi. */
  reason: string;
}

export interface AttendanceCorrection {
  id: Id;
  attendanceId: Id;
  childId?: Id;
  childName?: string;
  date?: IsoDate;
  field: CorrectableField;
  oldValue?: string;
  newValue?: string;
  reason: string;
  userName?: string;
  at: IsoDateTime;
}

export interface AttendanceCalendarDay {
  date: IsoDate;
  status?: AttendanceStatus;
  checkInAt?: IsoDateTime;
  checkOutAt?: IsoDateTime;
}

export interface AttendanceSummaryRow {
  childId?: Id;
  childName?: string;
  groupId?: Id;
  groupName?: string;
  present: number;
  absent: number;
  sick?: number;
  vacation?: number;
  excused?: number;
  workingDays?: number;
}

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

/**
 * Kunning TO'LIQ reyestri (`GET /attendance/board`).
 *
 * `attendance: null` — «hali YOZILMAGAN», «kelmagan» EMAS. Uchinchi holat
 * aynan shu maydon bilan ifodalanadi va uni yo'qotib qo'yish mumkin emas.
 */
export interface AttendanceBoardItem {
  child: {
    id: Id;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    fullName?: string;
    groupId?: Id;
    groupName?: string;
    photoFileId?: Id;
    hasMedicalAlert?: boolean | null;
  };
  attendance: AttendanceRecord | null;
  recorded?: boolean;
}

export interface AttendanceBoard {
  date: IsoDate;
  data: AttendanceBoardItem[];
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
