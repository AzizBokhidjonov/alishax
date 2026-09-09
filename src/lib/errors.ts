import { ApiError, isApiError, type ErrorCode } from "@/api";

/**
 * Xato matni HAR DOIM `code` dan olinadi — konvertdagi `message` inglizcha
 * nosozlik matni va foydalanuvchiga ko'rsatilmaydi (Integration Guide §4).
 *
 * Kalitlar `errors.<CODE>` ko'rinishida i18n katalogida yotadi; noma'lum kod
 * kelsa HTTP holati bo'yicha zaxira kalit ishlatiladi.
 */

export const ERROR_I18N_PREFIX = "errors";

export function errorKey(code: ErrorCode): string {
  return `${ERROR_I18N_PREFIX}.${code}`;
}

export function statusFallbackKey(status: number): string {
  if (status === 0) return `${ERROR_I18N_PREFIX}.NETWORK`;
  if (status >= 500) return `${ERROR_I18N_PREFIX}.INTERNAL_ERROR`;
  if (status === 404) return `${ERROR_I18N_PREFIX}.NOT_FOUND`;
  if (status === 403) return `${ERROR_I18N_PREFIX}.FORBIDDEN`;
  if (status === 401) return `${ERROR_I18N_PREFIX}.UNAUTHENTICATED`;
  return `${ERROR_I18N_PREFIX}.UNKNOWN`;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Xatodan foydalanuvchiga ko'rsatiladigan matn. */
export function errorMessage(t: Translate, error: unknown): string {
  if (!isApiError(error)) {
    if (error instanceof TypeError) return t(`${ERROR_I18N_PREFIX}.NETWORK`);
    return t(`${ERROR_I18N_PREFIX}.UNKNOWN`);
  }
  const key = errorKey(error.code);
  const translated = t(key);
  // i18next kalit topilmasa kalitning o'zini qaytaradi — shunda zaxiraga o'tamiz.
  return translated === key ? t(statusFallbackKey(error.status)) : translated;
}

/** Qo'llab-quvvatlash uchun `traceId` — xabar ostida kichik matn sifatida. */
export function errorTraceId(error: unknown): string | undefined {
  return isApiError(error) ? error.traceId : undefined;
}

export function hasErrorCode(error: unknown, ...codes: ErrorCode[]): boolean {
  return isApiError(error) && codes.includes(error.code);
}

/** `404` va `403 OUT_OF_SCOPE` interfeysda bir xil — «topilmadi». */
export function isNotFound(error: unknown): boolean {
  return hasErrorCode(error, "NOT_FOUND", "OUT_OF_SCOPE");
}

export function isForbidden(error: unknown): boolean {
  return hasErrorCode(error, "FORBIDDEN", "SENSITIVE_PERMISSION");
}

export { ApiError, isApiError };
