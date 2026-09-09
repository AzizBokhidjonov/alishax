import { z } from "zod";
import { optionalId, optionalText, requiredText } from "./common";

export const announcementSchema = z.object({
  branchId: optionalId,
  title: requiredText(),
  body: requiredText(),
  priority: z.enum(["low", "normal", "high", "emergency"]),
  audienceType: z.enum(["all", "group", "children", "guardians", "staff"]),
  audienceIds: z.array(z.string()),
  fileIds: z.array(z.string()),
  publishAt: optionalText,
  expiresAt: optionalText,
});
export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export const templateSchema = z.object({
  bodyUz: requiredText(),
  bodyRu: requiredText(),
  variables: requiredText(),
  enabled: z.boolean(),
  includeAmounts: z.boolean(),
});
export type TemplateFormValues = z.infer<typeof templateSchema>;

export const sendNotificationSchema = z.object({
  templateKey: requiredText(),
  channel: z.enum(["telegram", "sms", "internal", "email"]),
  recipientIds: z.array(z.string()).min(1, "common.validation.required"),
  dataJson: optionalText,
});
export type SendNotificationFormValues = z.infer<typeof sendNotificationSchema>;
