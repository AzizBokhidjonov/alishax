import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { FieldErrors, FieldValues } from "react-hook-form";

/**
 * Zod xato matnlari i18n kaliti sifatida saqlanadi (`common.validation.*`).
 * Serverdan kelgan matn esa tayyor bo'ladi — kalit topilmasa o'zi ko'rsatiladi.
 */
export function useFieldError<T extends FieldValues>(
  errors: FieldErrors<T>,
): (name: keyof T & string) => string | undefined {
  const { t } = useTranslation();

  return useCallback(
    (name) => {
      const message = errors[name]?.message;
      if (typeof message !== "string" || !message) return undefined;
      const translated = t(message);
      return translated === message && !message.includes(".") ? message : translated;
    },
    [errors, t],
  );
}
