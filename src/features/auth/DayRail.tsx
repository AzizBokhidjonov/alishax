import { useTranslation } from "react-i18next";
import { Clock, MoonStar } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAY_HOURS, DAY_STAGES } from "./constants";
import { stageIndexAt } from "./day";

interface DayRailProps {
  minute: number | null;
}

/**
 * «Bugungi kun» — bog'cha kunining bosqichlari va hozirgi payt.
 *
 * Bu ro'yxat bezak emas: tizimga kiruvchi xodim smenaning qaysi qismiga
 * kirayotganini darhol ko'radi. O'tgan bosqichlar so'niq, joriysi ajratilgan,
 * keyingilari kutmoqda.
 */
export function DayRail({ minute }: DayRailProps) {
  const { t } = useTranslation();
  const active = stageIndexAt(minute);
  const closed = minute !== null && active === -1;

  return (
    <div>
      {/*
        Sarlavha tegi emas: sahifaning yagona `h1` i o'ng ustundagi forma
        sarlavhasi va u DOM da keyinroq keladi — bu yerda `h2` bo'lsa,
        sarlavhalar tartibi buzilardi. Ro'yxat nomi `aria-labelledby` orqali
        bog'lanadi.
      */}
      <div
        id="day-rail-title"
        className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-panel-foreground/65"
      >
        <Clock className="h-3.5 w-3.5" />
        {t("auth.dayTitle")}
      </div>

      <ol aria-labelledby="day-rail-title" className="relative mt-4 space-y-0.5">
        {/*
          Bosqichlarni bog'lovchi chiziq. Yuqoridan pastga chiziladi —
          kun ham shu yo'nalishda kechadi.
        */}
        <span
          aria-hidden
          className="absolute bottom-5 left-5.5 top-5 w-px origin-top animate-[draw-line_1.1s_cubic-bezier(0.22,1,0.36,1)_0.35s_both] bg-panel-foreground/20"
        />

        {DAY_STAGES.map((stage, index) => {
          const isActive = index === active;
          const isPast = active > index || (minute !== null && active === -1 && minute >= stage.to);
          const Icon = stage.icon;

          return (
            <li
              key={stage.key}
              style={{ animationDelay: `${240 + index * 90}ms` }}
              className={cn(
                "relative flex animate-[pop-in_0.6s_cubic-bezier(0.22,1,0.36,1)_both] items-center gap-3 rounded-2xl px-2 py-2 transition-colors",
                isActive && "bg-panel-foreground/10",
                isPast && "opacity-60",
              )}
            >
              <span className="relative grid h-7 w-7 shrink-0 place-items-center">
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute inset-0 animate-[pulse-ring_2.4s_ease-out_infinite] rounded-full bg-brand"
                  />
                ) : null}
                <span
                  className={cn(
                    "relative grid h-7 w-7 place-items-center rounded-full border transition-colors",
                    isActive
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-panel-foreground/35 text-panel-foreground/75",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm",
                    isActive ? "font-bold" : "font-medium text-panel-foreground/85",
                  )}
                >
                  {t(`auth.day.${stage.key}`)}
                </span>
              </span>

              {isActive ? (
                <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-brand-foreground">
                  {t("auth.now")}
                </span>
              ) : (
                <span className="shrink-0 text-xs font-semibold tabular-nums text-panel-foreground/65">
                  {stage.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {closed ? (
        <p className="mt-3 flex items-center gap-2 px-2 text-xs text-panel-foreground/70">
          <MoonStar className="h-3.5 w-3.5 shrink-0" />
          {t("auth.dayClosed", { hours: DAY_HOURS })}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Ustunning telefon uchun qisqartmasi: faqat hozirgi bosqich.
 * Kichik ekranda forma bir ekranga sig'ishi kerak, shuning uchun butun
 * kun tartibi emas — undan faqat eng kerakli qatori qoladi.
 */
export function DayNowChip({ minute }: DayRailProps) {
  const { t } = useTranslation();
  const active = stageIndexAt(minute);

  if (minute === null) return null;

  const stage = active === -1 ? null : DAY_STAGES[active];
  const Icon = stage ? stage.icon : MoonStar;

  return (
    <span className="inline-flex animate-[pop-in_0.5s_ease-out_both] items-center gap-2 rounded-full bg-panel-foreground/10 py-1 pl-1.5 pr-3 text-xs font-semibold">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-brand-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      {stage ? t(`auth.day.${stage.key}`) : t("auth.dayClosed", { hours: DAY_HOURS })}
    </span>
  );
}
