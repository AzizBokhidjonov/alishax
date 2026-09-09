import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { uz } from "./locales/uz";
import { ru } from "./locales/ru";

export const LANGUAGES = ["uz", "ru"] as const;
export type Language = (typeof LANGUAGES)[number];

/**
 * Interfeys tili. Standart — o'zbekcha; ruscha to'liq katalog bilan mavjud.
 *
 * SSR va birinchi klient renderi HAR DOIM standart tilda bo'ladi, saqlangan
 * tanlov esa `LanguageSync` orqali montajdan keyin qo'llanadi — shunda
 * gidratatsiya mos kelmasligi yuzaga kelmaydi.
 */
export const DEFAULT_LANGUAGE: Language = "uz";
export const LANGUAGE_STORAGE_KEY = "alishax_lang";

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      uz: { translation: uz },
      ru: { translation: ru },
    },
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export function readStoredLanguage(): Language | null {
  try {
    const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return value === "uz" || value === "ru" ? value : null;
  } catch {
    return null;
  }
}

export function storeLanguage(language: Language): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // localStorage bloklangan — til faqat shu sessiyada saqlanadi.
  }
}

export default i18n;
