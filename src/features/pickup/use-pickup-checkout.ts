import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { isApiError, recipientField, type PickupRecipient, type PickupVerifyResult } from "@/api";
import { errorMessage } from "@/lib/errors";
import { useCheckOut } from "@/features/attendance/api";
import { usePickupVerify } from "./api";

interface Options {
  /** Tekshiruv so'rovi qachon yuborilsin (oyna ochiq bo'lganda). */
  enabled?: boolean;
  /** Toastda ko'rsatiladigan ism. */
  childName?: string;
  onSuccess?: () => void;
}

/**
 * «Tekshir va ber» — bolani berishning YAGONA yo'li (§5.2).
 *
 * Bu holat mashinasi ikki joyda bir xil ishlaydi: davomat taxtasidagi chiqish
 * oynasida va olib ketish nazorati sahifasida. Ilgari mantiq faqat oynada
 * bor edi, sahifa esa faqat «tekshirar» — natijada qabulxona bir ekranda
 * tasdiqlab, chiqishni boshqa ekranda qayd etardi. Ikki qadam orasida
 * tekshiruv unutilishi mumkin, shuning uchun tasdiq tekshiruv bilan bir
 * joyda turadi.
 *
 * Qabul qiluvchi TEGLANGAN qiymat (`PickupRecipient`), oddiy id emas
 * (Handbook, 2026-10-04): vasiy, faol ruxsat va ro'yxatdagi shaxs uchun
 * serverda uch BOSHQA maydon bor va ularni almashtirib yuborish `422` beradi.
 * Teg tufayli bu xato tur darajasida mumkin emas.
 */
export function usePickupCheckOut(childId: string, options: Options = {}) {
  const { t } = useTranslation();
  const [recipient, setRecipient] = useState<PickupRecipient | null>(null);
  const [note, setNote] = useState("");

  /*
    Ruxsat tasdiqlash PAYTIDA ham tugashi mumkin: ekran ochiq turganda
    vaqtinchalik ruxsat muddati o'tadi va server `403 PERMISSION_EXPIRED`
    qaytaradi. Bunda yashil «RUXSAT BERILDI» qolib ketmasligi kerak — hukm
    rad etishga qayta chiziladi va tugma yopiladi.
  */
  const [rejectedAtConfirm, setRejectedAtConfirm] = useState<string | null>(null);

  /*
    Bola almashsa, oldingi tanlov ham, oldingi VERDIKT ham yaroqsiz. Ularni
    tozalamaslik eng xavfli xatolardan biri: ekranda boshqa bola uchun
    olingan yashil «ruxsat berildi» qolib qolishi mumkin (§0, cross-screen).
  */
  useEffect(() => {
    setRecipient(null);
    setNote("");
    setRejectedAtConfirm(null);
  }, [childId]);

  const verify = usePickupVerify(childId, recipient, options.enabled ?? true);
  const checkOut = useCheckOut();

  const verdict: PickupVerifyResult | undefined = rejectedAtConfirm
    ? { allowed: false, reason: rejectedAtConfirm }
    : verify.data;

  const selectRecipient = (next: PickupRecipient | null) => {
    setRecipient(next);
    setRejectedAtConfirm(null);
  };

  const reset = () => {
    setRecipient(null);
    setNote("");
    setRejectedAtConfirm(null);
  };

  const submit = () => {
    if (!recipient) return;
    checkOut.mutate(
      {
        childId,
        ...recipientField(recipient),
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("attendance.checkedOut", { name: options.childName ?? "" }));
          reset();
          options.onSuccess?.();
        },
        onError: (error) => {
          /*
            Server chiqishda avtorizatsiyani QAYTA tekshiradi, shuning uchun
            ijobiy tekshiruv kafolat emas: vasiy bog'lamasi olib tashlanishi
            yoki ruxsat muddati o'tishi mumkin. Shu xatolar hukmni rad etishga
            qayta chizadi.
          */
          if (
            isApiError(error) &&
            (error.status === 403 ||
              error.code === "PERMISSION_EXPIRED" ||
              error.code === "PICKUP_NOT_AUTHORIZED" ||
              error.code === "PICKUP_AUTHORIZATION_REQUIRED")
          ) {
            setRejectedAtConfirm(errorMessage(t, error));
            void verify.refetch();
          }
        },
      },
    );
  };

  return {
    recipient,
    selectRecipient,
    note,
    setNote,
    verify,
    verdict,
    allowed: verdict?.allowed === true,
    /** Tekshiruvning o'zi bajarilmadi — bu rad etish EMAS. */
    verifyError: rejectedAtConfirm ? undefined : verify.error,
    pending: checkOut.isPending,
    submit,
    reset,
  };
}
