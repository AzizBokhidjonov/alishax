import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { isApiError, type PickupVerifyResult } from "@/api";
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
 */
export function usePickupCheckOut(childId: string, options: Options = {}) {
  const { t } = useTranslation();
  const [personId, setPersonId] = useState("");
  const [note, setNote] = useState("");

  /*
    Ruxsat tasdiqlash PAYTIDA ham tugashi mumkin: ekran ochiq turganda
    vaqtinchalik ruxsat muddati o'tadi va server `403 PERMISSION_EXPIRED`
    qaytaradi. Bunda yashil «RUXSAT BERILDI» qolib ketmasligi kerak — hukm
    rad etishga qayta chiziladi va tugma yopiladi.
  */
  const [rejectedAtConfirm, setRejectedAtConfirm] = useState<string | null>(null);

  const verify = usePickupVerify(childId, personId, options.enabled ?? true);
  const checkOut = useCheckOut();

  const verdict: PickupVerifyResult | undefined = rejectedAtConfirm
    ? { allowed: false, reason: rejectedAtConfirm }
    : verify.data;

  const selectPerson = (next: string) => {
    setPersonId(next);
    setRejectedAtConfirm(null);
  };

  const reset = () => {
    setPersonId("");
    setNote("");
    setRejectedAtConfirm(null);
  };

  const submit = () => {
    checkOut.mutate(
      { childId, pickupPersonId: personId, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t("attendance.checkedOut", { name: options.childName ?? "" }));
          reset();
          options.onSuccess?.();
        },
        onError: (error) => {
          if (isApiError(error) && (error.code === "PERMISSION_EXPIRED" || error.status === 403)) {
            setRejectedAtConfirm(errorMessage(t, error));
            void verify.refetch();
          }
        },
      },
    );
  };

  return {
    personId,
    selectPerson,
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
