import type { Id, IsoDateTime } from "./common";

export type AnnouncementPriority = "low" | "normal" | "high" | "emergency";
export type AudienceType = "all" | "group" | "children" | "guardians" | "staff";

export interface Announcement {
  id: Id;
  branchId?: Id;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  audienceType: AudienceType;
  audienceIds?: Id[];
  fileIds?: Id[];
  publishAt?: IsoDateTime;
  expiresAt?: IsoDateTime;
  publishedAt?: IsoDateTime;
  status?: "draft" | "published" | "expired";
  createdAt?: IsoDateTime;
  createdBy?: string;
  recipientCount?: number;
}

export interface CreateAnnouncementDto {
  branchId?: Id;
  title: string;
  body: string;
  priority?: AnnouncementPriority;
  audienceType: AudienceType;
  audienceIds?: Id[];
  fileIds?: Id[];
  publishAt?: IsoDateTime;
  expiresAt?: IsoDateTime;
}

/** Backend'da mavjud shablon kalitlari. */
export type TemplateKey =
  | "child_arrived"
  | "child_departed"
  | "payment_received"
  | "charge_created"
  | "debt_reminder"
  | "announcement"
  | "event_reminder"
  | "emergency";

export interface NotificationTemplate {
  id?: Id;
  /** Backend maydoni — `key` emas, `templateKey`. */
  templateKey: TemplateKey | string;
  bodyUz: string;
  bodyRu: string;
  variables: string[];
  enabled?: boolean;
  includeAmounts?: boolean;
  updatedAt?: IsoDateTime;
}

export interface UpsertNotificationTemplateDto {
  bodyUz: string;
  bodyRu: string;
  variables: string[];
  enabled?: boolean;
  includeAmounts?: boolean;
}

export type NotificationChannel = "telegram" | "internal";
export type NotificationStatus = "queued" | "sent" | "delivered" | "failed";

export interface NotificationAttempt {
  at: IsoDateTime;
  status?: string;
  error?: string;
}

export interface NotificationLog {
  id: Id;
  templateKey: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipientId?: Id;
  recipientName?: string;
  body?: string;
  attempts?: NotificationAttempt[];
  attemptCount?: number;
  lastError?: string;
  createdAt?: IsoDateTime;
  sentAt?: IsoDateTime;
}

export interface SendNotificationDto {
  templateKey: string;
  recipients: { guardianId?: Id; userId?: Id }[];
  channel: NotificationChannel;
  data: Record<string, string>;
  entityId?: Id;
}

export interface TelegramBinding {
  guardianId: Id;
  guardianName?: string;
  phone?: string;
  chatId?: string;
  language?: "uz" | "ru";
  boundAt?: IsoDateTime;
  unboundAt?: IsoDateTime;
  blockedBot?: boolean;
}

export interface TelegramInviteResult {
  deepLink: string;
  expiresInHours: number;
}
