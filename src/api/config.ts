/** API manzili. `.env` da `VITE_API_BASE_URL` bilan almashtiriladi. */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "https://api.alishaxkids.uz/api/v1";
