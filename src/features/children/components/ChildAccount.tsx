import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryState } from "@/components/common/QueryState";
import { ListPagination } from "@/components/common/ListPagination";
import { Money } from "@/components/common/Money";
import { Badge } from "@/components/common/StatusBadge";
import { useChildDebt, usePayments } from "@/features/finance/api";
import { PaymentFormDialog } from "@/features/finance/components/PaymentFormDialog";
import { PaymentDetailDialog } from "@/features/finance/components/PaymentDetailDialog";
import { formatDateTime } from "@/lib/dates";
import { ChildDebtCard } from "./ChildDebtCard";

export function ChildAccountSummary({
  childId,
  childName,
}: {
  childId: string;
  childName: string;
}) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const debt = useChildDebt(can(P.debtRead) ? childId : "");
  return (
    <section className="space-y-4" aria-label={t("flows.account")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("flows.account")}</h2>
          <p className="text-sm text-muted-foreground">{t("flows.accountHint")}</p>
        </div>
        {can(P.paymentCreate) ? (
          <PaymentFormDialog childId={childId} childName={childName} />
        ) : null}
      </div>
      {can(P.debtRead) ? (
        <QueryState
          isLoading={debt.isLoading}
          error={debt.error}
          onRetry={() => void debt.refetch()}
          rows={2}
        >
          {debt.data ? (
            <ChildDebtCard debt={debt.data} childId={childId} childName={childName} />
          ) : null}
        </QueryState>
      ) : null}
    </section>
  );
}

export function ChildPaymentsCard({ childId, childName }: { childId: string; childName: string }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const payments = usePayments({ childId, page, limit: 10 });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("flows.history")}</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryState
          isLoading={payments.isLoading}
          error={payments.error}
          isEmpty={payments.data?.data.length === 0}
          emptyTitle={t("flows.noPayments")}
          emptyDescription=""
          onRetry={() => void payments.refetch()}
          rows={2}
        >
          <ul className="divide-y divide-border">
            {(payments.data?.data ?? []).map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium">{formatDateTime(payment.paidAt)}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`domain.paymentMethod.${payment.method}`)} ·{" "}
                    {payment.payerName ?? t("flows.noPayer")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Money value={payment.amountTiyin} className="font-semibold" />
                  {payment.isCancelled || payment.cancelledAt || payment.sign === -1 ? (
                    <Badge tone="danger">{t("payments.cancelled")}</Badge>
                  ) : null}
                  <PaymentDetailDialog
                    paymentId={payment.id}
                    childName={childName}
                    label={childName + " · " + formatDateTime(payment.paidAt)}
                  />
                </div>
              </li>
            ))}
          </ul>
          <ListPagination meta={payments.data?.meta} onPageChange={setPage} />
        </QueryState>
      </CardContent>
    </Card>
  );
}
