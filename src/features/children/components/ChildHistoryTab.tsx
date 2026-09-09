import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { QueryState } from "@/components/common/QueryState";
import { formatDateTime } from "@/lib/dates";
import { useChildHistory } from "../api";

/** Holat va boshqa o'zgarishlar tasmasi — `GET /children/:id/history`. */
export function ChildHistoryTab({ childId }: { childId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useChildHistory(childId);
  const entries = data ?? [];

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={entries.length === 0}
      emptyTitle={t("children.history.empty")}
      onRetry={() => void refetch()}
      rows={3}
    >
      <Card>
        <CardContent className="space-y-4 p-5">
          {entries.map((entry) => (
            <div key={entry.id} className="flex gap-3 border-b border-border pb-3 last:border-0">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {entry.type ?? "—"}
                  {entry.fromValue || entry.toValue ? (
                    <span className="ml-2 text-muted-foreground">
                      {entry.fromValue ?? "—"} → {entry.toValue ?? "—"}
                    </span>
                  ) : null}
                </div>
                {entry.reason ? (
                  <div className="text-sm text-muted-foreground">{entry.reason}</div>
                ) : null}
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(entry.at)}
                  {entry.userName ? ` · ${entry.userName}` : ""}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </QueryState>
  );
}
