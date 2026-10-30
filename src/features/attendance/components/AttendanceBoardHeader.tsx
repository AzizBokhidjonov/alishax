import { useTranslation } from "react-i18next";
import { FilterBar, SearchField } from "@/components/common/FilterBar";
import { SelectField } from "@/components/common/SelectField";
import { cn, focusRing } from "@/lib/utils";

/** Sarlavhadagi hisoblagichlar — bosilsa filtrga aylanadi (§5.1). */
export type Counter = "all" | "pending" | "inside" | "absent" | "notPickedUp" | "pickedUp";

export type BoardView = "cards" | "quick";

const VIEWS: BoardView[] = ["cards", "quick"];

interface AttendanceBoardHeaderProps {
  term: string;
  onTermChange: (value: string) => void;
  groupId: string;
  onGroupChange: (value: string) => void;
  groups: { value: string; label: string }[];
  counter: Counter;
  onCounterChange: (value: Counter) => void;
  counts: {
    pending: number;
    inside: number;
    absent: number;
    notPickedUp: number;
    pickedUp: number;
    total: number;
  };
  view: BoardView;
  onViewChange: (value: BoardView) => void;
}

/**
 * Taxta sarlavhasi: qidiruv, guruh, hisoblagichlar va ko'rinish rejimi.
 *
 * Hisoblagichlar shunchaki raqam emas — ular filtr. «Kelmadi: 6» ni bosish
 * ro'yxatni o'shalarga qisqartiradi, chunki qabulxonaga aynan shu kerak.
 */
export function AttendanceBoardHeader({
  term,
  onTermChange,
  groupId,
  onGroupChange,
  groups,
  counter,
  onCounterChange,
  counts,
  view,
  onViewChange,
}: AttendanceBoardHeaderProps) {
  const { t } = useTranslation();

  const counters: { key: Counter; label: string; value: number }[] = [
    /*
      «Belgilanmagan» — belgilash paytidagi eng muhim son: tarbiyachi shu
      nol bo'lganda ishi tugaganini biladi. Shuning uchun u birinchi turadi.
    */
    { key: "pending", label: t("attendance.summary.pending"), value: counts.pending },
    { key: "pickedUp", label: t("flows.pickedUp"), value: counts.pickedUp },
    { key: "inside", label: t("attendance.summary.inside"), value: counts.inside },
    { key: "absent", label: t("attendance.summary.absent"), value: counts.absent },
    { key: "notPickedUp", label: t("attendance.notPickedUp.short"), value: counts.notPickedUp },
    { key: "all", label: t("attendance.summary.total"), value: counts.total },
  ];

  return (
    <FilterBar className="justify-between">
      {/* Ismni yozib topish — 46 ta kartochkani aylanib chiqishdan tez. */}
      <SearchField value={term} onChange={onTermChange} className="max-w-xs" />

      <SelectField
        label={t("common.labels.group")}
        value={groupId}
        onChange={onGroupChange}
        options={groups}
        allOption
        triggerClassName="w-48"
      />

      <div className="flex flex-wrap gap-2">
        {counters.map((item) => {
          /*
            Nol qiymatli hisoblagich filtr sifatida ma'nosiz: bosilsa bo'sh
            ekran chiqadi va foydalanuvchi «nega hech kim yo'q» deb qoladi.
            Shuning uchun u faqat son sifatida ko'rsatiladi.
          */
          const clickable = item.value > 0 || counter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={counter === item.key}
              disabled={!clickable}
              onClick={() => onCounterChange(counter === item.key ? "all" : item.key)}
              className={cn(
                "min-h-11 rounded-xl border px-4 py-1.5 text-left transition-colors",
                focusRing,
                counter === item.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary/50",
                clickable ? "hover:bg-secondary" : "cursor-default opacity-60",
              )}
            >
              <div className="text-xs opacity-80">{item.label}</div>
              <div className="text-xl font-bold leading-tight">{item.value}</div>
            </button>
          );
        })}
      </div>

      {/*
        Ikki ko'rinish, bitta ekran: kartochkalar — qabulxona uchun (yuzni
        taniydi), tez belgilash — tarbiyachi uchun (butun guruhni bir
        o'tishda belgilaydi).
      */}
      <div
        role="group"
        aria-label={t("attendance.view.label")}
        className="inline-flex rounded-xl border border-border bg-card p-0.5"
      >
        {VIEWS.map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={view === mode}
            onClick={() => onViewChange(mode)}
            className={cn(
              "min-h-11 rounded-lg px-3 text-sm font-medium transition-colors",
              focusRing,
              view === mode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`attendance.view.${mode}`)}
          </button>
        ))}
      </div>
    </FilterBar>
  );
}
