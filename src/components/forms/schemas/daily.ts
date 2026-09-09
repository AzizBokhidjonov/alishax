import { z } from "zod";
import {
  isoDate,
  optionalId,
  optionalIsoDate,
  optionalText,
  requiredId,
  requiredText,
} from "./common";

export const attendanceStatusSchema = z.object({
  childId: requiredId,
  date: isoDate,
  status: z.enum(["absent", "sick", "vacation", "excused"]),
  note: optionalText,
});
export type AttendanceStatusFormValues = z.infer<typeof attendanceStatusSchema>;

/** Sabab kamida 10 belgi — bu qoida bazada ham majburlangan. */
export const attendanceCorrectionSchema = z.object({
  field: z.enum(["status", "checkInAt", "checkOutAt", "pickupPersonId"]),
  newValue: requiredText(),
  reason: z.string().trim().min(10, "attendance.corrections.reasonTooShort"),
});
export type AttendanceCorrectionFormValues = z.infer<typeof attendanceCorrectionSchema>;

export const checkOutSchema = z.object({
  childId: requiredId,
  pickupPersonId: requiredId,
  note: optionalText,
});
export type CheckOutFormValues = z.infer<typeof checkOutSchema>;

export const pickupPersonSchema = z.object({
  fullName: requiredText(),
  relationship: optionalText,
  phone: optionalText,
  photoFileId: optionalId,
  idDocType: optionalText,
  idDocNumber: optionalText,
  note: optionalText,
  permissionType: z.enum(["permanent", "temporary"]),
  validFrom: isoDate,
  validTo: optionalIsoDate,
  grantedByGuardianId: optionalId,
});
export type PickupPersonFormValues = z.infer<typeof pickupPersonSchema>;

export const temporaryPermissionSchema = z.object({
  childId: requiredId,
  pickupPersonId: optionalId,
  fullName: optionalText,
  phone: optionalText,
  idDocNumber: optionalText,
  validFrom: isoDate,
  validTo: isoDate,
  grantedByGuardianId: optionalId,
  reason: requiredText(),
});
export type TemporaryPermissionFormValues = z.infer<typeof temporaryPermissionSchema>;
