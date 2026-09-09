import { useMemo } from "react";
import { LIST_LIMIT_MAX, type AttendanceRecord } from "@/api";
import { useChildren } from "@/features/children/api";
import { todayIso } from "@/lib/dates";
import { useAttendanceToday } from "./api";

/**
 * Taxta qatorlari: BOLALAR REYESTRI + bugungi davomat yozuvlari.
 *
 * `GET /attendance/today` faqat yozuvi BOR bolalarni qaytaradi. Ertalab,
 * hech kim belgilanmagan paytda u bo'sh bo'ladi — ya'ni davomat qilish uchun
 * ro'yxatda hech kim chiqmaydi. Yozuv esa aynan shu ekranda YARATILADI,
 * demak asos yozuvlar emas, kutilayotgan bolalar ro'yxati bo'lishi kerak.
 *
 * Shuning uchun bu yerda reyestr olinadi va bugungi yozuvlar ustiga
 * qo'yiladi: yozuvi yo'q bola «belgilanmagan» bo'lib turadi va uni bir
 * teginishda belgilash mumkin.
 */
export function useBoardRows(params: { groupId?: string; branchId?: string }): {
  rows: AttendanceRecord[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
} {
  const attendance = useAttendanceToday(params);
  const roster = useChildren({
    limit: LIST_LIMIT_MAX,
    groupId: params.groupId,
    branchId: params.branchId,
    status: "active",
  });

  const today = todayIso();

  const rows = useMemo<AttendanceRecord[]>(() => {
    const byChild = new Map((attendance.data ?? []).map((row) => [row.childId, row]));
    const merged: AttendanceRecord[] = [];

    for (const child of roster.data?.data ?? []) {
      const record = byChild.get(child.id);
      if (record) {
        /*
          Yetishmayotgan maydonlar reyestrdan to'ldiriladi: server javobida
          guruh nomi har doim ham kelmaydi, optimistik qatorda esa umuman
          bo'lmaydi. Usiz endigina belgilangan bola guruhidan tushib,
          «Guruhsiz» bo'limiga sakrab ketardi.
        */
        merged.push({
          ...record,
          groupId: record.groupId ?? child.groupId,
          groupName: record.groupName ?? child.groupName,
          childName:
            record.childName ?? [child.lastName, child.firstName].filter(Boolean).join(" ").trim(),
        });
        byChild.delete(child.id);
        continue;
      }
      /*
        Yozuvsiz bola. `id` sun'iy va faqat React kaliti sifatida ishlatiladi:
        amallar `childId` va sana bilan ketadi, shuning uchun bu qiymat hech
        qachon serverga tushmaydi.
      */
      merged.push({
        id: `pending:${child.id}`,
        childId: child.id,
        childName: [child.lastName, child.firstName].filter(Boolean).join(" ").trim(),
        groupId: child.groupId,
        groupName: child.groupName,
        date: today,
      });
    }

    // Reyestrda yo'q, lekin bugun yozuvi bor bola ham tushib qolmasin.
    for (const record of byChild.values()) merged.push(record);
    return merged;
  }, [attendance.data, roster.data, today]);

  return {
    rows,
    isLoading: attendance.isLoading || roster.isLoading,
    error: attendance.error ?? roster.error,
    refetch: () => {
      void attendance.refetch();
      void roster.refetch();
    },
  };
}
