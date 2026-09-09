import { ApiError, fallbackCode, type ErrorEnvelope } from "./error";
import { getAccessToken, setAccessToken } from "./token-store";

/** API manzili. `.env` da `VITE_API_BASE_URL` bilan almashtiriladi. */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "https://api.alishaxkids.uz/api/v1";

export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: QueryParams;
  body?: unknown;
  /** Moliyaviy amallar uchun `Idempotency-Key` sarlavhasi. */
  idempotencyKey?: string;
  signal?: AbortSignal;
  /** `multipart/form-data` yuborish uchun — `body` o'rniga ishlatiladi. */
  formData?: FormData;
  /** JSON emas, fayl kutilsa. */
  expect?: "json" | "blob";
}

/** Bo'sh, `all` va `undefined` qiymatlar so'rovga qo'shilmaydi. */
export function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "all") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function rawFetch(path: string, options: RequestOptions): Promise<Response> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);
  if (options.body !== undefined && !options.formData) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  return fetch(`${API_BASE_URL}${path}${buildQuery(options.query)}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    signal: options.signal,
    body:
      options.formData ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
  });
}

/** Bir vaqtda ko'p so'rov 401 qaytarsa, yangilash faqat bir marta yuboriladi. */
let refreshPromise: Promise<boolean> | null = null;
let onUnauthenticated: (() => void) | null = null;

/** AuthProvider sessiya tugaganini bilishi uchun. */
export function setUnauthenticatedHandler(handler: (() => void) | null): void {
  onUnauthenticated = handler;
}

export async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return false;
        const data = (await response.json()) as { accessToken?: string };
        if (!data.accessToken) return false;
        setAccessToken(data.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        // Keyingi 401 uchun yangi urinish mumkin bo'lsin.
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      }
    })();
  }
  return refreshPromise;
}

async function toApiError(response: Response): Promise<ApiError> {
  let envelope: Partial<ErrorEnvelope> = {};
  try {
    envelope = (await response.json()) as Partial<ErrorEnvelope>;
  } catch {
    // Konvert JSON emas — holat kodidan zaxira kod olinadi.
  }
  const error = envelope.error;
  return new ApiError({
    code: error?.code ?? fallbackCode(response.status),
    status: response.status,
    message: error?.message,
    details: error?.details,
    traceId: error?.traceId,
  });
}

async function parse<T>(response: Response, expect: "json" | "blob"): Promise<T> {
  if (response.status === 204) return undefined as T;
  if (expect === "blob") return (await response.blob()) as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/**
 * Yagona so'rov nuqtasi: Bearer sarlavhasi, xato konverti va
 * `401 TOKEN_EXPIRED` da bir martalik yangilash + qayta yuborish.
 * Javob tanasi o'qilmagan `Response` qaytaradi.
 */
export async function requestResponse(
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  let response = await rawFetch(path, options);

  if (response.status === 401) {
    const error = await toApiError(response.clone());
    if (error.code === "TOKEN_EXPIRED" || error.code === "UNAUTHENTICATED") {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        response = await rawFetch(path, options);
      } else {
        setAccessToken(null);
        onUnauthenticated?.();
        throw error;
      }
    }
  }

  if (!response.ok) throw await toApiError(response);
  return response;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await requestResponse(path, options);
  return parse<T>(response, options.expect ?? "json");
}

export const api = {
  get: <T>(path: string, query?: QueryParams, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET", query }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export type ExportResult =
  { kind: "job"; jobId: string } | { kind: "file"; blob: Blob; fileName?: string };

/** `Content-Disposition` dan fayl nomini ajratadi. */
export function fileNameFrom(response: Response): string | undefined {
  const header = response.headers.get("content-disposition");
  const match = header?.match(/filename="?([^"]+)"?/i);
  return match?.[1];
}

/**
 * Hisobot/eksport yuklab olish.
 *
 * `format=xlsx|pdf` katta natijada `202 { jobId }` qaytarishi mumkin, kichik
 * natijada esa faylning o'zi keladi — javob turi kontent turiga qarab
 * aniqlanadi (Funksional spec, B17).
 */
export async function requestExport(path: string, query?: QueryParams): Promise<ExportResult> {
  const response = await requestResponse(path, { query });
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await response.json()) as { jobId?: string; id?: string };
    const jobId = data.jobId ?? data.id;
    if (jobId) return { kind: "job", jobId };
    return { kind: "file", blob: new Blob([JSON.stringify(data)], { type: "application/json" }) };
  }
  return { kind: "file", blob: await response.blob(), fileName: fileNameFrom(response) };
}

/** Blobni yangi oynada ochadi (kvitansiya, PDF ko'rish uchun). */
export function openBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  // Oyna ochilgach havola kerak emas, lekin darhol bekor qilinsa PDF
  // yuklanmay qolishi mumkin — shuning uchun kechiktiriladi.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Brauzerda blob'ni yuklab olish. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
