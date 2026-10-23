import type { QueryClient } from "@tanstack/react-query";
import type { AttendanceBoard, AttendanceRecord } from "@/api";

type BoardSnapshot = [readonly unknown[], AttendanceBoard | undefined][];

/**
 * Taxta keshiga BITTA qatorni yozish.
 *
 * Handbook (2026-10-04) buni aniq talab qiladi: muvaffaqiyatli amaldan keyin
 * faqat mos keladigan qatorning `attendance` i almashtiriladi, `child`
 * obyekti va qolgan qatorlar saqlanadi. Shunda guruh tanlovi, qidiruv,
 * fokus va skroll joyida qoladi — butun ro'yxatni qayta qurish esa aynan
 * shularni yo'qotadi.
 *
 * Mos keltirish `response.childId` ↔ `row.child.id` bo'yicha: davomat
 * yozuvining `id` si optimistik qatorda hali yo'q.
 */
export function patchBoard(
  queryClient: QueryClient,
  childId: string,
  patch: Partial<AttendanceRecord>,
): BoardSnapshot {
  const snapshot = queryClient.getQueriesData<AttendanceBoard>({
    queryKey: ["attendance", "board"],
  });

  for (const [key, board] of snapshot) {
    if (!board) continue;
    queryClient.setQueryData<AttendanceBoard>(key, {
      ...board,
      data: board.data.map((item) =>
        item.child.id === childId
          ? {
              ...item,
              recorded: true,
              attendance: {
                // Yozuv hali bo'lmasa, optimistik qator shu yerda tug'iladi.
                id: item.attendance?.id ?? `optimistic:${childId}`,
                childId,
                date: board.date,
                ...item.attendance,
                ...patch,
              },
            }
          : item,
      ),
    });
  }

  return snapshot;
}

/** Serverdan kelgan HAQIQIY yozuvni joyiga qo'yish. */
export function applyRecord(queryClient: QueryClient, record: AttendanceRecord): void {
  const entries = queryClient.getQueriesData<AttendanceBoard>({
    queryKey: ["attendance", "board"],
  });

  for (const [key, board] of entries) {
    if (!board) continue;
    queryClient.setQueryData<AttendanceBoard>(key, {
      ...board,
      data: board.data.map((item) =>
        item.child.id === record.childId
          ? { ...item, recorded: true, attendance: { ...item.attendance, ...record } }
          : item,
      ),
    });
  }
}

export function restoreBoard(queryClient: QueryClient, snapshot: BoardSnapshot | undefined): void {
  for (const [key, board] of snapshot ?? []) queryClient.setQueryData(key, board);
}
