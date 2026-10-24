/**
 * Backend'ning yagona xato konverti:
 * `{ error: { code, message, details, traceId } }`.
 *
 * `message` — inglizcha nosozlik matni, foydalanuvchiga KO'RSATILMAYDI.
 * Interfeys matni har doim `code` bo'yicha i18n katalogidan olinadi
 * (`src/lib/errors.ts`).
 */

/** Hujjatlashtirilgan xato kodlari. Yangi kod kelsa `string` sifatida o'tadi. */
export type KnownErrorCode =
  | "UNAUTHENTICATED"
  | "TOKEN_EXPIRED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_INACTIVE"
  | "FORBIDDEN"
  | "OUT_OF_SCOPE"
  | "ROLE_PROTECTED"
  | "ROLE_IN_USE"
  | "LAST_OWNER"
  | "SELF_LOCKOUT"
  | "PRIVILEGE_ESCALATION"
  | "SENSITIVE_PERMISSION"
  | "UNKNOWN_PERMISSION"
  | "INVALID_SCOPE"
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "DUPLICATE"
  | "CONFLICT"
  | "PERIOD_CLOSED"
  | "BILLING_ALREADY_COMMITTED"
  | "ALREADY_CHECKED_IN"
  | "NOT_CHECKED_IN"
  | "CAPACITY_EXCEEDED"
  | "PERMISSION_EXPIRED"
  | "INSUFFICIENT_ALLOCATION"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ErrorCode = KnownErrorCode | (string & {});

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message?: string;
    details?: Record<string, unknown>;
    traceId?: string;
  };
}

/** So'rov muvaffaqiyatsiz tugaganda tashlanadigan yagona xato turi. */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;
  readonly traceId?: string;

  constructor(params: {
    code: ErrorCode;
    status: number;
    message?: string;
    details?: Record<string, unknown>;
    traceId?: string;
  }) {
    super(params.message ?? params.code);
    this.name = "ApiError";
    this.code = params.code;
    this.status = params.status;
    this.details = params.details;
    this.traceId = params.traceId;
  }
}

/** HTTP holatiga qarab zaxira kod — konvert kelmagan hollarda. */
export function fallbackCode(status: number): ErrorCode {
  switch (status) {
    case 401:
      return "UNAUTHENTICATED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 413:
      return "FILE_TOO_LARGE";
    case 415:
      return "UNSUPPORTED_MEDIA_TYPE";
    case 422:
      return "VALIDATION_FAILED";
    case 423:
      return "ACCOUNT_LOCKED";
    case 429:
      return "RATE_LIMITED";
    default:
      return status >= 500 ? "INTERNAL_ERROR" : "CONFLICT";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** `422 VALIDATION_FAILED` dagi `details` ni forma maydonlariga moslashtiradi. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (
    !isApiError(error) ||
    error.code !== "VALIDATION_FAILED" ||
    !error.details ||
    Array.isArray(error.details)
  )
    return {};
  const result: Record<string, string> = {};
  for (const [field, value] of Object.entries(error.details)) {
    if (typeof value === "string") result[field] = "common.validation.invalidValue";
    else if (Array.isArray(value) && typeof value[0] === "string")
      result[field] = "common.validation.invalidValue";
  }
  return result;
}
