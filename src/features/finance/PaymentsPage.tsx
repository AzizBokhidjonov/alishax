import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Ban, FileText } from "lucide-react";
import { paymentsApi, type PaymentMethod } from "@/api";
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
import { Money } from "@/components/common/Money";
import { PageHeader } from "@/components/common/PageHeader";
import { TableCard, TableSkeleton } from "@/components/common/TableCard";
import { FilterBar } from "@/components/common/FilterBar";
import { QueryState } from "@/components/common/QueryState";
import { SelectField } from "@/components/common/SelectField";
import { ChildPicker } from "@/components/common/EntityPicker";
import { usePermissions } from "@/auth/auth-context";
import { useExport } from "@/hooks/use-export";
import { cn, focusRing } from "@/lib/utils";
import { P } from "@/config/permissions";
import { addDays, formatDateTime, todayIso } from "@/lib/dates";
import { addTiyin } from "@/lib/money";
import { PaymentFormDialog } from "./components/PaymentFormDialog";
import { PaymentDetailDialog } from "./components/PaymentDetailDialog";
import { useCancelPayment, usePayments } from "./api";
import { DateField } from "@/components/common/DateField";
import { useUrlState } from "@/hooks/use-url-state";
import { RefreshButton } from "@/components/common/RefreshButton";

const METHODS: PaymentMethod[] = ["cash", "bank", "card", "online", "other"];

export function PaymentsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const exporter = useExport();
  const [from, setFrom] = useUrlState("payments.from", addDays(todayIso(), -30));
  const [to, setTo] = useUrlState("payments.to", todayIso());
  const [method, setMethod] = useUrlState("payments.method", "all");
  const [childId, setChildId] = useUrlState("payments.childId", "");
  const [page, setPage] = useUrlState("payments.page", 1);

  const { data, isLoading, dataUpdatedAt, isFetching, error, refetch } = usePayments({
    from,
    to,
    method: method === "all" ? undefined : method,
    childId: childId || undefined,
    page,
    limit: 50,
  });
  const cancel = useCancelPayment();

  const rows = data?.data ?? [];

  /**
   * Kvitansiya serverda render qilinadi va avtorizatsiya talab qiladi —
   * fayl token bilan olib kelinib, keyin ochiladi. Katta kvitansiya
   * navbatga tushsa `useExport` uni fonda kuzatadi (§4.5).
   */
  const openReceipt = (id: string, format: "pdf" | "html") =>
    exporter.start(
      () => paymentsApi.receipt(id, format),
      `receipt-${id}.${format}`,
      format === "pdf" ? "open" : "save",
    );

  return (
    <div className="space-y-6">
      <PageHeader title={t("payments.title")}>
        <RefreshButton
          onRefresh={() => void refetch()}
          isFetching={isFetching}
          updatedAt={dataUpdatedAt}
        />
        {can(P.paymentCreate) ? <PaymentFormDialog /> : null}
      </PageHeader>

      <FilterBar>
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
        <div className="min-w-60">
          <ChildPicker
            label={t("payments.columns.child")}
            value={childId}
            onChange={(value) => {
              setChildId(value);
              setPage(1);
            }}
          />
        </div>
        <SelectField
          label={t("payments.columns.method")}
          value={method}
          onChange={(value) => {
            setMethod(value);
            setPage(1);
          }}
          options={METHODS.map((item) => ({
            value: item,
            label: t(`domain.paymentMethod.${item}`),
          }))}
          allOption
          triggerClassName="w-48"
        />
      </FilterBar>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyTitle={t("payments.empty")}
        onRetry={() => void refetch()}
        skeleton={<TableSkeleton columns={7} />}
      >
        <TableCard
          className={cn("transition-opacity", isFetching && "opacity-60")}
          footer={
            <>
              <span className="mr-auto text-muted-foreground">{t("common.table.pageTotal")}</span>
              <Money
                value={addTiyin(...rows.map((payment) => payment.amountTiyin))}
                className="font-semibold"
              />
            </>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("payments.columns.paidAt")}</TableHead>
                <TableHead>{t("payments.columns.child")}</TableHead>
                <TableHead>{t("payments.columns.payer")}</TableHead>
                <TableHead>{t("payments.columns.amount")}</TableHead>
                <TableHead>{t("payments.columns.method")}</TableHead>
                <TableHead>{t("payments.columns.recordedBy")}</TableHead>
                <TableHead className="text-right">{t("common.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDateTime(payment.paidAt)}</TableCell>
                  <TableCell className="font-medium">
                    {payment.childId ? (
                      <Link
                        to="/bolalar/$id"
                        params={{ id: payment.childId }}
                        className={cn("rounded-sm hover:underline", focusRing)}
                      >
                        {payment.childName ?? payment.childId}
                      </Link>
                    ) : (
                      (payment.childName ?? "—")
                    )}
                  </TableCell>
                  <TableCell>{payment.payerName ?? "—"}</TableCell>
                  <TableCell>
                    <Money value={payment.amountTiyin} colored />
                    {payment.sign === -1 || payment.cancelledAt ? (
                      <Badge tone="danger" className="ml-2">
                        {t("payments.cancelled")}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{t(`domain.paymentMethod.${payment.method}`)}</TableCell>
                  <TableCell>{payment.recordedBy ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <PaymentDetailDialog
                        paymentId={payment.id}
                        label={`${payment.childName ?? ""} ${formatDateTime(payment.paidAt)}`.trim()}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void openReceipt(payment.id, "pdf")}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        {t("payments.receipt.action")}
                      </Button>
                      {can(P.paymentCancel) && !payment.cancelledAt && payment.sign !== -1 ? (
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Ban className="mr-1 h-4 w-4" />
                              {t("payments.cancel.action")}
                            </Button>
                          }
                          title={t("payments.cancel.title")}
                          description={t("payments.cancel.text")}
                          requireReason
                          sensitive
                          destructive
                          onConfirm={(reason) => cancel.mutate({ id: payment.id, reason })}
                        />
                      ) : null}
                    </div>
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
