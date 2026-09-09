import type { Id, IsoDate, IsoDateTime, Tiyin } from "./common";
import type { GuardianLink } from "./org";

export type ChildStatus =
  | "applicant"
  | "active"
  | "temporarily_absent"
  | "suspended"
  | "graduated"
  | "withdrawn"
  | "archived";

export type Gender = "male" | "female";

export interface Child {
  id: Id;
  branchId: Id;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: IsoDate;
  gender?: Gender;
  address?: string;
  enrollmentDate?: IsoDate;
  contractNumber?: string;
  registrationNumber?: string;
  note?: string;
  photoFileId?: Id;
  photoUrl?: string;
  status: ChildStatus;
  groupId?: Id;
  groupName?: string;
  hasDebt?: boolean;
  debtTiyin?: Tiyin;
  hasMedicalAlert?: boolean;
}

export interface ChildDetail extends Child {
  group?: { id: Id; name: string } | null;
  tariff?: { id: Id; name: string; amountTiyin: Tiyin } | null;
  guardians?: GuardianLink[];
  alerts?: MedicalAlert[];
}

export interface CreateChildDto {
  branchId: Id;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: IsoDate;
  gender?: Gender;
  address?: string;
  enrollmentDate?: IsoDate;
  contractNumber?: string;
  registrationNumber?: string;
  note?: string;
}

export type UpdateChildDto = Partial<CreateChildDto> & { photoFileId?: Id };

export interface ChildStatusDto {
  status: ChildStatus;
  effectiveDate: IsoDate;
  reason?: string;
}

export interface ChildHistoryEntry {
  id: Id;
  at: IsoDateTime;
  type?: string;
  fromValue?: string;
  toValue?: string;
  reason?: string;
  userName?: string;
}

export type ChildDocumentType =
  | "birth_certificate"
  | "parent_passport"
  | "medical_certificate"
  | "contract"
  | "consent"
  | "other";

export interface ChildDocument {
  id: Id;
  childId: Id;
  childName?: string;
  type: ChildDocumentType;
  number?: string;
  issueDate?: IsoDate;
  expiryDate?: IsoDate;
  fileId?: Id;
  note?: string;
  verifiedAt?: IsoDateTime;
  verifiedBy?: string;
}

export interface CreateChildDocumentDto {
  type: ChildDocumentType;
  number?: string;
  issueDate?: IsoDate;
  expiryDate?: IsoDate;
  fileId?: Id;
  note?: string;
}

export type UpdateChildDocumentDto = Omit<CreateChildDocumentDto, "type" | "fileId">;

export type AllergySeverity = "mild" | "moderate" | "severe" | "anaphylactic";

export interface Allergy {
  allergen: string;
  severity?: AllergySeverity;
  reaction?: string;
  instruction?: string;
}

export interface Medication {
  name: string;
  dosage?: string;
  schedule?: string;
  validFrom?: IsoDate;
  validTo?: IsoDate;
  prescribedBy?: string;
}

export interface MedicalRecord {
  bloodType?: string;
  chronicConditions?: string;
  emergencyInstructions?: string;
  doctorName?: string;
  doctorPhone?: string;
  clinic?: string;
  note?: string;
  allergies?: Allergy[];
  medications?: Medication[];
}

/** Tarbiyachi va qabulxona ko'radigan qisqartirilgan ogohlantirish. */
export interface MedicalAlert {
  allergen: string;
  severity?: AllergySeverity;
  instruction?: string;
}

export type ConsentType =
  "personal_data" | "photography" | "medical_storage" | "notifications" | "mobile_access";

export interface Consent {
  id: Id;
  guardianId: Id;
  guardianName?: string;
  consentType: ConsentType;
  granted: boolean;
  evidenceFileId?: Id;
  createdAt?: IsoDateTime;
  revokedAt?: IsoDateTime;
}
