import { useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DatePicker, type DatePickerProps } from "./DateField";

interface DateFieldProps extends DatePickerProps {
  label?: string;
  error?: string;
  hint?: string;

  required?: boolean;
  fieldClassName?: string;
}

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
