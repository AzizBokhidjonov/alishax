import { patchBoard, applyRecord, restoreBoard } from "./board-cache";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  attendanceApi,
  isApiError,
  type CheckInDto,
  type CheckOutDto,
  type CorrectAttendanceDto,
  type SetAttendanceStatusDto,
} from "@/api";
import { todayIso } from "@/lib/dates";
import { qk, useApiMutation, useErrorToast } from "@/lib/query";
import { enqueueCheckIn, isRetryable, setCheckInQueueHandlers } from "./checkin-queue";

const ATTENDANCE_KEYS = [["attendance"]];

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

export * from "./api-queries";
