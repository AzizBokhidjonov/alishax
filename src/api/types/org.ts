import type { Id, IsoDate, IsoDateTime } from "./common";

export interface Guardian {
  id: Id;
  fullName: string;
  phone: string;
  phoneAlt?: string;
  email?: string;
  address?: string;
  workplace?: string;
  passportNumber?: string;
  preferredLanguage?: "uz" | "ru";
  telegramBound?: boolean;
  childrenCount?: number;
}

export interface CreateGuardianDto {
  fullName: string;
  phone: string;
  phoneAlt?: string;
  email?: string;
  address?: string;
  workplace?: string;
  passportNumber?: string;
  preferredLanguage?: "uz" | "ru";
}

export type UpdateGuardianDto = Partial<CreateGuardianDto>;

export interface GuardianLink {
  guardianId: Id;
  childId?: Id;
  guardian?: Guardian;
  fullName?: string;
  phone?: string;
  relationship: string;
  isPayer?: boolean;
  isEmergencyContact?: boolean;
  isPrimaryContact?: boolean;
}

export interface LinkGuardianDto {
  guardianId: Id;
  relationship: string;
  isPayer?: boolean;
  isEmergencyContact?: boolean;
  isPrimaryContact?: boolean;
}

export type UpdateGuardianLinkDto = Omit<LinkGuardianDto, "guardianId">;

export interface Group {
  id: Id;
  branchId: Id;
  name: string;
  ageMinMonths?: number;
  ageMaxMonths?: number;
  capacity: number;
  currentCount?: number;
  availablePlaces?: number;
  workingHours?: { open: string; close: string };
  status?: "active" | "archived";
  mainTeacherId?: Id;
  mainTeacherName?: string;
  assistantTeacherId?: Id;
  nurseId?: Id;
}

export interface CreateGroupDto {
  branchId: Id;
  name: string;
  ageMinMonths?: number;
  ageMaxMonths?: number;
  capacity?: number;
  workingHours?: { open: string; close: string };
}

export type UpdateGroupDto = Partial<CreateGroupDto> & { status?: "active" | "archived" };

export interface SetStaffDto {
  mainTeacherId?: Id;
  assistantTeacherId?: Id;
  nurseId?: Id;
}

export interface AssignChildDto {
  childId: Id;
  effectiveDate: IsoDate;
}

export interface TransferChildDto {
  childId: Id;
  toGroupId: Id;
  effectiveDate: IsoDate;
  reason?: string;
}

export interface GroupHistoryEntry {
  id: Id;
  at: IsoDateTime;
  childId?: Id;
  childName?: string;
  action?: string;
  fromGroupName?: string;
  toGroupName?: string;
  reason?: string;
  userName?: string;
}
