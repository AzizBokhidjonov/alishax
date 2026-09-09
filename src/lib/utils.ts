import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/*
 * Fokus va xato holati uchun yagona ko'rinish. Bu satrlar barcha bosiladigan
 * elementlar va forma maydonlarida ishlatiladi — shunda klaviatura bilan
 * ishlayotgan foydalanuvchi qayerda turganini har doim bir xil ko'radi.
 * Halqa rangi `--ring` tokeni (yorug'da navy, qorong'ida sky).
 */

/** Tugma, havola va bosiladigan elementlar: fondan ajratilgan tashqi halqa. */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Forma maydonlari: chegara rangi almashadi + yumshoq ichki halqa. */
export const focusField =
  "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35";

/** Server 422 yoki zod xatosi: `aria-invalid` qo'yilganda maydon belgilanadi. */
export const invalidField =
  "aria-invalid:border-st-danger aria-invalid:ring-2 aria-invalid:ring-st-danger/25";

/*
 * Hover effektlari. Bu "til" landing sahifasida allaqachon bor edi
 * (`-translate-y`, `shadow-lg`, `scale-110`), boshqaruv panelida esa yo'q edi —
 * ikki yarim boshqacha his berardi. Shu yerda ular nomlanadi va bir pog'ona
 * pasaytiriladi: landing bir marta ko'riladi, panel kunda sakkiz soat.
 *
 * MUHIM: faqat haqiqatan bosiladigan elementlarga qo'yiladi. Bosilmaydigan
 * narsaga ko'tarilish yoki soya berish foydalanuvchini chalg'itadi.
 * Jadval qatorlariga ham qo'yilmaydi — kattalashtirish ustunlar tekisligini
 * buzadi va matnni xiralashtiradi, u yerda rang o'zgarishi ishlatiladi.
 */

/** Bosiladigan kartochka: yengil ko'tarilish va soya. */
export const hoverLift =
  "transition-all hover:-translate-y-0.5 hover:shadow-lg focus-within:-translate-y-0.5 focus-within:shadow-lg";

/** Chip va kichik havolalar uchun bir pog'ona yumshoqroq variant. */
export const hoverLiftSm = "transition-all hover:-translate-y-0.5 hover:shadow-sm";
