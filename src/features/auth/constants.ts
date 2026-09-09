import { BookOpen, Moon, Palette, Sunrise, Trees, type LucideIcon } from "lucide-react";

/**
 * Bog'chaning kun tartibi — kirish sahifasidagi «Bugungi kun» ustuni uchun.
 *
 * Bosqichlar bosh sahifadagi kun tartibining qisqartirilgan ko'rinishi
 * (`features/landing/constants.ts` dagi `SCHEDULE`), lekin bu yerda ular
 * ikki tilda ko'rsatiladi, shuning uchun matn emas — i18n kaliti saqlanadi.
 *
 * `from`/`to` — kun boshidan hisoblangan daqiqa. Ular ketma-ket keladi va
 * bo'shliq qoldirmaydi: joriy bosqich `from <= hozir < to` bo'yicha topiladi.
 */
export interface DayStage {
  key: string;
  /** Ro'yxatda ko'rsatiladigan boshlanish vaqti. */
  label: string;
  from: number;
  to: number;
  icon: LucideIcon;
}

const at = (hour: number, minute: number): number => hour * 60 + minute;

export const DAY_STAGES: DayStage[] = [
  { key: "arrival", label: "07:30", from: at(7, 30), to: at(9, 30), icon: Sunrise },
  { key: "lessons", label: "09:30", from: at(9, 30), to: at(11, 30), icon: BookOpen },
  { key: "outdoor", label: "11:30", from: at(11, 30), to: at(13, 30), icon: Trees },
  { key: "nap", label: "13:30", from: at(13, 30), to: at(16, 0), icon: Moon },
  { key: "handover", label: "16:00", from: at(16, 0), to: at(18, 30), icon: Palette },
];

/** Ish vaqti — bosqichlardan tashqaridagi vaqt uchun izoh. */
export const DAY_HOURS = "07:30 – 18:30";
