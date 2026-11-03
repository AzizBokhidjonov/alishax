/**
 * Kirish tokeni FAQAT xotirada saqlanadi (localStorage'da emas).
 * Yangilash tokeni — httpOnly `kg_refresh` cookie, unga JS tegmaydi.
 */

let accessToken: string | null = null;
let sessionGeneration = 0;
const listeners = new Set<(token: string | null) => void>();

export const getAccessToken = (): string | null => accessToken;
export const getSessionGeneration = (): number => sessionGeneration;

/** Eski sessiyadagi kechikkan javoblar yangi hisobga ta'sir qilmasin. */
export function invalidateSession(): void {
  sessionGeneration += 1;
  setAccessToken(null);
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  for (const listener of listeners) listener(token);
}

/** Token o'zgarishini kuzatish — AuthProvider uchun. */
export function onAccessTokenChange(listener: (token: string | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
