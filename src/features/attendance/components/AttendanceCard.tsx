import { useTranslation } from "react-i18next";
import { AlertTriangle, LogIn, MoreVertical } from "lucide-react";
import type { AbsenceStatus, AttendanceRecord } from "@/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthAvatar } from "@/components/common/AuthImage";
import { AttendanceBadge } from "@/components/common/StatusBadge";
import { formatTime } from "@/lib/dates";
import { cn, focusRing } from "@/lib/utils";
import { CheckOutDialog } from "./CheckOutDialog";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";

const ABSENCE: AbsenceStatus[] = ["absent", "sick", "vacation", "excused"];

interface AttendanceCardProps {
  row: AttendanceRecord;
  /** Ko'rsatiladigan ism — javobda bo'lmasa bolalar ro'yxatidan olinadi. */
  name: string;
  /** Bolaning surati — davomat javobida yo'q, bolalar ro'yxatidan qo'shiladi. */
  photoFileId?: string;
  canManage: boolean;
  onCheckIn: (childId: string) => void;
  onSetStatus: (childId: string, status: AbsenceStatus) => void;
}

/**
 * Bola kartochkasi — taxtaning asosiy birligi (§5.1).
 *
 * Jadval emas, kartochka: qabulxona ismni emas, YUZNI taniydi va bir xil
 * ismli ikki bolani surat orqali ajratadi. Nishonlar ham shu yerda: tibbiy
 * ogohlantirish kartani ochmasdan ko'rinishi kerak.
 *
 * O'lchamlar «pol» zichligida — ertalab tik turib, bir qo'lda, planshetda
 * ishlanadi: teginish maydoni 44px dan kichik bo'lmasin.
 */
export function AttendanceCard({
  row,
  name,
  photoFileId,
  canManage,
  onCheckIn,
  onSetStatus,
}: AttendanceCardProps) {
  const { t } = useTranslation();
  const { can } = usePermissions();

  const inside = Boolean(row.checkInAt && !row.checkOutAt);
  const hasAlert = Boolean(row.alerts && row.alerts.length > 0);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-card p-3 text-center",
        inside ? "border-st-ok-border bg-st-ok-soft/40" : "border-border",
        hasAlert && "ring-2 ring-st-danger-border",
      )}
    >
      <div className="relative mx-auto">
        <AuthAvatar
          fileId={photoFileId}
          name={name}
          className="h-20 w-20 border-2 border-card shadow-sm"
        />
        {hasAlert ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-st-danger-fg text-white"
            aria-hidden
          >
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <div className="truncate text-base font-bold">{name}</div>
        {row.checkInAt ? (
          <div className="text-sm text-muted-foreground">
            {t("attendance.columns.checkIn")} {formatTime(row.checkInAt)}
            {row.checkOutAt ? ` · ${formatTime(row.checkOutAt)}` : ""}
          </div>
        ) : (
          <div className="mt-1">
            <AttendanceBadge status={row.status} />
          </div>
        )}
      </div>

      {/*
        Ogohlantirish matni ochilmasdan ko'rinadi — faqat allergen va
        ko'rsatma, to'liq tibbiy yozuv emas (§6.2).
      */}
      {row.alerts?.map((alert, index) => (
        <p key={`${alert.allergen}-${index}`} className="text-xs font-medium text-st-danger-fg">
          {alert.allergen}
          {alert.instruction ? ` — ${alert.instruction}` : ""}
        </p>
      ))}

      {canManage ? (
        <div className="mt-auto flex items-center gap-1 pt-1">
          {!row.checkInAt && can(P.attendanceCheckIn) ? (
            // Bir teginish, oyna yo'q, vaqt tanlagich yo'q — vaqtni server qo'yadi.
            <Button className="h-11 flex-1 text-base" onClick={() => onCheckIn(row.childId)}>
              <LogIn className="mr-1.5 h-4 w-4" />
              {t("attendance.checkIn")}
            </Button>
          ) : null}

          {inside && can(P.attendanceCheckOut) && can(P.pickupRead) ? (
            <CheckOutDialog
              childId={row.childId}
              childName={name}
              className="h-11 flex-1 text-base"
            />
          ) : null}

          {!row.checkInAt && can(P.attendanceCheckIn) ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={t("attendance.setStatus")}
                className={cn(
                  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-secondary",
                  focusRing,
                )}
              >
                <MoreVertical className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("attendance.setStatus")}</DropdownMenuLabel>
                {ABSENCE.map((status) => (
                  <DropdownMenuItem key={status} onSelect={() => onSetStatus(row.childId, status)}>
                    {t(`domain.attendanceStatus.${status}`)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
