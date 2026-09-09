import { useTranslation } from "react-i18next";
import { TableCard } from "@/components/common/TableCard";
import { Money } from "@/components/common/Money";
import { formatDate, formatDateTime } from "@/lib/dates";

export type ReportRow = Record<string, unknown>;

/** `amountTiyin`, `debtTiyin` — pul ustunlari. */
const isMoneyColumn = (column: string) => /tiyin$/i.test(column);
/** `createdAt`, `paidAt` — vaqt tamg'asi. */
const isTimestampColumn = (column: string) => /At$/.test(column);
/** `birthDate`, `dueDate`, `from`, `to` — kalendar sana. */
const isDateColumn = (column: string) =>
  /date$/i.test(column) || column === "from" || column === "to";

/**
 * Xom API kalitini odam o'qiydigan ko'rinishga keltiradi:
 * `childName` -> `Child name`. Tarjima topilmasa shu ishlatiladi.
 */
function humanize(column: string): string {
  return column
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function Cell({ column, value }: { column: string; value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }

  // Pul faqat `Money` orqali — hech qachon xom tiyin ko'rinmaydi.
  if (isMoneyColumn(column) && (typeof value === "string" || typeof value === "number")) {
    return <Money value={String(value)} hideCurrency />;
  }

  if (typeof value === "boolean") return <span>{value ? "✓" : "—"}</span>;

  if (typeof value === "string") {
    if (isTimestampColumn(column)) return <span>{formatDateTime(value)}</span>;
    if (isDateColumn(column)) return <span>{formatDate(value)}</span>;
    return <span>{value}</span>;
  }

  if (typeof value === "number") return <span className="tabular-nums">{value}</span>;

  // Ichma-ich obyekt/massiv — hisobotlarda kam uchraydi, lekin xom
  // `[object Object]` chiqmasligi kerak.
  return <span className="text-muted-foreground">{JSON.stringify(value)}</span>;
}

/** Hisobot ustunlari serverdan kelgan birinchi qatordan aniqlanadi. */
export function ReportTable({ rows }: { rows: ReportRow[] }) {
  const { t } = useTranslation();
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <TableCard>
      {/*
        Bu xom `<table>` — `ui/table.tsx` ning o'z skroll o'ramiga ega emas,
        shuning uchun o'ram shu yerda qo'lda qo'yiladi. Hisobot ustunlari
        serverdan keladi, ular ko'p bo'lishi mumkin.
      */}
      <div className="relative w-full overflow-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className={`px-3 py-2 font-medium ${
                    isMoneyColumn(column) ? "text-right" : "text-left"
                  }`}
                >
                  {t(`reports.columns.${column}`, { defaultValue: humanize(column) })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-border last:border-0">
                {columns.map((column) => (
                  <td
                    key={column}
                    className={`px-3 py-2 ${isMoneyColumn(column) ? "text-right" : ""}`}
                  >
                    <Cell column={column} value={row[column]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableCard>
  );
}
