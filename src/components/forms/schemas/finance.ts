import { z } from "zod";
import {
  isoDate,
  optionalId,
  optionalIsoDate,
  optionalSomAmount,
  optionalText,
  requiredId,
  requiredText,
  somAmount,
} from "./common";

export const tariffSchema = z.object({
  branchId: optionalId,
  name: requiredText(),
  kind: z.enum([
    "monthly_fixed",
    "full_day",
    "half_day",
    "group_based",
    "attendance_based",
    "meal",
    "transport",
    "extra_class",
    "registration_fee",
  ]),
  amountSom: somAmount,
  active: z.boolean(),
});
export type TariffFormValues = z.infer<typeof tariffSchema>;

export const assignTariffSchema = z.object({
  tariffId: requiredId,
  effectiveFrom: isoDate,
  effectiveTo: optionalIsoDate,
});
export type AssignTariffFormValues = z.infer<typeof assignTariffSchema>;

export const discountSchema = z
  .object({
    kind: z.enum(["percent", "fixed"]),
    /** `percent` uchun foiz, `fixed` uchun so'm. */
    value: z
      .string()
      .trim()
      .min(1, "common.validation.required")
      .regex(/^\d+([.,]\d{1,2})?$/, "common.validation.invalidAmount"),
    validFrom: isoDate,
    validTo: optionalIsoDate,
    reason: requiredText(),
  })
  .refine((values) => values.kind !== "percent" || Number(values.value.replace(",", ".")) <= 100, {
    path: ["value"],
    message: "common.validation.invalidAmount",
  });
export type DiscountFormValues = z.infer<typeof discountSchema>;

export const periodSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});
export type PeriodFormValues = z.infer<typeof periodSchema>;

/**
 * Qo'lda tuzatish — oilaga kredit yoki qo'shimcha qarz.
 *
 * Summa har doim MUSBAT so'mda kiritiladi, yo'nalishni esa `sign` aytadi:
 * ikkita alohida maydon bitta ishorali maydondan xavfsizroq — «minus»ni
 * ko'rmay qolib oilaga qarz yozib yuborish mumkin emas.
 *
 * Sabab kamida 10 belgi: server ham shuni talab qiladi va bu yozuv
 * daftarchada abadiy qoladi.
 */
export const adjustmentSchema = z.object({
  periodId: requiredId,
  sign: z.enum(["-1", "1"]),
  amountSom: somAmount,
  reason: requiredText(10),
  dueDate: optionalIsoDate,
});
export type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

export const manualChargeSchema = z.object({
  childId: requiredId,
  periodId: requiredId,
  amountSom: somAmount,
  description: requiredText(),
});
export type ManualChargeFormValues = z.infer<typeof manualChargeSchema>;

export const paymentSchema = z.object({
  childId: requiredId,
  payerGuardianId: optionalId,
  amountSom: somAmount,
  method: z.enum(["cash", "bank", "card", "online", "other"]),
  paidAt: z.string().trim().min(1, "common.validation.required"),
  receiptNo: optionalText,
  bankRef: optionalText,
  attachmentFileId: optionalId,
  note: optionalText,
});
export type PaymentFormValues = z.infer<typeof paymentSchema>;

export const expenseSchema = z.object({
  branchId: requiredId,
  type: z.enum([
    "electricity",
    "gas",
    "cold_water",
    "hot_water",
    "heating",
    "waste",
    "internet",
    "telephone",
    "security",
    "rent",
    "other",
  ]),
  provider: optionalText,
  contractNumber: optionalText,
  billingYear: z.coerce.number().int().min(2000).max(2100),
  billingMonth: z.coerce.number().int().min(1).max(12),
  invoiceNumber: optionalText,
  amountSom: somAmount,
  dueDate: optionalIsoDate,
  attachmentFileId: optionalId,
  note: optionalText,
});
export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const payExpenseSchema = z.object({
  paidAt: z.string().trim().min(1, "common.validation.required"),
  amountSom: somAmount,
  attachmentFileId: optionalId,
});
export type PayExpenseFormValues = z.infer<typeof payExpenseSchema>;

export const billingRulesSchema = z.object({
  effectiveFrom: isoDate,
  note: optionalText,
  rulesJson: z.string().trim().min(2, "common.validation.required"),
});
export type BillingRulesFormValues = z.infer<typeof billingRulesSchema>;

export const simulateSchema = z.object({
  childId: requiredId,
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});
export type SimulateFormValues = z.infer<typeof simulateSchema>;

export const updateExpenseSchema = z.object({
  provider: optionalText,
  amountSom: optionalSomAmount,
  dueDate: optionalIsoDate,
  note: optionalText,
});
export type UpdateExpenseFormValues = z.infer<typeof updateExpenseSchema>;
