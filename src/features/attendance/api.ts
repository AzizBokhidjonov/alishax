import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  attendanceApi,
  isApiError,
  type AttendanceBoard,
  type AttendanceRecord,
  type CheckInDto,
  type CheckOutDto,
  type CorrectAttendanceDto,
  type SetAttendanceStatusDto,
} from "@/api";
import type { AttendanceListParams } from "@/api/endpoints/attendance";
import { ATTENDANCE_POLL_MS } from "@/config/constants";
import { todayIso } from "@/lib/dates";
import { qk, useApiMutation, useErrorToast } from "@/lib/query";
import { enqueueCheckIn, isRetryable, setCheckInQueueHandlers } from "./checkin-queue";

export function useAttendanceToday(params: { groupId?: string; branchId?: string }) {
  return useQuery({
    queryKey: qk.attendanceToday(params),
    queryFn: () => attendanceApi.today(params),
    // SSE yo'q — taxta 25 soniyada va oynaga qaytilganda yangilanadi (§5.1).
    refetchInterval: ATTENDANCE_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useAttendanceList(params: AttendanceListParams) {
  return useQuery({
    queryKey: qk.attendance(params),
    queryFn: () => attendanceApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useInside() {
  return useQuery({
    queryKey: qk.attendanceInside,
    queryFn: () => attendanceApi.inside(),
    refetchInterval: ATTENDANCE_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useAbsent(date: string) {
  return useQuery({
    queryKey: qk.attendanceAbsent(date),
    queryFn: () => attendanceApi.absent(date),
  });
}

export function useNotPickedUp() {
  return useQuery({
    queryKey: qk.attendanceNotPickedUp,
    queryFn: () => attendanceApi.notPickedUp(),
    refetchInterval: ATTENDANCE_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useAttendanceCalendar(childId: string, year: number, month: number) {
  return useQuery({
    queryKey: qk.attendanceCalendar({ childId, year, month }),
    queryFn: () => attendanceApi.calendar(childId, year, month),
    enabled: Boolean(childId),
  });
}

export function useAttendanceSummary(params: { groupId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: qk.attendanceSummary(params),
    queryFn: () => attendanceApi.summary(params),
  });
}

export function useCorrections(params: { from?: string; to?: string; userId?: string }) {
  return useQuery({
    queryKey: qk.attendanceCorrections(params),
    queryFn: () => attendanceApi.corrections(params),
  });
}

const ATTENDANCE_KEYS = [["attendance"]];

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
function patchBoard(
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
function applyRecord(queryClient: QueryClient, record: AttendanceRecord): void {
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

function restoreBoard(queryClient: QueryClient, snapshot: BoardSnapshot | undefined): void {
  for (const [key, board] of snapshot ?? []) queryClient.setQueryData(key, board);
}

/**
 * Navbat fonda ishlaydi va keshni o'zi yangilay olmaydi — bog'lovchi shu.
 * Taxta ochiq turgan paytda ulanish tiklansa, qayta yuborilgan qaydlar
 * darhol ro'yxatda ko'rinadi.
 */
function useCheckInQueueBridge(): void {
  const queryClient = useQueryClient();
  const showError = useErrorToast();

  useEffect(() => {
    setCheckInQueueHandlers({
      onSettled: () => void queryClient.invalidateQueries({ queryKey: ["attendance"] }),
      onGiveUp: (_childId, error) => {
        // Qayta urinish yordam bermaydi — optimistik holat ham noto'g'ri edi.
        void queryClient.invalidateQueries({ queryKey: ["attendance"] });
        showError(error);
      },
    });
    return () => setCheckInQueueHandlers({});
  }, [queryClient, showError]);
}

/**
 * Kirishni qayd etish.
 *
 * Ertalabki navbatda ota-ona qarshida turadi, shuning uchun tugma tarmoqni
 * KUTMAYDI: yozuv darhol keshda belgilanadi va so'rov fonda ketadi (§4.9).
 *
 * Bazada `UNIQUE(tenant, child, date)` cheklovi bor — takroriy so'rov
 * `409 ALREADY_CHECKED_IN` qaytaradi va bu XATO EMAS: yozuv allaqachon bor,
 * shuning uchun u MUVAFFAQIYAT kabi qaraladi va ro'yxat yangilanadi.
 *
 * Tarmoq uzilsa kesh ORQAGA QAYTARILMAYDI: qayd navbatga tushadi va fonda
 * qayta yuboriladi, kartochka esa «ichkarida» bo'lib turaveradi. Faqat
 * tuzatib bo'lmaydigan xatoda (ruxsat yo'q, bola topilmadi) holat qaytariladi.
 */
export function useCheckIn() {
  const { t } = useTranslation();
  const showError = useErrorToast();
  const queryClient = useQueryClient();

  useCheckInQueueBridge();

  return useMutation({
    mutationFn: (dto: CheckInDto) => attendanceApi.checkIn(dto),

    onMutate: async (dto: CheckInDto) => {
      // Ketayotgan so'rovlar keshni eski javob bilan bosib ketmasin.
      await queryClient.cancelQueries({ queryKey: ["attendance", "board"] });
      return {
        snapshot: patchBoard(queryClient, dto.childId, {
          checkInAt: new Date().toISOString(),
          status: "present",
        }),
      };
    },

    /*
      Serverning javobi — HAQIQIY yozuv (id, aniq vaqt, holat). U optimistik
      qator ustiga joyida yoziladi, shuning uchun to'liq qayta o'qish kerak
      bo'lmaydi va ro'yxat sakramaydi (Handbook, 2026-10-04).
    */
    onSuccess: (record) => applyRecord(queryClient, record),

    onError: (error, dto, context) => {
      if (isApiError(error) && error.code === "ALREADY_CHECKED_IN") {
        // Yozuv allaqachon bor — optimistik holat to'g'ri, faqat yangilaymiz.
        toast.info(t("attendance.alreadyCheckedIn"));
        void queryClient.invalidateQueries({ queryKey: ["attendance"] });
        return;
      }

      if (isRetryable(error)) {
        enqueueCheckIn(dto.childId);
        /*
          Bitta xabar, nechta qayd navbatga tushishidan qat'i nazar: `id`
          tufayli toast almashadi, 40 ta bola belgilanganda 40 ta xabar
          chiqmaydi. Sonini taxtadagi ko'rsatkich aytadi.
        */
        toast.info(t("attendance.offlineHint"), { id: "checkin-queue" });
        return;
      }

      restoreBoard(queryClient, context?.snapshot);
      showError(error);
    },

    onSettled: () => {
      /*
        Taxta joyida yangilandi, shuning uchun uni qayta o'qish SHART EMAS —
        aksincha, amaldan oldin boshlangan sekin so'rov yangi holatni bosib
        ketishi mumkin. Qolgan ko'rsatkichlar (ichkarida, jamlanma) esa
        yangilanadi.
      */
      void queryClient.invalidateQueries({ queryKey: ["attendance"], type: "active" });
    },
  });
}

/**
 * Chiqishni qayd etish.
 *
 * Optimistik yangilash ATAYLAB yo'q: bola serverning tasdig'igacha
 * «chiqqan» deb ko'rsatilmaydi (§3, idempotentlik va qaytarish siyosati).
 * Server avtorizatsiyani qayta tekshiradi va faqat muvaffaqiyatli javob
 * ketishni tasdiqlaydi.
 */
export function useCheckOut() {
  const showError = useErrorToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CheckOutDto) => attendanceApi.checkOut(dto),
    onSuccess: (record) => {
      applyRecord(queryClient, record);
      void queryClient.invalidateQueries({ queryKey: ["attendance", "inside"] });
      void queryClient.invalidateQueries({ queryKey: ["attendance", "not-picked-up"] });
      void queryClient.invalidateQueries({ queryKey: ["pickup"] });
    },
    /*
      Xato `usePickupCheckOut` da ham ushlanadi (403/PICKUP_* hukmni qayta
      chizadi). Toast esa qolgan hollar uchun — masalan `ALREADY_CHECKED_OUT`.
    */
    onError: (error) => showError(error),
  });
}

/**
 * Sabab qo'yish — kartochkadagi menyudan bir teginishda.
 *
 * Muvaffaqiyat haqida TOAST YO'Q (§2.9): natija ekranda ko'rinadi — nishon
 * darhol «Kasal» ga aylanadi. Belgilash ketma-ket bajariladigan ish, har
 * qadamda chiqadigan xabar esa shu ishni sekinlashtiradi.
 */
export function useSetAttendanceStatus() {
  const showError = useErrorToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SetAttendanceStatusDto) => attendanceApi.setStatus(dto),

    onMutate: async (dto: SetAttendanceStatusDto) => {
      // Bugungi taxtaga tegishli bo'lmagan sana keshni chalg'itmasin —
      // sabab o'tgan kunga ham qo'yiladi (jurnal, tuzatish oynasi).
      if (dto.date !== todayIso()) return {};
      await queryClient.cancelQueries({ queryKey: ["attendance", "board"] });
      return { snapshot: patchBoard(queryClient, dto.childId, { status: dto.status }) };
    },

    onSuccess: (record) => applyRecord(queryClient, record),

    onError: (error, _dto, context) => {
      restoreBoard(queryClient, context?.snapshot);
      showError(error);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["attendance"], type: "active" });
    },
  });
}

export function useCorrectAttendance() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CorrectAttendanceDto }) =>
      attendanceApi.correct(id, dto),
    successMessage: t("attendance.corrections.saved"),
    invalidate: ATTENDANCE_KEYS,
  });
}
