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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Money } from "@/components/common/Money";
import { QueryState } from "@/components/common/QueryState";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { formatDate, todayIso } from "@/lib/dates";
import { formatBasisPoints } from "@/lib/money";
import {
  useChildTariffs,
  useDiscounts,
  useEndChildTariff,
  useRevokeDiscount,
} from "@/features/finance/api";
import { AssignTariffDialog, DiscountDialog } from "./ChildFinanceDialogs";
import { ChildAccountSummary, ChildPaymentsCard } from "./ChildAccount";
import { ChildLedgerCard } from "./ChildLedgerCard";

export function ChildFinanceTab({ childId, childName }: { childId: string; childName: string }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const tariffs = useChildTariffs(can(P.tariffManage) ? childId : "");
  const discounts = useDiscounts(can(P.chargeRead) && can(P.discountManage) ? childId : "");
  const revokeDiscount = useRevokeDiscount(childId);
  const endTariff = useEndChildTariff(childId);

  return (
    <div className="space-y-4">
      <ChildAccountSummary childId={childId} childName={childName} />
      {can(P.paymentRead) ? (
        <ChildPaymentsCard key={childId} childId={childId} childName={childName} />
      ) : null}
      {can(P.tariffManage) ? (
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
              emptyDescription=""
              onRetry={() => void tariffs.refetch()}
              rows={2}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tariffs.columns.name")}</TableHead>
                    <TableHead>{t("tariffs.columns.amount")}</TableHead>
                    <TableHead>{t("tariffs.assign.effectiveFrom")}</TableHead>
                    <TableHead>{t("tariffs.assign.effectiveTo")}</TableHead>
                    <TableHead className="text-right">{t("common.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tariffs.data ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.tariffName ?? t("flows.unknownName")}
                      </TableCell>
                      <TableCell>
                        {item.amountTiyin != null ? (
                          <Money value={item.amountTiyin} />
                        ) : (
                          t("flows.unknownAmount")
                        )}
                      </TableCell>
                      <TableCell>{formatDate(item.effectiveFrom)}</TableCell>
                      <TableCell>{formatDate(item.effectiveTo)}</TableCell>
                      <TableCell className="text-right">
                        {/*
                        Biriktirishni muddatidan oldin yopish. Allaqachon
                        yopilganida tugma ko'rsatilmaydi — `effectiveTo` bor
                        biriktirish o'z muddatiga ega va qayta yopilmaydi.
                      */}
                        {can(P.tariffManage) && !item.effectiveTo ? (
                          <ConfirmDialog
                            trigger={
                              <Button size="sm" variant="ghost">
                                {t("tariffs.assign.end")}
                              </Button>
                            }
                            title={t("tariffs.assign.end")}
                            description={t("tariffs.assign.endHint")}
                            onConfirm={() =>
                              endTariff.mutate({
                                assignmentId: item.id,
                                effectiveTo: todayIso(),
                              })
                            }
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
      ) : null}

      {can(P.chargeRead) && can(P.discountManage) ? (
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
              emptyDescription=""
              onRetry={() => void discounts.refetch()}
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
                        {formatDate(discount.validFrom)} —{" "}
                        {discount.validTo ? formatDate(discount.validTo) : t("flows.noEnd")}
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
      ) : null}

      {can(P.chargeRead) ? <ChildLedgerCard childId={childId} /> : null}
    </div>
  );
}
