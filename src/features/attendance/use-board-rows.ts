import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi, type AttendanceBoardItem, type AttendanceRecord } from "@/api";
import { ATTENDANCE_POLL_MS } from "@/config/constants";
import { qk } from "@/lib/query";
import { todayIso } from "@/lib/dates";

/**
 * Taxta qatorlari — `GET /attendance/board` dan.
 *
 * Ilgari bu ikki so'rovdan qo'lda yig'ilardi (`/children` reyestri +
 * `/attendance/today`), chunki serverda to'liq reyestr endpointi yo'q edi.
 * Endi u bor va bitta so'rov yetadi: server kutilayotgan BARCHA bolani
 * qaytaradi va yozuvi yo'qiga `attendance: null` qo'yadi.
 *
 * Eski yechimning kamchiligi shunchaki ikki so'rov emas edi: reyestr
 * sahifalangan (`limit=200`) va katta bog'chada oxirgi bolalar taxtaga
 * tushmasligi mumkin edi. Serverning reyestri bunday cheklovga ega emas.
 *
 * `attendance: null` — «YOZILMAGAN», «kelmagan» EMAS. Shu uchinchi holat
 * `AttendanceRecord` ga `status: undefined` bo'lib o'tadi va kartochka uni
 * «belgilanmagan» deb chizadi.
 */
const displayName = (child: AttendanceBoardItem["child"]): string =>
  child.fullName?.trim() ||
  [child.lastName, child.firstName].filter(Boolean).join(" ").trim() ||
  "";

/** Taxta elementini interfeys ishlatadigan qatorga aylantirish. */
export function boardItemToRow(item: AttendanceBoardItem, date: string): AttendanceRecord {
  const name = displayName(item.child);
  if (item.attendance) {
    /*
      Yetishmayotgan maydonlar bola obyektidan to'ldiriladi: davomat
      javobida guruh nomi har doim kelmaydi va usiz endigina belgilangan
      bola guruhidan tushib «Guruhsiz» bo'limiga sakrab ketardi.
    */
    return {
      ...item.attendance,
      childId: item.attendance.childId ?? item.child.id,
      childName: item.attendance.childName ?? name,
      groupId: item.attendance.groupId ?? item.child.groupId,
      groupName: item.attendance.groupName ?? item.child.groupName,
    };
  }

  /*
    Yozuvsiz bola. `id` sun'iy va faqat React kaliti sifatida ishlatiladi:
    amallar `childId` va sana bilan ketadi, shuning uchun bu qiymat hech
    qachon serverga tushmaydi.
  */
  return {
    id: `pending:${item.child.id}`,
    childId: item.child.id,
    childName: name,
    groupId: item.child.groupId,
    groupName: item.child.groupName,
    date,
  };
}

export function useAttendanceBoard(params: { groupId?: string; branchId?: string }) {
  return useQuery({
    queryKey: qk.attendanceBoard(params),
    queryFn: () => attendanceApi.board(params),
    // SSE yo'q — taxta 25 soniyada va oynaga qaytilganda yangilanadi (§5.1).
    refetchInterval: ATTENDANCE_POLL_MS,
    refetchOnWindowFocus: true,
    /*
      Guruh almashganda eski guruhning qatorlari DARHOL yo'qoladi: oldingi
      javobni ushlab turish boshqa guruhning bolalarini ko'rsatib qo'yadi va
      qabulxona noto'g'ri bolani belgilashi mumkin (§0, cross-screen).
      Shuning uchun `placeholderData` ataylab berilmagan.
    */
  });
}

export function useBoardRows(params: { groupId?: string; branchId?: string }): {
  rows: AttendanceRecord[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
} {
  const board = useAttendanceBoard(params);
  const today = todayIso();

  const rows = useMemo<AttendanceRecord[]>(() => {
    const date = board.data?.date ?? today;
    return (board.data?.data ?? []).map((item) => boardItemToRow(item, date));
  }, [board.data, today]);

  return {
    rows,
    isLoading: board.isLoading,
    error: board.error,
    refetch: () => void board.refetch(),
  };
}
