import { api, type QueryParams } from "../http";
import { toPage } from "../types";
import type {
  Announcement,
  CreateAnnouncementDto,
  Id,
  ListParams,
  NotificationLog,
  NotificationTemplate,
  Paginated,
  SendNotificationDto,
  UpsertNotificationTemplateDto,
} from "../types";

export const announcementsApi = {
  async list(params: { branchId?: string } & ListParams = {}): Promise<Paginated<Announcement>> {
    const response = await api.get<Paginated<Announcement> | Announcement[]>(
      "/announcements",
      params as QueryParams,
    );
    return toPage(response);
  },
  get: (id: Id) => api.get<Announcement>(`/announcements/${id}`),
  create: (dto: CreateAnnouncementDto) => api.post<Announcement>("/announcements", dto),
  publish: (id: Id) => api.post<Announcement>(`/announcements/${id}/publish`),
  remove: (id: Id) => api.delete<void>(`/announcements/${id}`),
};

export interface NotificationListParams extends ListParams {
  recipientId?: string;
  channel?: string;
  status?: string;
  from?: string;
  to?: string;
}

export const notificationsApi = {
  async list(params: NotificationListParams = {}): Promise<Paginated<NotificationLog>> {
    const response = await api.get<Paginated<NotificationLog> | NotificationLog[]>(
      "/notifications",
      params as QueryParams,
    );
    return toPage(response);
  },
  get: (id: Id) => api.get<NotificationLog>(`/notifications/${id}`),
  retry: (id: Id) => api.post<NotificationLog>(`/notifications/${id}/retry`),
  /** Idempotency-Key majburiy; 20/daqiqa cheklovi bor. */
  send: (dto: SendNotificationDto, idempotencyKey: string) =>
    api.post<NotificationLog[]>("/notifications/send", dto, { idempotencyKey }),

  templates: () => api.get<NotificationTemplate[]>("/notification-templates"),
  saveTemplate: (key: string, dto: UpsertNotificationTemplateDto) =>
    api.put<NotificationTemplate>(`/notification-templates/${key}`, dto),
  previewTemplate: (key: string, sampleData: Record<string, string>) =>
    api.post<{ uz?: string; ru?: string; body?: string }>(
      `/notification-templates/${key}/preview`,
      { sampleData },
    ),
};
