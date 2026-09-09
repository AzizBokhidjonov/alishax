import { z } from "zod";

/**
 * Umumiy validatorlar. Xato matnlari i18n kaliti sifatida saqlanadi va
 * ko'rsatishdan oldin `t()` orqali tarjima qilinadi.
 */

export const requiredText = (min = 1) =>
  z
    .string()
    .trim()
    .min(min, min > 1 ? "common.validation.minLength" : "common.validation.required");

export const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "common.validation.invalidDate");

export const optionalIsoDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value))
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "common.validation.invalidDate");

/** Telefon: bo'sh joy va qavslar qabul qilinadi, server normallashtiradi. */
export const phone = z
  .string()
  .trim()
  .min(7, "common.validation.invalidPhone")
  .regex(/^[+0-9 ()-]+$/, "common.validation.invalidPhone");

export const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value))
  .refine(
    (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "common.validation.invalidEmail",
  );

/** Foydalanuvchi so'mda kiritadi; tiyinga o'tkazish `toTiyin` bilan. */
export const somAmount = z
  .string()
  .trim()
  .min(1, "common.validation.required")
  .regex(/^\d+([.,]\d{1,2})?$/, "common.validation.invalidAmount")
  .refine((value) => Number(value.replace(",", ".")) > 0, "common.validation.positiveAmount");

export const optionalSomAmount = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value))
  .refine(
    (value) => !value || /^\d+([.,]\d{1,2})?$/.test(value),
    "common.validation.invalidAmount",
  );

export const requiredId = z.string().trim().min(1, "common.validation.required");
export const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" || value === "all" ? undefined : value));

/** Sabab: maxsus amallarda majburiy, davomat tuzatishida kamida 10 belgi. */
export const reason = (min = 1) => z.string().trim().min(min, "common.confirm.reasonRequired");

export const password = z.string().min(10, "auth.minPassword");
