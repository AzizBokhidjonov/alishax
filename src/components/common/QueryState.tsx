import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Inbox, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { errorMessage, errorTraceId, isForbidden } from "@/lib/errors";
import { EmptyState } from "./EmptyState";

interface QueryStateProps {
  isLoading: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Yuklanish paytida ko'rsatiladigan skelet qatorlari soni. */
  rows?: number;
  /**
   * Standart qatorlar o'rniga o'z skeletingiz. Tarmoq yoki jadval kabi
   * tartiblar uchun — yuklanish va yuklangan holat bir xil ko'rinsin.
   */
  skeleton?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

/**
 * Har bir ro'yxat/sahifa uchun bir xil holatlar: yuklanish, xato, ruxsat yo'q,
 * bo'sh va ma'lumot. Xato matni har doim kod bo'yicha tarjima qilinadi.
 */
export function QueryState({
  isLoading,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyAction,
  rows = 5,
  skeleton,
  onRetry,
  children,
}: QueryStateProps) {
  const { t } = useTranslation();

  if (isLoading) {
    if (skeleton) return <>{skeleton}</>;
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    const forbidden = isForbidden(error);
    const traceId = errorTraceId(error);
    return (
      <EmptyState
        icon={forbidden ? Lock : AlertTriangle}
        title={forbidden ? t("common.state.forbidden") : t("common.state.error")}
        description={forbidden ? t("common.state.forbiddenHint") : errorMessage(t, error)}
        action={
          <div className="space-y-2 text-center">
            {onRetry && !forbidden ? (
              <Button variant="outline" onClick={onRetry}>
                {t("common.actions.retry")}
              </Button>
            ) : null}
            {traceId ? (
              <p className="text-xs text-muted-foreground">{t("errors.traceId", { traceId })}</p>
            ) : null}
          </div>
        }
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={Inbox}
        title={emptyTitle ?? t("common.table.empty")}
        description={emptyDescription ?? t("common.table.emptyHint")}
        action={emptyAction}
      />
    );
  }

  return <>{children}</>;
}
