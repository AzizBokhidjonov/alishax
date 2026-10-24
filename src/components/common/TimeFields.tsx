import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { todayIso } from "@/lib/dates";
import { DatePicker, type DatePickerProps } from "./DateField";

function timeMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function clampTime(text: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

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
        onChange(clamped ?? next);
      }}
      onBlur={() => {
        editing.current = false;
        const clamped = clampTime(text);
        if (clamped) {
          setText(clamped);
          onChange(clamped);
        } else {
          // Tugallanmagan matn saqlanmaydi — oxirgi to'g'ri qiymatga qaytadi.
          setText(text);
        }
      }}
    />
  );
}

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

  const join = (date: string, time: string) => (date ? `${date}T${time}` : "");

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
