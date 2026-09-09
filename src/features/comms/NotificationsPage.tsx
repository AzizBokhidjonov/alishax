import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCcw, Send } from "lucide-react";
import type { NotificationChannel } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/common/StatusBadge";
import { ListPagination } from "@/components/common/ListPagination";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterBar } from "@/components/common/FilterBar";
import { QueryState } from "@/components/common/QueryState";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { SelectField } from "@/components/common/SelectField";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { formatDateTime } from "@/lib/dates";
import { SendNotificationDialog } from "./components/SendNotificationDialog";
import { TemplatesTab } from "./components/TemplatesTab";
import { useNotifications, useRetryNotification } from "./api";
import { useUrlState } from "@/hooks/use-url-state";
import { RefreshButton } from "@/components/common/RefreshButton";

const CHANNELS: NotificationChannel[] = ["telegram", "sms", "internal", "email"];
const STATUSES = ["queued", "sent", "delivered", "failed"] as const;

function NotificationLogTab() {
  const { t } = useTranslation();
  const [channel, setChannel] = useUrlState("notifications.channel", "all");
  const [status, setStatus] = useUrlState("notifications.status", "all");
  const [page, setPage] = useUrlState("notifications.page", 1);

  const { data, isLoading, isFetching, dataUpdatedAt, error, refetch } = useNotifications({
    channel: channel === "all" ? undefined : channel,
    status: status === "all" ? undefined : status,
    page,
    limit: 50,
  });
  const retry = useRetryNotification();
  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      {/*
        Yangilash filtrlar qatorining o'ng chetida turadi, alohida bo'sh
        qatorda emas. Bu ro'yxat tabga tegishli — sahifa sarlavhasidagi
        «Xabar yuborish» yonida turolmaydi, chunki ikkinchi tabda (shablonlar)
        bu so'rov umuman ishlatilmaydi va tugma yolg'on va'da berardi.
      */}
      <FilterBar>
        <SelectField
          label={t("notifications.filters.channel")}
          value={channel}
          onChange={(value) => {
            setChannel(value);
            setPage(1);
          }}
          options={CHANNELS.map((item) => ({ value: item, label: t(`domain.channel.${item}`) }))}
          allOption
          triggerClassName="w-48"
        />
        <SelectField
          label={t("notifications.filters.status")}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={STATUSES.map((item) => ({
            value: item,
            label: t(`domain.notificationStatus.${item}`),
          }))}
          allOption
          triggerClassName="w-48"
        />
        <RefreshButton
          className="ml-auto"
          onRefresh={() => void refetch()}
          isFetching={isFetching}
          updatedAt={dataUpdatedAt}
        />
      </FilterBar>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyTitle={t("notifications.empty")}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={7} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("notifications.columns.createdAt")}</TableHead>
                <TableHead>{t("notifications.columns.template")}</TableHead>
                <TableHead>{t("notifications.columns.recipient")}</TableHead>
                <TableHead>{t("notifications.columns.channel")}</TableHead>
                <TableHead>{t("notifications.columns.status")}</TableHead>
                <TableHead>{t("notifications.columns.attempts")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell>
                    {t(`domain.templateKey.${row.templateKey}`, {
                      defaultValue: row.templateKey,
                    })}
                  </TableCell>
                  <TableCell>{row.recipientName ?? row.recipientId ?? "—"}</TableCell>
                  <TableCell>{t(`domain.channel.${row.channel}`)}</TableCell>
                  <TableCell>
                    <Badge
                      tone={
                        row.status === "failed" ? "danger" : row.status === "queued" ? "warn" : "ok"
                      }
                    >
                      {t(`domain.notificationStatus.${row.status}`)}
                    </Badge>
                    {row.lastError ? (
                      <div className="text-xs text-muted-foreground">{row.lastError}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.attemptCount ?? row.attempts?.length ?? 0}</TableCell>
                  <TableCell className="text-right">
                    {row.status === "failed" ? (
                      <Button size="sm" variant="ghost" onClick={() => retry.mutate(row.id)}>
                        <RefreshCcw className="mr-1 h-4 w-4" />
                        {t("notifications.retry")}
                      </Button>
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

export function NotificationsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();

  return (
    <div className="space-y-6">
      <PageHeader title={t("notifications.title")}>
        {can(P.notificationSend) ? (
          <SendNotificationDialog
            trigger={
              <Button className="h-11">
                <Send className="mr-2 h-4 w-4" />
                {t("notifications.send.title")}
              </Button>
            }
          />
        ) : null}
      </PageHeader>

      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log">{t("notifications.tabs.log")}</TabsTrigger>
          <TabsTrigger value="templates">{t("notifications.tabs.templates")}</TabsTrigger>
        </TabsList>
        <TabsContent value="log">
          <NotificationLogTab />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesTab canManage={can(P.notificationTemplateManage)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
