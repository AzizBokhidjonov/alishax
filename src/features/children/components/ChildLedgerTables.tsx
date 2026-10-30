import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/common/StatusBadge";
import { Money } from "@/components/common/Money";
import { QueryState } from "@/components/common/QueryState";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatPeriod, chargeLabel } from "@/lib/billing-labels";
import { useChargeLedger, useChildCharges } from "@/features/finance/api";
export function CurrentCharges({ childId }: { childId: string }) {
  const { t, i18n } = useTranslation();
  const charges = useChildCharges(childId);

  return (
    <QueryState
      isLoading={charges.isLoading}
      error={charges.error}
      isEmpty={(charges.data ?? []).length === 0}
      emptyTitle={t("charges.empty")}
      emptyDescription=""
      onRetry={() => void charges.refetch()}
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
                {charge.period ? formatPeriod(charge.period, i18n.language) : "—"}
              </TableCell>
              <TableCell>
                {chargeLabel(charge, t)}
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
  );
}

export function LedgerTable({ childId }: { childId: string }) {
  const { t, i18n } = useTranslation();
  const ledger = useChargeLedger(childId);
  const rows = ledger.data?.data ?? [];

  return (
    <QueryState
      isLoading={ledger.isLoading}
      error={ledger.error}
      isEmpty={rows.length === 0}
      emptyTitle={t("charges.ledger.empty")}
      emptyDescription={t("charges.ledger.emptyHint")}
      onRetry={() => void ledger.refetch()}
      rows={3}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("charges.columns.period")}</TableHead>
            <TableHead>{t("charges.columns.description")}</TableHead>
            <TableHead>{t("charges.columns.amount")}</TableHead>
            <TableHead>{t("charges.ledger.createdAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                {entry.period ? formatPeriod(entry.period, i18n.language) : "—"}
              </TableCell>
              <TableCell className="max-w-[320px]">
                <span className="block truncate">{chargeLabel(entry, t)}</span>
                <span className="flex flex-wrap gap-1 pt-1">
                  {entry.reversesChargeId ? (
                    <Badge tone="warn">{t("charges.ledger.reversal")}</Badge>
                  ) : null}
                  {entry.reversedAt ? <Badge tone="danger">{t("charges.reversed")}</Badge> : null}
                  {entry.dueDate ? (
                    <span className="text-xs text-muted-foreground">
                      {t("charges.adjust.dueDate")}: {formatDate(entry.dueDate)}
                    </span>
                  ) : null}
                </span>
              </TableCell>
              <TableCell>
                {/*
                  Ishora summada ko'rinadi: kredit satri manfiy bo'lib
                  chiziladi, aks holda qaytarish va asl yozuv bir xil ko'rinadi.
                */}
                <Money
                  value={
                    entry.sign === -1 && !entry.amountTiyin.startsWith("-")
                      ? `-${entry.amountTiyin}`
                      : entry.amountTiyin
                  }
                  colored
                />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {entry.createdAt ? formatDateTime(entry.createdAt) : "—"}
                {entry.createdByName ? <div>{entry.createdByName}</div> : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </QueryState>
  );
}
