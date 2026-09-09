import { useTranslation } from "react-i18next";
import type { SelectOption } from "@/components/common/SelectField";

/** Enum qiymatlaridan `domain.*` kalitlari bo'yicha variantlar yasaydi. */
export function useEnumOptions(namespace: string, values: readonly string[]): SelectOption[] {
  const { t } = useTranslation();
  return values.map((value) => ({ value, label: t(`domain.${namespace}.${value}`) }));
}
