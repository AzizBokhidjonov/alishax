import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  /**
   * Ko'rinadigan yorliq bo'lmaganda (masalan filtr panelida) maydonning
   * ekran o'quvchi uchun nomi. `label` berilsa kerak emas.
   */
  ariaLabel?: string;
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** «Barchasi» varianti — filtrlarda ishlatiladi. */
  allOption?: boolean;
  allLabel?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  triggerClassName?: string;
}

/** Bir xil ko'rinishdagi tanlov maydoni — filtr va formalarda. */
export function SelectField({
  label,
  ariaLabel,
  value,
  onChange,
  options,
  placeholder,
  allOption,
  allLabel,
  disabled,
  error,
  className,
  triggerClassName,
}: SelectFieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-label={label ? undefined : ariaLabel}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(triggerClassName)}
        >
          <SelectValue placeholder={placeholder ?? t("common.actions.select")} />
        </SelectTrigger>
        <SelectContent>
          {allOption ? (
            <SelectItem value="all">{allLabel ?? t("common.actions.all")}</SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errorId ? (
        <p id={errorId} className="text-xs text-st-danger-fg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
