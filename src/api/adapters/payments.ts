import { subtractTiyin, addTiyin } from "@/lib/money";
import type { Payment, PaymentAllocation } from "../types";

export interface PaymentResponse extends Omit<Payment, "allocations" | "advanceTiyin"> {
  child?: { firstName: string; lastName: string } | null;
  guardian?: { fullName: string } | null;
  otherPayment?: { id: string }[];
  paymentAllocation?: (PaymentAllocation & {
    charge?: { description?: string | null; kind?: string } | null;
  })[];
}

export function normalizePayment(response: PaymentResponse): Payment {
  const isCancelled = Boolean(
    response.cancelledAt || response.isCancelled || response.otherPayment?.length,
  );
  const allocations = response.paymentAllocation?.map((allocation) => ({
    chargeId: allocation.chargeId,
    amountTiyin: allocation.amountTiyin,
    chargeDescription: allocation.charge?.description ?? undefined,
    chargeKind: allocation.charge?.kind,
  }));
  return {
    ...response,
    childName: response.child
      ? [response.child.lastName, response.child.firstName].join(" ")
      : response.childName,
    payerName: response.guardian?.fullName ?? response.payerName,
    isCancelled,
    allocations,
    // Ro'yxatda taqsimot kelmaydi; avansni faqat tafsilot javobidan hisoblaymiz.
    advanceTiyin:
      allocations && response.sign !== -1 && !isCancelled
        ? subtractTiyin(
            response.amountTiyin,
            addTiyin(...allocations.map((row) => row.amountTiyin)),
          )
        : undefined,
  };
}

export function paymentSignedAmount(payment: Pick<Payment, "amountTiyin" | "sign">): string {
  return (BigInt(payment.amountTiyin) * BigInt(payment.sign ?? 1)).toString();
}
