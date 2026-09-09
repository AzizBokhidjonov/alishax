/**
 * Kirish tokeni FAQAT xotirada saqlanadi (localStorage'da emas).
 * Yangilash tokeni — httpOnly `kg_refresh` cookie, unga JS tegmaydi.
 */

let accessToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export const getAccessToken = (): string | null => accessToken;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  for (const listener of listeners) listener(token);
}

/** Token o'zgarishini kuzatish — AuthProvider uchun. */
export function onAccessTokenChange(listener: (token: string | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
