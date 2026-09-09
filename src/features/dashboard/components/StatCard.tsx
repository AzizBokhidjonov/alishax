import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, focusRing, hoverLift } from "@/lib/utils";

type Tone = "brand" | "ok" | "warn" | "danger" | "info";

const TONE_CLASS: Record<Tone, string> = {
  // `brand-foreground` (navy) faqat to'liq amber fon uchun. Bu yerda fon —
  // amberning 15% toni, shuning uchun matn uchun `brand-ink` ishlatiladi:
  // qorong'i rejimda navy ikonka fonda 1.20:1 bo'lib ko'rinmay qolardi.
  brand: "bg-brand/15 text-brand-ink",
  ok: "bg-st-ok-soft text-st-ok-fg",
  warn: "bg-st-warn-soft text-st-warn-fg",
  danger: "bg-st-danger-soft text-st-danger-fg",
  info: "bg-st-info-soft text-st-info-fg",
};

/**
 * Bosh sahifadagi ko'rsatkich kartochkasi.
 *
 * `to` berilsa butun kartochka bitta navigatsiya nishoniga aylanadi:
 * yorliq havolasining `after` qatlami kartochkani to'liq qoplaydi. Faqat
 * shunda hover ko'tarilishi qo'shiladi — bosilmaydigan kartochkaga uni
 * berish yolg'on va'da bo'lardi.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "brand",
  to,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  tone?: Tone;
  to?: LinkProps["to"];
}) {
  return (
    <Card className={cn(to && `relative ${hoverLift}`)}>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", TONE_CLASS[tone])}
        >
          <Icon className="h-6 w-6" />
        </span>
        {/*
          Yorliq va qiymat — ta'rif juftligi: ekran o'quvchi ularni birga
          o'qiydi. Qiymatda `truncate` yo'q: pul summasi 4 ustunli tarmoqda
          kartochka kengligidan oshib, kesilib qolardi — endi ikkinchi
          qatorga o'tadi.
        */}
        <dl className="min-w-0">
          <dt className="truncate text-sm text-muted-foreground">
            {to ? (
              <Link
                to={to}
                className={cn("rounded-sm after:absolute after:inset-0 hover:underline", focusRing)}
              >
                {label}
              </Link>
            ) : (
              label
            )}
          </dt>
          <dd className="text-xl font-bold leading-tight">{value}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
