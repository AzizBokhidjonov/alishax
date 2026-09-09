import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  attendanceApi,
  isApiError,
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

type TodaySnapshot = [readonly unknown[], AttendanceRecord[] | undefined][];

/**
 * Bugungi taxta keshiga optimistik o'zgarish.
 *
 * Yozuvi BOR bola yangilanadi, yozuvi YO'Q bolaga esa yangi qator qo'shiladi —
 * ertalab aynan ikkinchi hol asosiy: `GET /attendance/today` bo'sh keladi va
 * mavjud qatorni yangilash hech nimani o'zgartirmaydi. Sun'iy qatorda guruh
 * ma'lumoti yo'q, uni taxta reyestrdan to'ldiradi (`use-board-rows.ts`).
 */
function patchToday(
  queryClient: QueryClient,
  childId: string,
  patch: Partial<AttendanceRecord>,
): TodaySnapshot {
  const snapshot = queryClient.getQueriesData<AttendanceRecord[]>({
    queryKey: ["attendance", "today"],
  });

  for (const [key, rows] of snapshot) {
    if (!rows) continue;
    const known = rows.some((row) => row.childId === childId);
    queryClient.setQueryData<AttendanceRecord[]>(
      key,
      known
        ? rows.map((row) => (row.childId === childId ? { ...row, ...patch } : row))
        : [...rows, { id: `optimistic:${childId}`, childId, date: todayIso(), ...patch }],
    );
  }

  return snapshot;
}

function restoreToday(queryClient: QueryClient, snapshot: TodaySnapshot | undefined): void {
  for (const [key, rows] of snapshot ?? []) queryClient.setQueryData(key, rows);
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
      await queryClient.cancelQueries({ queryKey: ["attendance", "today"] });
      return {
        snapshot: patchToday(queryClient, dto.childId, {
          checkInAt: new Date().toISOString(),
          status: "present",
        }),
      };
    },

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

      restoreToday(queryClient, context?.snapshot);
      showError(error);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useCheckOut() {
  return useApiMutation({
    mutationFn: (dto: CheckOutDto) => attendanceApi.checkOut(dto),
    invalidate: ATTENDANCE_KEYS,
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
      await queryClient.cancelQueries({ queryKey: ["attendance", "today"] });
      return { snapshot: patchToday(queryClient, dto.childId, { status: dto.status }) };
    },

    onError: (error, _dto, context) => {
      restoreToday(queryClient, context?.snapshot);
      showError(error);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["attendance"] });
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
