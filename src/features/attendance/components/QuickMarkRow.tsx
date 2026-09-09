import { useTranslation } from "react-i18next";
import { AlertTriangle, Check } from "lucide-react";
import type { AbsenceStatus, AttendanceRecord } from "@/api";
import { AuthAvatar } from "@/components/common/AuthImage";
import { formatTime } from "@/lib/dates";
import { cn, focusRing } from "@/lib/utils";
import { CheckOutDialog } from "./CheckOutDialog";

/** Bir teginishda qo'yiladigan holatlar. `present` — bu kirish qaydi. */
const MARKS = ["present", "absent", "sick", "vacation", "excused"] as const;
type Mark = (typeof MARKS)[number];

/** Har bir holatning yoqilgan ko'rinishi — §2.2 jadvalidagi ohanglar. */
const MARK_ON: Record<Mark, string> = {
  present: "bg-st-ok-fg text-white border-st-ok-fg",
  absent: "bg-st-neutral-fg text-white border-st-neutral-fg",
  sick: "bg-st-warn-fg text-white border-st-warn-fg",
  vacation: "bg-st-info-fg text-white border-st-info-fg",
  excused: "bg-st-info-fg text-white border-st-info-fg",
};

interface QuickMarkRowProps {
  row: AttendanceRecord;
  name: string;
  photoFileId?: string;
  canManage: boolean;
  onCheckIn: (childId: string) => void;
  onSetStatus: (childId: string, status: AbsenceStatus) => void;
}

/**
 * Tez belgilash qatori (§5.1).
 *
 * Ilgari har bir bolaga holat qo'yish uchun oyna ochilib, bola qaytadan
 * tanlanardi — 40 ta bola uchun bu yuzlab teginish. Bu yerda butun tanlov
 * bitta qatorda: bosilgan tugma darhol yoziladi, oyna umuman ochilmaydi.
 *
 * Chiqish bundan mustasno: u olib ketuvchini tekshirishdan o'tishi shart
 * (§5.2), shuning uchun yagona oyna shu yerda qoladi.
 */
export function QuickMarkRow({
  row,
  name,
  photoFileId,
  canManage,
  onCheckIn,
  onSetStatus,
}: QuickMarkRowProps) {
  const { t } = useTranslation();

  const inside = Boolean(row.checkInAt && !row.checkOutAt);
  const done = Boolean(row.checkOutAt);
  const hasAlert = Boolean(row.alerts && row.alerts.length > 0);

  /** Hozirgi belgi: kirish qaydi bo'lsa — «keldi», aks holda qo'yilgan sabab. */
  const active: Mark | undefined = row.checkInAt
    ? "present"
    : MARKS.includes(row.status as Mark)
      ? (row.status as Mark)
      : undefined;

  const mark = (value: Mark) => {
    if (value === "present") onCheckIn(row.childId);
    else onSetStatus(row.childId, value);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 border-b border-border px-3 py-2 last:border-0",
        hasAlert && "bg-st-danger-soft/40",
      )}
    >
      <AuthAvatar fileId={photoFileId} name={name} className="h-11 w-11 shrink-0" />

      <div className="min-w-40 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{name}</span>
          {hasAlert ? (
            <AlertTriangle
              className="h-4 w-4 shrink-0 text-st-danger-fg"
              aria-label={t("children.alertBadge")}
            />
          ) : null}
        </div>
        {/* Ogohlantirish matni ochilmasdan ko'rinadi (§6.2). */}
        {row.alerts?.map((alert, index) => (
          <div key={`${alert.allergen}-${index}`} className="text-xs text-st-danger-fg">
            {alert.allergen}
            {alert.instruction ? ` — ${alert.instruction}` : ""}
          </div>
        ))}
        {row.checkInAt ? (
          <div className="text-xs text-muted-foreground">
            {formatTime(row.checkInAt)}
            {row.checkOutAt ? ` → ${formatTime(row.checkOutAt)}` : ""}
          </div>
        ) : null}
      </div>

      {canManage ? (
        <div
          role="group"
          aria-label={`${name}: ${t("common.labels.status")}`}
          className="flex flex-wrap gap-1"
        >
          {MARKS.map((value) => {
            const on = active === value;
            /*
              Chiqib bo'lgan bolaning qaydini bu yerdan o'zgartirib bo'lmaydi:
              tugatilgan kun tuzatish orqali, sabab bilan tahrirlanadi (§5.1).
            */
            const disabled = done || (value === "present" && Boolean(row.checkInAt));
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                disabled={disabled}
                onClick={() => mark(value)}
                className={cn(
                  "inline-flex h-11 items-center gap-1 rounded-lg border px-3 text-sm transition-colors",
                  focusRing,
                  on ? MARK_ON[value] : "border-border bg-card hover:bg-secondary",
                  disabled && !on && "cursor-not-allowed opacity-40",
                )}
              >
                {on ? <Check className="h-3.5 w-3.5" /> : null}
                {value === "present"
                  ? t("attendance.summary.present")
                  : t(`domain.attendanceStatus.${value}`)}
              </button>
            );
          })}

          {inside ? (
            <CheckOutDialog childId={row.childId} childName={name} className="h-11" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
