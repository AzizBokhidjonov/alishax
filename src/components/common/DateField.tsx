import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, X } from "lucide-react";
import { ru } from "date-fns/locale/ru";
import { uz } from "date-fns/locale/uz";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/i18n/useLanguage";
import { dateToIso, formatDate, isoToDate, parseTypedDate, todayIso } from "@/lib/dates";
import { cn, focusRing } from "@/lib/utils";

/** Yozilayotgan matnni `dd.mm.yyyy` shakliga soladi. */
function mask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += `.${digits.slice(2, 4)}`;
  if (digits.length > 4) out += `.${digits.slice(4, 8)}`;
  return out;
}

interface DatePickerProps {
  /** Kalendar sana, `yyyy-MM-dd`. */
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  /** Eng erta va eng kech tanlanadigan sana, `yyyy-MM-dd`. */
  min?: string;
  max?: string;
  /** Maydonni bo'shatish tugmasi. Majburiy maydonlarda kerak emas. */
  clearable?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Sana maydoni: yozish ham, kalendardan tanlash ham mumkin.
 *
 * Brauzerning o'z `input[type=date]` i ilova uslubiga bo'ysunmasdi —
 * qiymat formati, tugmasi va ochiladigan oynasi har brauzerda boshqacha
 * edi. Lekin uni oddiy tugma bilan almashtirish yomonroq bo'lardi: bog'chada
 * xodim ketma-ket o'nlab tug'ilgan sanani kiritadi va buni sichqoncha bilan
 * qilish sekin. Shuning uchun maydon ikkalasini birlashtiradi — matn
 * kiritish (`dd.mm.yyyy`, nuqtalar o'zi qo'yiladi) va yonidagi kalendar.
 *
 * Tashqariga har doim `yyyy-MM-dd` chiqadi — ilovaning qolgan qismi shu
 * formatda ishlaydi (`lib/dates.ts`).
 */
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

  /*
    Tashqaridan kelgan qiymat matnni yangilaydi — lekin foydalanuvchi
    yozayotgan paytda emas, aks holda har harfda kursor o'rni tiklanardi.
  */
  useEffect(() => {
    if (editing.current) return;
    setText(value ? formatDate(value) : "");
  }, [value]);

  const commit = (next: string) => {
    const iso = parseTypedDate(next);
    if (iso) onChange(iso);
    else if (next === "") onChange("");
  };

  const minDate = isoToDate(min);
  const maxDate = isoToDate(max);
  const selected = isoToDate(value);

  /*
    Yillar ro'yxati. Tug'ilgan sana uchun oyma-oy orqaga bosib borish
    chidab bo'lmas darajada sekin, shuning uchun sarlavhada oy va yil
    tanlovi turadi.
  */
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
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        onChange={(event) => {
          editing.current = true;
          const next = mask(event.target.value);
          setText(next);
          commit(next);
        }}
        onBlur={() => {
          editing.current = false;
          // Tugallanmagan matn saqlanmaydi — maydon oxirgi to'g'ri qiymatga qaytadi.
          setText(value ? formatDate(value) : "");
        }}
        className="pr-20 tabular-nums"
      />

      <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
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
                onClick={() => {
                  editing.current = false;
                  onChange(todayIso());
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
    </div>
  );
}

/** Yozilayotgan matnni `hh:mm` shakliga soladi. */
function timeMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** To'liq bo'lgan `hh:mm` ni haqiqiy vaqtga keltiradi: `99:99` -> `23:59`. */
function clampTime(text: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!match) return null;
  const hours = Math.min(23, Number(match[1]));
  const minutes = Math.min(59, Number(match[2]));
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Vaqt maydoni (`hh:mm`).
 *
 * Brauzerning `input[type=time]` i `DatePicker` bilan yonma-yon turganda
 * yot ko'rinadi: uslub, ochiladigan ro'yxat va hatto 12/24 soatlik format
 * ham brauzer sozlamasiga bog'liq. Bu yerda esa oddiy matn — «0930» deb
 * yozilsa ikki nuqta o'zi qo'yiladi, noto'g'ri qiymat esa fokus ketganda
 * chegaraga keltiriladi.
 */
export function TimeInput({
  value,
  onChange,
  id,
  disabled,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [text, setText] = useState(value ?? "");
  const editing = useRef(false);

  useEffect(() => {
    if (editing.current) return;
    setText(value ?? "");
  }, [value]);

  return (
    <Input
      id={id}
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      placeholder="--:--"
      value={text}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      className={cn("tabular-nums", className)}
      onChange={(event) => {
        editing.current = true;
        const next = timeMask(event.target.value);
        setText(next);
        const clamped = clampTime(next);
        if (clamped) onChange(clamped);
        else if (next === "") onChange("");
      }}
      onBlur={() => {
        editing.current = false;
        const clamped = clampTime(text);
        if (clamped) {
          setText(clamped);
          onChange(clamped);
        } else {
          // Tugallanmagan matn saqlanmaydi — oxirgi to'g'ri qiymatga qaytadi.
          setText(value ?? "");
        }
      }}
    />
  );
}

/**
 * Sana va vaqt (`yyyy-MM-ddTHH:mm`) — `<input type="datetime-local">` ning
 * o'rnini bosadi va AYNAN o'sha formatni qaytaradi, ya'ni formalardagi
 * `localInputToIso` zanjiri o'zgarmaydi.
 *
 * Ilgari bu maydonlar brauzerning o'z oynasini ochardi: ko'k kalendar,
 * boshqa shrift, «AM/PM» ustuni — ilovaning qolgan sana maydonlaridan
 * butunlay boshqacha. Endi sana qismi umumiy `DatePicker`, vaqt qismi esa
 * yonidagi qisqa maydon.
 */
export function DateTimePicker({
  value,
  onChange,
  id,
  disabled,
  min,
  max,
  /* Ixtiyoriy maydon uchun: sana tozalansa butun qiymat bo'shaydi. */
  clearable = false,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DatePickerProps) {
  const datePart = value?.slice(0, 10) ?? "";
  const timePart = value?.slice(11, 16) ?? "";

  const join = (date: string, time: string) => (date ? `${date}T${time || "00:00"}` : "");

  return (
    <div className={cn("flex gap-2", className)}>
      <DatePicker
        id={id}
        value={datePart}
        onChange={(next) => onChange(join(next, timePart))}
        disabled={disabled}
        min={min?.slice(0, 10)}
        max={max?.slice(0, 10)}
        clearable={clearable}
        className="flex-1"
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      <TimeInput
        value={timePart}
        onChange={(next) => onChange(join(datePart || todayIso(), next))}
        disabled={disabled}
        className="w-24 shrink-0"
      />
    </div>
  );
}

interface DateFieldProps extends DatePickerProps {
  label?: string;
  error?: string;
  hint?: string;
  /** Yorliq yonidagi majburiylik belgisi. */
  required?: boolean;
  fieldClassName?: string;
}

/**
 * Yorliq va xato matni bilan birga sana maydoni — `SelectField` bilan bir
 * xil shaklda, shuning uchun formalarda ular yonma-yon tekis turadi.
 */
export function DateField({
  label,
  error,
  hint,
  required,
  fieldClassName,
  className,
  ...picker
}: DateFieldProps) {
  const generatedId = useId();
  const id = picker.id ?? generatedId;
  const hintId = hint && !error ? `${generatedId}-hint` : undefined;
  const errorId = error ? `${generatedId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", fieldClassName)}>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span aria-hidden className="ml-0.5 text-st-danger-fg">
              *
            </span>
          ) : null}
        </Label>
      ) : null}
      <DatePicker
        {...picker}
        id={id}
        className={className}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {hintId ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {errorId ? (
        <p
          id={errorId}
          className="animate-in fade-in-0 slide-in-from-top-1 text-xs font-medium text-st-danger-fg duration-200"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
