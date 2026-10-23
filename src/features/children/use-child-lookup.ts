import { useMemo } from "react";
import { LIST_LIMIT_MAX } from "@/api";
import { useChildren } from "./api";
import { usePermissions } from "@/auth/auth-context";
import { P } from "@/config/permissions";

export interface ChildLookupEntry {
  name: string;
  photoFileId?: string;
}

/**
 * `childId` -> ism va surat.
 *
 * Davomat endpointlari (`/attendance/today`, `/attendance/inside`) javobida
 * `childName` HAR DOIM ham kelmaydi va surat umuman yo'q — shunda ekranda
 * ism o'rniga identifikator chiqib qolardi. Bolalar ro'yxati baribir
 * keshlangan bo'ladi, shuning uchun yetishmayotgan maydonlar shundan
 * to'ldiriladi.
 *
 * So'rov kaliti bitta: taxta ham, «Ichkarida» ham bitta so'rovni baham
 * ko'radi. Holat bo'yicha filtrlanmaydi — vaqtincha kelmayotgan bola ham
 * davomat ro'yxatida uchraydi va uning ismi ham kerak.
 */
export function useChildLookup(): Map<string, ChildLookupEntry> {
  const { can } = usePermissions();
  const { data } = useChildren({ limit: LIST_LIMIT_MAX }, can(P.childRead));

  return useMemo(() => {
    const map = new Map<string, ChildLookupEntry>();
    for (const child of data?.data ?? []) {
      const name = [child.lastName, child.firstName].filter(Boolean).join(" ").trim();
      map.set(child.id, { name, photoFileId: child.photoFileId });
    }
    return map;
  }, [data]);
}

/** Ism: avval javobdagi qiymat, keyin ro'yxatdan, oxirida identifikator. */
export function childDisplayName(
  lookup: Map<string, ChildLookupEntry>,
  childId: string,
  childName?: string,
): string {
  return childName?.trim() || lookup.get(childId)?.name || childId;
}
