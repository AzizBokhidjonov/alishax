/**
 * Sana bilan ishlash. Ikki xil qiymat bor va ular aralashtirilmaydi
 * (Integration Guide §6):
 *
 * - **Kalendar sana** `yyyy-MM-dd` — Asia/Tashkent bo'yicha. Brauzer
 *   mintaqasiga o'tkazilmaydi, aks holda kun siljib ketadi.
 * - **Vaqt tamg'asi** ISO 8601 + ofset — ko'rsatishda Tashkent vaqtida.
 */

export const TIMEZONE = "Asia/Tashkent";

const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeParts = new Intl.DateTimeFormat("ru-RU", {
  timeZone: TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Toshkentdagi bugungi sana, `yyyy-MM-dd`. */
export function todayIso(): string {
  return dateParts.format(new Date());
}

/** Toshkent bo'yicha joriy yil va oy (oy 1 dan boshlanadi). */
export function currentPeriod(): { year: number; month: number } {
  const [year, month] = todayIso().split("-");
  return { year: Number(year), month: Number(month) };
}

/** Kalendar sanani ko'rsatish: `2026-07-29` -> `29.07.2026`. */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const iso = value.slice(0, 10);
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
}

/** Vaqt tamg'asini Toshkent vaqtida ko'rsatadi. */
export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${dateParts.format(date).split("-").reverse().join(".")} ${timeParts.format(date)}`;
}

export function formatTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return timeParts.format(date);
}

/**
 * `yyyy-MM-dd` -> `Date` (mahalliy yarim tun).
 *
 * `new Date("2021-04-12")` UTC deb o'qiladi va salbiy ofsetli mintaqalarda
 * oldingi kunni beradi. Shuning uchun komponentlar qo'lda beriladi —
 * kalendar qaysi mintaqada ochilmasin, o'sha kunni ko'rsatadi.
 */
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isLocalDateTime(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value) && isCalendarDate(value.slice(0, 10))
  );
}

export function isoToDate(value?: string | null): Date | undefined {
  if (!value || !isCalendarDate(value.slice(0, 10))) return undefined;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** `Date` -> `yyyy-MM-dd`, mahalliy komponentlar bo'yicha. */
export function dateToIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * `dd.mm.yyyy` -> `yyyy-MM-dd`, yaroqsiz bo'lsa `null`.
 *
 * Sana haqiqatda mavjudligi ham tekshiriladi: `31.02.2026` sonlar bo'yicha
 * to'g'ri ko'rinadi, lekin `Date` uni 3-martga ag'daradi — shuning uchun
 * natija kiritilgan qiymatga teng ekani solishtiriladi.
 */
export function parseTypedDate(text: string): string | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return dateToIso(date);
}

/** Kalendar sanaga kun qo'shadi; UTC'da hisoblanadi, shuning uchun siljish yo'q. */
export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Oyning birinchi va oxirgi kuni. */
export function monthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from,
    to: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export const MONTH_NAMES_UZ = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

export const MONTH_NAMES_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export function monthName(month: number, language = "uz"): string {
  const names = language === "ru" ? MONTH_NAMES_RU : MONTH_NAMES_UZ;
  return names[month - 1] ?? String(month);
}

/** Hisob davri sarlavhasi: `2026 · Iyul`. */
export function periodLabel(year: number, month: number, language = "uz"): string {
  return `${monthName(month, language)} ${year}`;
}

/** Tug'ilgan sanadan to'liq yosh. */
export function ageFromBirth(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const [nowYear, nowMonth, nowDay] = todayIso().split("-").map(Number);
  let age = nowYear - year;
  if (nowMonth < month || (nowMonth === month && nowDay < day)) age -= 1;
  return age;
}

/** `<input type="datetime-local">` qiymatidan ISO tamg'a. */
export function localInputToIso(value: string): string {
  if (!isLocalDateTime(value)) throw new RangeError("Invalid date and time");
  return new Date(value + "+05:00").toISOString();
}

/** ISO tamg'adan `<input type="datetime-local">` qiymati. */
export function isoToLocalInput(value?: string | null): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return dateParts.format(date) + "T" + timeParts.format(date);
}
