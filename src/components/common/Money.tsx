import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatTiyin, toBigInt } from "@/lib/money";

interface MoneyProps {
  /** Butun tiyin satri. */
  value?: string | null;
  className?: string;
  /** Manfiy qiymatni qizil, musbatni yashil ko'rsatish. */
  colored?: boolean;
  /** Valyuta so'zini yashirish (jadval ustunlari uchun). */
  hideCurrency?: boolean;
}

/** Pul qiymati — hamma joyda bitta ko'rinish (tiyin -> so'm). */
export function Money({ value, className, colored, hideCurrency }: MoneyProps) {
  const { t } = useTranslation();
  const amount = toBigInt(value);
  const tone = colored
    ? amount < 0n
      ? "text-st-danger-fg"
      : amount > 0n
        ? "text-st-ok-fg"
        : undefined
    : undefined;

  return (
    <span className={cn("tabular-nums", tone, className)}>
      {formatTiyin(value)}
      {hideCurrency ? "" : ` ${t("common.labels.currency")}`}
    </span>
  );
}
