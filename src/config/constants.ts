/** Qidiruv maydonlarini kechiktirish (ms) — har harfda so'rov ketmasin. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Eksport tayyorligini so'rash oralig'i (ms) — `GET /exports/:id`. */
export const EXPORT_POLL_MS = 2000;

/** Eksportni kutishning eng ko'p urinishlari soni. */
export const EXPORT_POLL_LIMIT = 60;

/** Import holatini so'rash oralig'i (ms) — `GET /imports/:id`. */
export const IMPORT_POLL_MS = 2000;

/** Importni kutishning eng ko'p urinishlari soni. */
export const IMPORT_POLL_LIMIT = 90;

/** Davomat taxtasini yangilash oralig'i (ms) — SSE yo'q, faqat so'rov. */
export const ATTENDANCE_POLL_MS = 25_000;

/** Xabarnomalar uchun server chegarasi: tenant bo'yicha daqiqasiga. */
export const NOTIFICATION_RATE_LIMIT = 20;

/** Davomat tuzatishida sabab uchun eng qisqa uzunlik (bazada ham majburiy). */
export const CORRECTION_REASON_MIN = 10;

/** Parolning eng qisqa uzunligi (server standarti). */
export const PASSWORD_MIN_LENGTH = 10;
