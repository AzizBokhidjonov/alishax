import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Jadval uchun umumiy qobiq — barcha ro'yxat sahifalarida bir xil.
 *
 * `overflow-hidden` kartaning yumaloq burchaklarini saqlaydi: usiz to'g'ri
 * burchakli jadval karta chetidan chiqib turadi. Gorizontal skroll `Table`
 * ning o'z ichki o'ramida (`ui/table.tsx`) — bu yerda takrorlanmaydi.
 */
export function TableCard({
  children,
  title,
  toolbar,
  footer,
  className,
}: {
  children: ReactNode;
  /** Jadval ustidagi sarlavha. */
  title?: ReactNode;
  /** Sarlavha qatorining o'ng tomoni — saralash, eksport va shunga o'xshashlar. */
  toolbar?: ReactNode;
  /** Jadval ostidagi qator — yakuniy summalar va shunga o'xshashlar. */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {title || toolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          {title ? <h2 className="text-sm font-bold">{title}</h2> : <span />}
          {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}
        </div>
      ) : null}
      <CardContent className="p-0">{children}</CardContent>
      {footer ? (
        <div className="flex flex-wrap items-center justify-end gap-6 border-t border-border bg-secondary/30 px-4 py-3 text-sm">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}

/**
 * Yuklanish skeleti jadval tartibini takrorlaydi — sarlavha qatori va
 * qatorlar. `QueryState` ning standart skeleti bir ustunli ro'yxat chizadi
 * va yuklangach tartib sakrab ketadi.
 *
 * Qatorlar navbat bilan paydo bo'ladi: yuklanish "to'xtab qolgan" emas,
 * "kelayotgan" bo'lib ko'rinadi.
 */
export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <TableCard>
      <div className="divide-y divide-border">
        <div className="flex h-11 items-center gap-4 bg-secondary/50 px-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-2.5 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            style={{ animationDelay: `${row * 45}ms` }}
            className="flex h-14 animate-in items-center gap-4 px-4 fade-in-0 duration-500"
          >
            {Array.from({ length: columns }).map((_, column) => (
              <Skeleton key={column} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </TableCard>
  );
}
