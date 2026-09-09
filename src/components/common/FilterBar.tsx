import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FilterX, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, focusRing } from "@/lib/utils";

/**
 * Ro'yxat sahifalaridagi filtr paneli. Barcha sahifalarda bir xil tuzilish:
 * pastki chetidan tekislangan, o'ralib ketadigan boshqaruvlar qatori.
 *
 * `activeCount` berilsa panel nechta filtr YOQILGANINI aytadi va ularni bir
 * bosishda tozalash tugmasini ko'rsatadi. Ilgari buni bilishning yagona yo'li
 * har bir maydonni ko'z bilan tekshirish edi — natija bo'sh chiqqanda esa
 * sababi ko'rinmasdi.
 */
export function FilterBar({
  children,
  className,
  activeCount = 0,
  onReset,
}: {
  children: ReactNode;
  className?: string;
  activeCount?: number;
  onReset?: () => void;
}) {
  const { t } = useTranslation();
  const showReset = onReset !== undefined && activeCount > 0;

  return (
    <Card className="overflow-hidden">
      {/* Yuqoridagi ingichka amber chizig'i panelni sahifadagi boshqa kartalardan ajratadi. */}
      <div aria-hidden className="h-1 bg-brand/70" />
      <CardContent className={cn("flex flex-wrap items-end gap-3 p-4", className)}>
        {children}

        {showReset ? (
          <div className="ml-auto flex h-11 shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-ink">
              <SlidersHorizontal aria-hidden className="h-3.5 w-3.5" />
              {t("common.filters.active", { count: activeCount })}
            </span>
            <Button variant="ghost" size="sm" onClick={onReset} className="h-9">
              <FilterX className="h-4 w-4" />
              {t("common.filters.clear")}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * Qidiruv maydoni: yorliq, ikonka va tozalash tugmasi.
 *
 * Ikonka inputning o'ziga nisbatan joylashadi — ilgari u yuqoridagi
 * yorliq balandligiga qo'lda moslangan (`top-[38px]`) va yorliq
 * o'zgarishi bilan siljib ketardi.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <div className={cn("min-w-60 flex-1", className)}>
      <Label htmlFor={id} className="mb-1.5 block">
        {label ?? t("common.actions.search")}
      </Label>
      <div className="group relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand-ink"
        />
        <Input
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-11 [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={t("common.actions.reset")}
            className={cn(
              "absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
              focusRing,
            )}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Yoqib-o'chiriladigan filtr — «Qarzi bor», «Tibbiy ogohlantirish» kabi.
 *
 * Ilgari bular kalit (`Switch`) + yorliq juftligi edi: kalit sozlama uchun
 * mo'ljallangan, filtr esa tanlov. Chip esa yoqilganini rangi bilan
 * ko'rsatadi va bir bosishda o'chadi.
 */
export function FilterToggle({
  checked,
  onCheckedChange,
  icon: Icon,
  children,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition-all active:scale-[0.97]",
        focusRing,
        checked
          ? "border-brand bg-brand-soft text-brand-ink shadow-sm"
          : "border-border bg-transparent text-muted-foreground hover:border-input hover:text-foreground",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
      {checked ? <X aria-hidden className="h-3.5 w-3.5 opacity-70" /> : null}
    </button>
  );
}
