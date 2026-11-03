import { patchBoard, applyRecord, restoreBoard } from "./board-cache";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  attendanceApi,
  type CheckOutDto,
  type CorrectAttendanceDto,
  type SetAttendanceStatusDto,
} from "@/api";
import { todayIso } from "@/lib/dates";
import { qk, useApiMutation, useErrorToast } from "@/lib/query";
export { useCheckIn } from "./use-check-in";

const ATTENDANCE_KEYS = [["attendance"]];

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
