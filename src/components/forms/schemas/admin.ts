import { z } from "zod";
import {
  isoDate,
  optionalEmail,
  optionalId,
  optionalText,
  password,
  phone,
  requiredId,
  requiredText,
} from "./common";

export const userSchema = z.object({
  fullName: requiredText(),
  phone,
  email: optionalEmail,
  username: optionalText,
  password,
  roleId: requiredId,
  branchIds: z.array(z.string()).min(1, "common.validation.required"),
});
export type UserFormValues = z.infer<typeof userSchema>;

export const userUpdateSchema = z.object({
  fullName: requiredText(),
  phone,
  email: optionalEmail,
  language: z.enum(["uz", "ru"]).optional(),
  password: z
    .string()
    .optional()
    .transform((value) => (value === "" ? undefined : value))
    .refine((value) => !value || value.length >= 10, "auth.minPassword"),
});
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;

export const assignRoleSchema = z.object({
  roleId: requiredId,
  branchId: optionalId,
});
export type AssignRoleFormValues = z.infer<typeof assignRoleSchema>;

export const overrideSchema = z.object({
  key: requiredText(),
  scope: z.enum(["all", "branch", "own_group", "today", "self"]),
  effect: z.enum(["grant", "deny"]),
  reason: requiredText(),
  validUntil: optionalText,
});
export type OverrideFormValues = z.infer<typeof overrideSchema>;

export const roleSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "common.validation.required")
    .regex(/^[a-z0-9_]+$/, "common.validation.required"),
  nameUz: requiredText(),
  nameRu: requiredText(),
  description: optionalText,
});
export type RoleFormValues = z.infer<typeof roleSchema>;

export const branchSchema = z.object({
  code: requiredText(),
  name: requiredText(),
  address: optionalText,
  phone: optionalText,
  status: z.enum(["active", "closed"]).optional(),
});
export type BranchFormValues = z.infer<typeof branchSchema>;

export const holidaySchema = z.object({
  holidayDate: isoDate,
  name: requiredText(),
  branchId: optionalId,
  isWorking: z.boolean(),
});
export type HolidayFormValues = z.infer<typeof holidaySchema>;

const settingsTime = z
  .string()
  .trim()
  .refine(
    (value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    "settings.form.invalidTime",
  );

export const settingsSchema = z
  .object({
    displayName: requiredText(),
    address: z.string().trim(),
    phones: z.string().trim(),
    workingDays: z.array(z.number().int().min(1).max(7)),
    open: settingsTime,
    close: settingsTime,
    defaultLanguage: z.enum(["uz", "ru"], { required_error: "common.validation.required" }),
    currency: requiredText(),
    timezone: requiredText(),
    receiptNumberFormat: requiredText(),
    paymentDueDay: z.coerce
      .number({ invalid_type_error: "settings.form.invalidDueDay" })
      .int("settings.form.invalidDueDay")
      .min(1, "settings.form.invalidDueDay")
      .max(28, "settings.form.invalidDueDay"),
  })
  .refine((values) => Boolean(values.open) === Boolean(values.close), {
    path: ["close"],
    message: "settings.form.bothHoursRequired",
  });
export type SettingsFormValues = z.infer<typeof settingsSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "common.validation.required"),
    newPassword: password,
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    path: ["newPassword"],
    message: "common.validation.required",
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
