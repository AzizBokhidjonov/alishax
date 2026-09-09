import { isApiError } from "@/api";

/**
 * `422` javobidagi xatolarni forma maydonlariga qaytaradi (§8).
 *
 * Server ikki ko'rinishda javob berishi mumkin: hujjatdagi `[{path, message}]`
 * massivi yoki umumiy konvertdagi `{ "items.2.question": "..." }` obyekti.
 * Ikkalasi ham bitta xaritaga keltiriladi — kalit maydon yo'li, qiymat matn.
 * Yo'l `ContentEditor` dagi `path` bilan bir xil ko'rinishda bo'ladi.
 */
export function contentFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error) || error.status !== 422) return {};

  const details = error.details as unknown;
  const result: Record<string, string> = {};

  if (Array.isArray(details)) {
    for (const entry of details) {
      if (!entry || typeof entry !== "object") continue;
      const { path, message } = entry as { path?: unknown; message?: unknown };
      if (typeof path === "string" && typeof message === "string") result[path] = message;
    }
    return result;
  }

  if (details && typeof details === "object") {
    for (const [path, value] of Object.entries(details as Record<string, unknown>)) {
      if (typeof value === "string") result[path] = value;
      else if (Array.isArray(value) && typeof value[0] === "string") result[path] = value[0];
    }
  }

  return result;
}

/** `content.title.uz` kabi prefiksni olib tashlaydi — forma yo'llari `content` siz. */
export function stripContentPrefix(errors: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [path, message] of Object.entries(errors)) {
    result[path.startsWith("content.") ? path.slice("content.".length) : path] = message;
  }
  return result;
}
