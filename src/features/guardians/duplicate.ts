import { guardiansApi, isApiError, type CreateGuardianDto, type Guardian } from "@/api";

/**
 * Ota-ona telefon bo'yicha DEDUPLIKATSIYA qilinadi (Funksional spec, B7).
 *
 * Mavjud telefon bilan `POST /guardians` yuborilsa server `409 DUPLICATE` va
 * mavjud yozuvni qaytaradi. Bu xato emas — bu «yangi yozuv yaratma, borini
 * bog'la» degan ishora: aka-uka/opa-singil bir xil ota-onaga bog'lanadi.
 */
export function duplicateGuardian(error: unknown): Guardian | null {
  if (!isApiError(error) || error.code !== "DUPLICATE") return null;
  const details = error.details as
    { existing?: Guardian; guardian?: Guardian; id?: string } | undefined;
  if (!details) return null;
  if (details.existing) return details.existing;
  if (details.guardian) return details.guardian;
  // Ba'zi javoblarda yozuv `details` ning o'zida keladi.
  return details.id ? (details as unknown as Guardian) : null;
}

/**
 * Ota-onani yaratadi yoki dublikat bo'lsa mavjudini qaytaradi.
 * Chaqiruvchi keyin uni bolaga bog'laydi (`POST /children/:id/guardians`).
 */
export async function createOrReuseGuardian(
  dto: CreateGuardianDto,
): Promise<{ guardian: Guardian; reused: boolean }> {
  try {
    const guardian = await guardiansApi.create(dto);
    return { guardian, reused: false };
  } catch (error) {
    const existing = duplicateGuardian(error);
    if (existing) return { guardian: existing, reused: true };
    throw error;
  }
}
