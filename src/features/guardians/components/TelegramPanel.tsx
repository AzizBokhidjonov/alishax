import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/common/StatusBadge";
import { QueryState } from "@/components/common/QueryState";
import { formatDateTime } from "@/lib/dates";
import { useTelegramBindings, useTelegramInvite, useTelegramUnbound } from "../api";

/**
 * Telegram holati (05-telegram-spec, §8): ulanmagan ota-onalar ro'yxati va
 * bir bosishda qayta taklif — chunki ulanmagan ota-ona hech narsa olmaydi.
 */
export function TelegramPanel() {
  const { t } = useTranslation();
  const bindings = useTelegramBindings();
  const unbound = useTelegramUnbound();
  const invite = useTelegramInvite();
  const [link, setLink] = useState<string | null>(null);

  const sendInvite = (guardianId: string) => {
    setLink(null);
    invite.mutate(guardianId, {
      onSuccess: (result) => {
        setLink(result.deepLink);
      },
    });
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success(t("common.actions.copied"));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("guardians.telegram.unboundTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <QueryState
            isLoading={unbound.isLoading}
            error={unbound.error}
            isEmpty={(unbound.data ?? []).length === 0}
            emptyTitle={t("common.table.empty")}
            rows={2}
          >
            {(unbound.data ?? []).map((guardian) => (
              <div
                key={guardian.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{guardian.fullName}</div>
                  <div className="text-xs text-muted-foreground">{guardian.phone}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => sendInvite(guardian.id)}>
                  <Send className="mr-1 h-4 w-4" />
                  {t("guardians.telegram.invite")}
                </Button>
              </div>
            ))}
          </QueryState>

          {link ? (
            <div className="space-y-2 rounded-xl border border-st-info-border bg-st-info-soft p-3 text-sm text-st-info-fg">
              <p>{t("guardians.telegram.inviteHint")}</p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-background/60 px-2 py-1 text-xs">
                  {link}
                </code>
                <Button size="sm" variant="outline" onClick={() => void copy()}>
                  <Copy className="mr-1 h-4 w-4" />
                  {t("guardians.telegram.copyLink")}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("guardians.telegram.bindingsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <QueryState
            isLoading={bindings.isLoading}
            error={bindings.error}
            isEmpty={(bindings.data ?? []).length === 0}
            emptyTitle={t("common.table.empty")}
            rows={2}
          >
            {(bindings.data ?? []).map((binding) => (
              <div
                key={binding.guardianId}
                className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {binding.guardianName ?? binding.guardianId}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(binding.boundAt)}
                  </div>
                </div>
                {binding.blockedBot ? (
                  <Badge tone="danger">{t("domain.notificationStatus.failed")}</Badge>
                ) : binding.unboundAt ? (
                  <Badge tone="neutral">{t("guardians.telegram.unbound")}</Badge>
                ) : (
                  <Badge tone="ok">{t("guardians.telegram.bound")}</Badge>
                )}
              </div>
            ))}
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
