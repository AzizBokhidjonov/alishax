import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Money } from "@/components/common/Money";
import { QueryState } from "@/components/common/QueryState";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { formatDate } from "@/lib/dates";
import { formatBasisPoints } from "@/lib/money";
import {
  useChildCharges,
  useChildTariffs,
  useDiscounts,
  useRevokeDiscount,
} from "@/features/finance/api";
import { AssignTariffDialog, DiscountDialog } from "./ChildFinanceDialogs";

export function ChildFinanceTab({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const tariffs = useChildTariffs(childId);
  const discounts = useDiscounts(childId);
  const charges = useChildCharges(childId);
  const revokeDiscount = useRevokeDiscount(childId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("tariffs.assign.title")}</CardTitle>
          {can(P.tariffManage) ? <AssignTariffDialog childId={childId} /> : null}
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            isLoading={tariffs.isLoading}
            error={tariffs.error}
            isEmpty={(tariffs.data ?? []).length === 0}
            emptyTitle={t("tariffs.assign.empty")}
            rows={2}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tariffs.columns.name")}</TableHead>
                  <TableHead>{t("tariffs.columns.amount")}</TableHead>
                  <TableHead>{t("tariffs.assign.effectiveFrom")}</TableHead>
                  <TableHead>{t("tariffs.assign.effectiveTo")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tariffs.data ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.tariffName ?? item.tariffId}
                    </TableCell>
                    <TableCell>
                      <Money value={item.amountTiyin} />
                    </TableCell>
                    <TableCell>{formatDate(item.effectiveFrom)}</TableCell>
                    <TableCell>{formatDate(item.effectiveTo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </QueryState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("tariffs.discounts.title")}</CardTitle>
          {can(P.discountManage) ? <DiscountDialog childId={childId} /> : null}
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            isLoading={discounts.isLoading}
            error={discounts.error}
            isEmpty={(discounts.data ?? []).length === 0}
            emptyTitle={t("tariffs.discounts.empty")}
            rows={2}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tariffs.discounts.kind")}</TableHead>
                  <TableHead>{t("tariffs.discounts.value")}</TableHead>
                  <TableHead>{t("common.labels.date")}</TableHead>
                  <TableHead>{t("common.labels.reason")}</TableHead>
                  <TableHead className="text-right">{t("common.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(discounts.data ?? []).map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell>{t(`domain.discountKind.${discount.kind}`)}</TableCell>
                    <TableCell>
                      {discount.kind === "percent" ? (
                        formatBasisPoints(discount.value)
                      ) : (
                        <Money value={discount.value} />
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(discount.validFrom)} — {formatDate(discount.validTo)}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">{discount.reason}</TableCell>
                    <TableCell className="text-right">
                      {can(P.discountManage) && !discount.revokedAt ? (
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="ghost" className="text-destructive">
                              {t("common.actions.revoke")}
                            </Button>
                          }
                          title={t("tariffs.discounts.revoke")}
                          sensitive
                          destructive
                          onConfirm={() => revokeDiscount.mutate(discount.id)}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </QueryState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("charges.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            isLoading={charges.isLoading}
            error={charges.error}
            isEmpty={(charges.data ?? []).length === 0}
            emptyTitle={t("charges.empty")}
            rows={2}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("charges.columns.period")}</TableHead>
                  <TableHead>{t("charges.columns.description")}</TableHead>
                  <TableHead>{t("charges.columns.amount")}</TableHead>
                  <TableHead>{t("charges.columns.paid")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(charges.data ?? []).map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>
                      {charge.period ? `${charge.period.month}.${charge.period.year}` : "—"}
                    </TableCell>
                    <TableCell>
                      {charge.description ?? "—"}
                      {charge.sign === -1 ? (
                        <Badge tone="danger" className="ml-2">
                          {t("charges.reversed")}
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Money value={charge.amountTiyin} colored />
                    </TableCell>
                    <TableCell>
                      <Money value={charge.paidTiyin ?? "0"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
