import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n, { readStoredLanguage, storeLanguage, type Language } from "./index";

/**
 * Saqlangan tilni montajdan keyin qo'llaydi (SSR mosligi uchun) va
 * `<html lang>` atributini joriy tilga moslaydi.
 *
 * SSR har doim standart til (`uz`) bilan chiqadi, shuning uchun `lang` ni
 * server tomonda o'zgartirib bo'lmaydi — aks holda gidratatsiya mos
 * kelmaydi. Atribut brauzerda, til aniq bo'lgandan keyin qo'yiladi.
 */
export function useLanguageSync(): void {
  const { i18n: instance } = useTranslation();

  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored && stored !== i18n.language) void i18n.changeLanguage(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = instance.language === "ru" ? "ru" : "uz";
  }, [instance.language]);
}

export function useLanguage(): {
  language: Language;
  setLanguage: (language: Language) => void;
} {
  const { i18n: instance } = useTranslation();
  const language = (instance.language === "ru" ? "ru" : "uz") as Language;

  const setLanguage = useCallback(
    (next: Language) => {
      storeLanguage(next);
      void instance.changeLanguage(next);
    },
    [instance],
  );

  return { language, setLanguage };
}
