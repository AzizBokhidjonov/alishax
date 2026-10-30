import { paymentsApi } from "@/api";
import { chargeLabel } from "@/lib/billing-labels";
import { useExport } from "@/hooks/use-export";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileLink } from "@/components/common/FileLink";
import { Money } from "@/components/common/Money";
import { QueryState } from "@/components/common/QueryState";
import { formatDateTime } from "@/lib/dates";
import { usePayment } from "../api";

/**
 * To'lov tafsiloti: qaysi hisoblarga taqsimlangani va avans qoldig'i.
 * `label` — ochish tugmasining ekran o'quvchi uchun nomi, usiz har bir
 * qatorda bir xil nomsiz tugma chiqadi.
 */
export function PaymentDetailDialog({
  paymentId,
  label,
  childName,
}: {
  paymentId: string;
  label: string;
  childName?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const exporter = useExport();
  const { data, isLoading, error } = usePayment(open ? paymentId : "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" aria-label={`${t("common.actions.view")} — ${label}`}>
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("payments.detail.title")}</DialogTitle>
        </DialogHeader>
        <QueryState isLoading={isLoading} error={error} rows={3}>
          {data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">{t("payments.columns.child")}</div>
                  <div className="font-medium">
                    {data.childName ?? childName ?? t("flows.unknownName")}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t("payments.columns.amount")}</div>
                  <Money value={data.amountTiyin} className="font-medium" />
                </div>
                <div>
                  <div className="text-muted-foreground">{t("payments.columns.paidAt")}</div>
                  <div className="font-medium">{formatDateTime(data.paidAt)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t("payments.columns.method")}</div>
                  <div className="font-medium">{t(`domain.paymentMethod.${data.method}`)}</div>
                </div>
                {data.attachmentFileId ? (
                  <div>
                    <div className="text-muted-foreground">{t("payments.form.attachment")}</div>
                    <FileLink fileId={data.attachmentFileId} />
                  </div>
                ) : null}
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold">{t("payments.detail.allocations")}</div>
                {data.allocations && data.allocations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("charges.columns.description")}</TableHead>
                        <TableHead>{t("common.labels.amount")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.allocations.map((allocation) => (
                        <TableRow key={allocation.chargeId}>
                          <TableCell>
                            {chargeLabel(
                              {
                                description: allocation.chargeDescription,
                                kind: allocation.chargeKind,
                              },
                              t,
                            )}
                          </TableCell>
                          <TableCell>
                            <Money value={allocation.amountTiyin} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("payments.detail.noAllocations")}
                  </p>
                )}
              </div>

              {data.advanceTiyin && data.advanceTiyin !== "0" ? (
                <div className="flex justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
                  <span>{t("payments.detail.advance")}</span>
                  <Money value={data.advanceTiyin} className="font-semibold" />
                </div>
              ) : null}

              <Button
                variant="outline"
                disabled={exporter.busy}
                onClick={() =>
                  void exporter.start(
                    () => paymentsApi.receipt(paymentId, "pdf"),
                    `receipt-${paymentId}.pdf`,
                    "open",
                  )
                }
              >
                {t("payments.receipt.action")}
              </Button>

              {data.cancelReason ? (
                <div className="rounded-xl border border-st-danger-border bg-st-danger-soft p-3 text-sm text-st-danger-fg">
                  {t("payments.cancelled")}: {data.cancelReason}
                </div>
              ) : null}
            </div>
          ) : null}
        </QueryState>
      </DialogContent>
    </Dialog>
  );
}
