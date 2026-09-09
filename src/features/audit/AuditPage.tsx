import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { auditApi } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListPagination } from "@/components/common/ListPagination";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterBar } from "@/components/common/FilterBar";
import { QueryState } from "@/components/common/QueryState";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { addDays, formatDateTime, todayIso } from "@/lib/dates";
import { qk } from "@/lib/query";
import { DateField } from "@/components/common/DateField";
import { useUrlState } from "@/hooks/use-url-state";
import { RefreshButton } from "@/components/common/RefreshButton";

/**
 * Bitta yozuvning oldingi/keyingi holati. `label` — ochish tugmasining
 * ekran o'quvchi uchun nomi: usiz har bir qatorda bir xil nomsiz tugma
 * chiqadi va ularni bir-biridan ajratib bo'lmaydi.
 */
function AuditDetailDialog({ id, label }: { id: string; label: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: qk.auditEntry(id),
    queryFn: () => auditApi.get(id),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" aria-label={`${t("common.actions.view")} — ${label}`}>
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("audit.detail.title")}</DialogTitle>
        </DialogHeader>
        <QueryState isLoading={isLoading} error={error} rows={3}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">{t("audit.detail.before")}</Label>
              <pre className="max-h-[420px] overflow-auto rounded-xl bg-secondary p-3 text-xs">
                {JSON.stringify(data?.before ?? {}, null, 2)}
              </pre>
            </div>
            <div>
              <Label className="mb-1 block">{t("audit.detail.after")}</Label>
              <pre className="max-h-[420px] overflow-auto rounded-xl bg-secondary p-3 text-xs">
                {JSON.stringify(data?.after ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </QueryState>
      </DialogContent>
    </Dialog>
  );
}

/** Audit jurnali faqat o'qish uchun — yozish endpointi yo'q (B22). */
export function AuditPage() {
  const { t } = useTranslation();
  const [entity, setEntity] = useUrlState("audit.entity", "");
  const [action, setAction] = useUrlState("audit.action", "");
  const [from, setFrom] = useUrlState("audit.from", addDays(todayIso(), -7));
  const [to, setTo] = useUrlState("audit.to", todayIso());
  const [page, setPage] = useUrlState("audit.page", 1);

  const params = {
    entity: entity.trim() || undefined,
    action: action.trim() || undefined,
    from,
    to,
    page,
    limit: 50,
  };

  const { data, isLoading, isFetching, dataUpdatedAt, error, refetch } = useQuery({
    queryKey: qk.audit(params),
    queryFn: () => auditApi.list(params),
    placeholderData: (previous) => previous,
  });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("audit.title")} subtitle={t("audit.subtitle")}>
        <RefreshButton
          onRefresh={() => void refetch()}
          isFetching={isFetching}
          updatedAt={dataUpdatedAt}
        />
      </PageHeader>

      <FilterBar>
        <div className="space-y-1">
          <Label>{t("audit.filters.entity")}</Label>
          <Input
            className="h-11 w-40"
            value={entity}
            placeholder="child"
            onChange={(event) => {
              setEntity(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label>{t("audit.filters.action")}</Label>
          <Input
            className="h-11 w-40"
            value={action}
            placeholder="update"
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <DateField
          label={t("common.labels.dateFrom")}
          value={from}
          onChange={(value) => {
            setFrom(value);
            setPage(1);
          }}
          clearable={false}
          fieldClassName="w-48"
        />
        <DateField
          label={t("common.labels.dateTo")}
          value={to}
          onChange={(value) => {
            setTo(value);
            setPage(1);
          }}
          min={from}
          clearable={false}
          fieldClassName="w-48"
        />
      </FilterBar>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyTitle={t("audit.empty")}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={6} />}
      >
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("audit.columns.at")}</TableHead>
                <TableHead>{t("audit.columns.user")}</TableHead>
                <TableHead>{t("audit.columns.action")}</TableHead>
                <TableHead>{t("audit.columns.entity")}</TableHead>
                <TableHead>{t("audit.columns.entityId")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDateTime(entry.at)}</TableCell>
                  <TableCell>{entry.userName ?? entry.userId ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{entry.action}</TableCell>
                  <TableCell>{entry.entity}</TableCell>
                  <TableCell className="max-w-[220px] truncate font-mono text-xs">
                    {entry.entityId ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <AuditDetailDialog
                      id={entry.id}
                      label={`${entry.action} · ${formatDateTime(entry.at)}`}
                    />
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
