import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, X } from "lucide-react";
import { ru } from "date-fns/locale/ru";
import { uz } from "date-fns/locale/uz";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/i18n/useLanguage";
import { dateToIso, formatDate, isoToDate, parseTypedDate, todayIso } from "@/lib/dates";
import { cn, focusRing } from "@/lib/utils";

function mask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += `.${digits.slice(2, 4)}`;
  if (digits.length > 4) out += `.${digits.slice(4, 8)}`;
  return out;
}

export interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;

  min?: string;
  max?: string;

  clearable?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function DatePicker({
  value,
  onChange,
  id,
  disabled,
  min,
  max,
  clearable = true,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DatePickerProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => (value ? formatDate(value) : ""));
  const editing = useRef(false);

  useEffect(() => {
    if (editing.current) return;
    setText(value ? formatDate(value) : "");
  }, [value]);

  const commit = (next: string) => {
    const iso = parseTypedDate(next);
    onChange(iso && (!min || iso >= min) && (!max || iso <= max) ? iso : next);
  };

  const parsedText = parseTypedDate(text);
  const invalid =
    !!text && (!parsedText || !!(min && parsedText < min) || !!(max && parsedText > max));
  const showLocalError = invalid && !ariaInvalid;
  const localErrorId = useId();
  const today = todayIso();
  const minDate = isoToDate(min);
  const maxDate = isoToDate(max);
  const selected = isoToDate(value);

  const currentYear = Number(todayIso().slice(0, 4));
  const startMonth = new Date(minDate ? minDate.getFullYear() : currentYear - 100, 0);
  const endMonth = new Date(maxDate ? maxDate.getFullYear() : currentYear + 5, 11);

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        placeholder={t("common.labels.datePlaceholder")}
        value={text}
        aria-invalid={ariaInvalid || invalid}
        aria-describedby={
          invalid ? [ariaDescribedBy, localErrorId].filter(Boolean).join(" ") : ariaDescribedBy
        }
        onChange={(event) => {
          editing.current = true;
          const next = mask(event.target.value);
          setText(next);
          commit(next);
        }}
        onBlur={() => {
          editing.current = false;
          if (parsedText && !invalid) setText(formatDate(parsedText));
        }}
        className="pr-20 tabular-nums"
      />

      <div className="absolute right-1.5 top-[22px] flex -translate-y-1/2 items-center gap-0.5">
        {clearable && value && !disabled ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setText("");
            }}
            aria-label={t("common.actions.reset")}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
              focusRing,
            )}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label={t("common.labels.selectDate")}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50",
                focusRing,
              )}
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected ?? maxDate ?? new Date()}
              startMonth={startMonth}
              endMonth={endMonth}
              captionLayout="dropdown"
              locale={language === "ru" ? ru : uz}
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
              ]}
              onSelect={(date) => {
                if (!date) return;
                editing.current = false;
                onChange(dateToIso(date));
                setOpen(false);
              }}
              autoFocus
            />
            <div className="flex items-center justify-between gap-2 border-t border-border p-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!!(min && today < min) || !!(max && today > max)}
                onClick={() => {
                  editing.current = false;
                  onChange(today);
                  setOpen(false);
                }}
              >
                {t("common.labels.today")}
              </Button>
              {clearable && value ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    editing.current = false;
                    onChange("");
                    setOpen(false);
                  }}
                >
                  {t("common.actions.reset")}
                </Button>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {showLocalError ? (
        <p id={localErrorId} role="alert" className="mt-1 text-xs text-st-danger-fg">
          {t("common.validation.invalidDate")}
        </p>
      ) : null}
    </div>
  );
}

export { DateTimePicker, TimeInput } from "./TimeFields";
export { DateField } from "./LabeledDateField";
