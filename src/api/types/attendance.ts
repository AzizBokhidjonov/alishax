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

export interface CheckOutDto {
  childId: Id;
  pickupPersonId?: Id;
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

export interface PickupVerifyResult {
  allowed: boolean;
  reason?: string;
  person?: PickupPerson;
  photoUrl?: string;
  expiresAt?: IsoDateTime;
}

export interface PickupHistoryEntry {
  id: Id;
  childId?: Id;
  pickupPersonId?: Id;
  pickupPersonName?: string;
  at: IsoDateTime;
  action?: string;
  userName?: string;
  note?: string;
}
