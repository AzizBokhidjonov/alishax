import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, ChildStatus } from "@/api";

export type Tone = "ok" | "warn" | "info" | "danger" | "neutral";

const BASE = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium";

const TONE_CLASS: Record<Tone, string> = {
  ok: "bg-st-ok-soft text-st-ok-fg border-st-ok-border",
  warn: "bg-st-warn-soft text-st-warn-fg border-st-warn-border",
  info: "bg-st-info-soft text-st-info-fg border-st-info-border",
  danger: "bg-st-danger-soft text-st-danger-fg border-st-danger-border",
  neutral: "bg-st-neutral-soft text-st-neutral-fg border-st-neutral-border",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn(BASE, TONE_CLASS[tone], className)}>{children}</span>;
}

const CHILD_STATUS_TONE: Record<ChildStatus, Tone> = {
  applicant: "info",
  active: "ok",
  temporarily_absent: "warn",
  suspended: "warn",
  graduated: "info",
  withdrawn: "neutral",
  archived: "neutral",
};

export function ChildStatusBadge({ status }: { status?: ChildStatus }) {
  const { t } = useTranslation();
  if (!status) return <Badge>—</Badge>;
  return <Badge tone={CHILD_STATUS_TONE[status]}>{t(`domain.childStatus.${status}`)}</Badge>;
}

const ATTENDANCE_TONE: Record<AttendanceStatus, Tone> = {
  present: "ok",
  late: "warn",
  early_departure: "warn",
  absent: "danger",
  sick: "info",
  vacation: "info",
  excused: "neutral",
};

export function AttendanceBadge({ status }: { status?: AttendanceStatus }) {
  const { t } = useTranslation();
  if (!status) return <Badge>—</Badge>;
  return <Badge tone={ATTENDANCE_TONE[status]}>{t(`domain.attendanceStatus.${status}`)}</Badge>;
}

/** Umumiy holat nishoni: i18n kaliti va ohang tashqaridan beriladi. */
export function LabelBadge({ labelKey, tone }: { labelKey: string; tone?: Tone }) {
  const { t } = useTranslation();
  return <Badge tone={tone}>{t(labelKey)}</Badge>;
}
