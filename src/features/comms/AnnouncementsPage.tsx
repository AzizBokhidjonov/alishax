import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Trash2 } from "lucide-react";
import type { AnnouncementPriority } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ListPagination } from "@/components/common/ListPagination";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryState } from "@/components/common/QueryState";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { formatDateTime } from "@/lib/dates";
import { useAnnouncements, useDeleteAnnouncement, usePublishAnnouncement } from "./api";
import { AnnouncementFormDialog } from "./components/AnnouncementFormDialog";

const PRIORITY_TONE: Record<AnnouncementPriority, "neutral" | "info" | "warn" | "danger"> = {
  low: "neutral",
  normal: "info",
  high: "warn",
  emergency: "danger",
};

export function AnnouncementsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAnnouncements({ page, limit: 50 });
  const publish = usePublishAnnouncement();
  const remove = useDeleteAnnouncement();

  const canManage = can(P.announcementManage);
  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("announcements.title")}>
        {canManage ? <AnnouncementFormDialog /> : null}
      </PageHeader>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyTitle={t("announcements.empty")}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={6} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("announcements.columns.title")}</TableHead>
                <TableHead>{t("announcements.columns.audience")}</TableHead>
                <TableHead>{t("announcements.columns.priority")}</TableHead>
                <TableHead>{t("announcements.columns.status")}</TableHead>
                <TableHead>{t("announcements.columns.publishAt")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell className="max-w-[280px]">
                    <div className="truncate font-medium">{announcement.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {announcement.body}
                    </div>
                  </TableCell>
                  <TableCell>{t(`domain.audience.${announcement.audienceType}`)}</TableCell>
                  <TableCell>
                    <Badge tone={PRIORITY_TONE[announcement.priority]}>
                      {t(`domain.priority.${announcement.priority}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {announcement.publishedAt || announcement.status === "published" ? (
                      <Badge tone="ok">{t("announcements.status.published")}</Badge>
                    ) : announcement.status === "expired" ? (
                      <Badge tone="neutral">{t("announcements.status.expired")}</Badge>
                    ) : (
                      <Badge tone="warn">{t("announcements.status.draft")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(announcement.publishAt ?? announcement.publishedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <div className="inline-flex gap-1">
                        {!announcement.publishedAt ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => publish.mutate(announcement.id)}
                          >
                            <Send className="mr-1 h-4 w-4" />
                            {t("announcements.publish")}
                          </Button>
                        ) : null}
                        <ConfirmDialog
                          trigger={
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`${t("common.actions.delete")} — ${announcement.title}`}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title={t("common.confirm.deleteTitle")}
                          description={t("announcements.deleteText", {
                            name: announcement.title,
                          })}
                          destructive
                          onConfirm={() => remove.mutate(announcement.id)}
                        />
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
        <ListPagination meta={data?.meta} onPageChange={setPage} />
      </QueryState>
    </div>
  );
}
