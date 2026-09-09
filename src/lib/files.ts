import { filesApi, saveBlob } from "@/api";

/**
 * Fayllarga kirish (Dizayn qo'llanmasi §4.4).
 *
 * `GET /files/:id` imzolangan havola BERMAYDI — u baytlarni oqim qilib
 * qaytaradi va har so'rovda ruxsatni tekshiradi. Demak:
 *
 *   <img src="/api/v1/files/{id}">   -> 401 (brauzer Bearer yubormaydi)
 *   <a href="...">, window.open(...) -> 401 (xuddi shu sabab)
 *
 * Yagona to'g'ri yo'l: autentifikatsiyalangan `fetch` -> `Blob` -> object URL.
 * Bir xil `fileId` uchun havola keshlanadi va oxirgi foydalanuvchi ketganda
 * bekor qilinadi — aks holda uzoq ochiq jadvalda xotira sizib ketadi.
 */

interface Entry {
  url: string;
  /** Nechta komponent shu havoladan foydalanmoqda. */
  refs: number;
}

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<string>>();

/**
 * `fileId` uchun object URL oladi va foydalanuvchilar sonini oshiradi.
 * Har bir `acquireFileUrl` uchun bitta `releaseFileUrl` chaqirilishi shart.
 */
export async function acquireFileUrl(fileId: string): Promise<string> {
  const cached = cache.get(fileId);
  if (cached) {
    cached.refs += 1;
    return cached.url;
  }

  const pending = inflight.get(fileId);
  if (pending) {
    const url = await pending;
    // Kutish paytida boshqa chaqiruv keshga yozgan bo'lishi mumkin.
    const entry = cache.get(fileId);
    if (entry) entry.refs += 1;
    return url;
  }

  const promise = (async () => {
    const { blob } = await filesApi.download(fileId);
    const url = URL.createObjectURL(blob);
    cache.set(fileId, { url, refs: 1 });
    return url;
  })();

  inflight.set(fileId, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(fileId);
  }
}

/** Foydalanuvchilar soni nolga tushsa — havola bekor qilinadi. */
export function releaseFileUrl(fileId: string): void {
  const entry = cache.get(fileId);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs > 0) return;
  URL.revokeObjectURL(entry.url);
  cache.delete(fileId);
}

/**
 * Faylni yuklab olish: autentifikatsiyalangan so'rov -> sun'iy `<a download>`.
 * Fayl nomi `Content-Disposition` dan olinadi, bo'lmasa berilgani ishlatiladi.
 */
export async function downloadFile(fileId: string, fallbackName?: string): Promise<void> {
  const { blob, fileName } = await filesApi.download(fileId);
  saveBlob(blob, fileName ?? fallbackName ?? fileId);
}

/** Faylni yangi oynada ochish (PDF ko'rish uchun). */
export async function openFile(fileId: string): Promise<void> {
  const { blob } = await filesApi.download(fileId);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  // Oyna hujjatni o'qib ulgursin — darhol bekor qilinsa bo'sh sahifa chiqadi.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
