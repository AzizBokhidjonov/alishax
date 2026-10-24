import { z } from "zod";
import { todayIso } from "@/lib/dates";
import {
  isoDate,
  optionalEmail,
  optionalId,
  optionalIsoDate,
  optionalText,
  phone,
  requiredId,
  requiredText,
} from "./common";

export const childSchema = z.object({
  branchId: requiredId,
  firstName: requiredText(),
  lastName: requiredText(),
  middleName: optionalText,
  birthDate: isoDate,
  gender: z.enum(["male", "female"]).optional(),
  address: optionalText,
  enrollmentDate: optionalIsoDate,
  contractNumber: optionalText,
  registrationNumber: optionalText,
  note: optionalText,
});
export type ChildFormValues = z.infer<typeof childSchema>;

export const childStatusSchema = z.object({
  status: z.enum([
    "applicant",
    "active",
    "temporarily_absent",
    "suspended",
    "graduated",
    "withdrawn",
    "archived",
  ]),
  effectiveDate: isoDate.refine((value) => value <= todayIso(), "common.validation.invalidDate"),
  reason: requiredText(),
});
export type ChildStatusFormValues = z.infer<typeof childStatusSchema>;

export const childDocumentSchema = z.object({
  type: z.enum([
    "birth_certificate",
    "parent_passport",
    "medical_certificate",
    "contract",
    "consent",
    "other",
  ]),
  number: optionalText,
  issueDate: optionalIsoDate,
  expiryDate: optionalIsoDate,
  fileId: optionalId,
  note: optionalText,
});
export type ChildDocumentFormValues = z.infer<typeof childDocumentSchema>;

export const allergySchema = z.object({
  allergen: requiredText(),
  severity: z.enum(["mild", "moderate", "severe", "anaphylactic"]).optional(),
  reaction: optionalText,
  instruction: optionalText,
});

export const medicationSchema = z.object({
  name: requiredText(),
  dosage: optionalText,
  schedule: optionalText,
  validFrom: optionalIsoDate,
  validTo: optionalIsoDate,
  prescribedBy: optionalText,
});

export const medicalSchema = z.object({
  bloodType: optionalText,
  chronicConditions: optionalText,
  emergencyInstructions: optionalText,
  doctorName: optionalText,
  doctorPhone: optionalText,
  clinic: optionalText,
  note: optionalText,
  allergies: z.array(allergySchema),
  medications: z.array(medicationSchema),
});
export type MedicalFormValues = z.infer<typeof medicalSchema>;

export const consentSchema = z.object({
  guardianId: requiredId,
  consentType: z.enum([
    "personal_data",
    "photography",
    "medical_storage",
    "notifications",
    "mobile_access",
  ]),
  granted: z.boolean(),
  evidenceFileId: optionalId,
});
export type ConsentFormValues = z.infer<typeof consentSchema>;

export const guardianSchema = z.object({
  fullName: requiredText(),
  phone,
  phoneAlt: optionalText,
  email: optionalEmail,
  address: optionalText,
  workplace: optionalText,
  passportNumber: optionalText,
  preferredLanguage: z.enum(["uz", "ru"]).optional(),
});
export type GuardianFormValues = z.infer<typeof guardianSchema>;

export const guardianLinkSchema = z.object({
  guardianId: requiredId,
  relationship: requiredText(),
  isPayer: z.boolean(),
  isEmergencyContact: z.boolean(),
  isPrimaryContact: z.boolean(),
});
export type GuardianLinkFormValues = z.infer<typeof guardianLinkSchema>;

export const groupSchema = z.object({
  branchId: requiredId,
  name: requiredText(),
  ageMinMonths: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().min(0).optional(),
  ),
  ageMaxMonths: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().min(0).optional(),
  ),
  capacity: z.coerce.number().int().min(1),
  open: optionalText,
  close: optionalText,
  status: z.enum(["active", "archived"]).optional(),
});
export type GroupFormValues = z.infer<typeof groupSchema>;

export const groupStaffSchema = z.object({
  mainTeacherId: optionalId,
  assistantTeacherId: optionalId,
  nurseId: optionalId,
});
export type GroupStaffFormValues = z.infer<typeof groupStaffSchema>;

export const assignChildSchema = z.object({
  childId: requiredId,
  effectiveDate: isoDate,
});
export type AssignChildFormValues = z.infer<typeof assignChildSchema>;

export const transferChildSchema = z.object({
  childId: requiredId,
  toGroupId: requiredId,
  effectiveDate: isoDate,
  reason: optionalText,
});
export type TransferChildFormValues = z.infer<typeof transferChildSchema>;
