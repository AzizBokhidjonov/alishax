import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";
import { useErrorToast } from "@/lib/query";
import { formatDateTime, todayIso } from "@/lib/dates";
import { childDisplayName, useChildLookup } from "@/features/children/use-child-lookup";
import { arrivalDay } from "../checkin-storage";
import { dismissCheckIn, reconcileCheckIn, retryCheckIn, useCheckInQueue } from "../checkin-queue";

export function PendingArrivals() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const lookup = useChildLookup();
  const showError = useErrorToast();
  const [checking, setChecking] = useState<string | null>(null);
  const { items, durable } = useCheckInQueue();
  const reconcile = async (childId: string) => {
    setChecking(childId);
    try {
      await reconcileCheckIn(childId);
    } catch (error) {
      showError(error);
    } finally {
      setChecking(null);
    }
  };
  if (!items.length && durable) return null;
  return (
    <section
      aria-label={t("attendance.recovery.title", { count: items.length })}
      className="space-y-3 rounded-xl border border-st-warn-border bg-st-warn-soft p-4 text-sm"
    >
      <p aria-live="polite" className="font-semibold">
        {t("attendance.recovery.title", { count: items.length })}
      </p>
      <p>{t("attendance.recovery.hint")}</p>
      {!durable ? (
        <p role="alert" className="font-semibold text-st-danger-fg">
          {t("attendance.recovery.storageUnavailable")}
        </p>
      ) : null}
      <ul className="space-y-3">
        {items.map((item) => {
          const previousDay = arrivalDay(item.at) !== todayIso();
          return (
            <li
              key={item.childId}
              className="space-y-2 rounded-lg border border-st-warn-border p-3"
            >
              <p className="font-medium">
                {childDisplayName(lookup, item.childId, undefined)} · {formatDateTime(item.at)}
              </p>
              <p>
                {t(
                  previousDay
                    ? "attendance.recovery.previousDay"
                    : item.state === "review"
                      ? "attendance.recovery.review"
                      : "attendance.recovery.pending",
                )}
              </p>
              {item.errorCode && !previousDay ? (
                <p>
                  {t(`errors.${item.errorCode}`, { defaultValue: t("attendance.recovery.review") })}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {can(P.attendanceRead) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={checking !== null}
                    onClick={() => void reconcile(item.childId)}
                  >
                    {t("attendance.recovery.checkServer")}
                  </Button>
                ) : null}
                {!previousDay && can(P.attendanceCheckIn) ? (
                  <Button variant="outline" size="sm" onClick={() => retryCheckIn(item.childId)}>
                    {t("common.actions.retry")}
                  </Button>
                ) : null}
                {item.state === "review" ? (
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="sm">
                        {t("attendance.recovery.reviewed")}
                      </Button>
                    }
                    title={t("attendance.recovery.removeTitle")}
                    description={t("attendance.recovery.removeHint")}
                    confirmLabel={t("attendance.recovery.remove")}
                    onConfirm={() => dismissCheckIn(item.childId)}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
