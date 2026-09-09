import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/FormDialog";
import { formatTiyin, toTiyin } from "@/lib/money";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Pul kiritish maydoni: foydalanuvchi so'mda yozadi, tagida esa serverga
 * ketadigan qiymat o'qiladigan ko'rinishda ko'rsatiladi. Bu «nolni ko'p yoki
 * kam yozib yuborish» xatosining oldini oladi — moliyada eng qimmat xato shu.
 */
export function MoneyInput({
  label,
  value,
  onChange,
  error,
  hint,
  className,
  autoFocus,
}: MoneyInputProps) {
  const { t } = useTranslation();
  const preview = value.trim() ? formatTiyin(toTiyin(value)) : null;

  return (
    <Field label={label} error={error} className={className}>
      <Input
        className="h-11 text-right tabular-nums"
        inputMode="decimal"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className={cn("mt-1 text-xs", preview ? "text-muted-foreground" : "text-transparent")}>
        {preview ? `${preview} ${t("common.labels.currency")}` : "—"}
      </p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </Field>
  );
}
