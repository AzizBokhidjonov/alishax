import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  announcementsApi,
  notificationsApi,
  type CreateAnnouncementDto,
  type SendNotificationDto,
  type UpsertNotificationTemplateDto,
} from "@/api";
import type { NotificationListParams } from "@/api/endpoints/comms";
import { qk, useApiMutation } from "@/lib/query";

export function useAnnouncements(params: { branchId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: qk.announcements(params),
    queryFn: () => announcementsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateAnnouncement() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateAnnouncementDto) => announcementsApi.create(dto),
    successMessage: t("announcements.created"),
    invalidate: [["announcements"]],
  });
}

export function usePublishAnnouncement() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (id: string) => announcementsApi.publish(id),
    successMessage: t("announcements.published"),
    invalidate: [["announcements"]],
  });
}

export function useDeleteAnnouncement() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (id: string) => announcementsApi.remove(id),
    successMessage: t("common.state.deleted"),
    invalidate: [["announcements"]],
  });
}

export function useNotifications(params: NotificationListParams) {
  return useQuery({
    queryKey: qk.notifications(params),
    queryFn: () => notificationsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: qk.notification(id),
    queryFn: () => notificationsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useRetryNotification() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (id: string) => notificationsApi.retry(id),
    successMessage: t("notifications.retried"),
    invalidate: [["notifications"]],
  });
}

/** `Idempotency-Key` majburiy; server dedup qiladi va navbatga qo'yadi. */
export function useSendNotification() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ dto, idempotencyKey }: { dto: SendNotificationDto; idempotencyKey: string }) =>
      notificationsApi.send(dto, idempotencyKey),
    successMessage: t("notifications.send.done"),
    invalidate: [["notifications"]],
  });
}

export function useTemplates() {
  return useQuery({ queryKey: qk.templates, queryFn: () => notificationsApi.templates() });
}

export function useSaveTemplate() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ key, dto }: { key: string; dto: UpsertNotificationTemplateDto }) =>
      notificationsApi.saveTemplate(key, dto),
    successMessage: t("notifications.templates.saved"),
    invalidate: [qk.templates],
  });
}

export function usePreviewTemplate() {
  return useApiMutation({
    mutationFn: ({ key, sampleData }: { key: string; sampleData: Record<string, string> }) =>
      notificationsApi.previewTemplate(key, sampleData),
  });
}
