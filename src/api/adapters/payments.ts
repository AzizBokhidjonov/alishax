import { subtractTiyin, addTiyin } from "@/lib/money";
import type { Payment, PaymentAllocation } from "../types";

export interface PaymentResponse extends Omit<Payment, "allocations" | "advanceTiyin"> {
  child?: { firstName: string; lastName: string } | null;
  guardian?: { fullName: string } | null;
  paymentAllocation?: (PaymentAllocation & {
    charge?: { description?: string | null } | null;
  })[];
}

export function normalizePayment(response: PaymentResponse): Payment {
  const allocations = response.paymentAllocation?.map((allocation) => ({
    chargeId: allocation.chargeId,
    amountTiyin: allocation.amountTiyin,
    chargeDescription: allocation.charge?.description ?? undefined,
  }));
  return {
    ...response,
    childName: response.child
      ? [response.child.lastName, response.child.firstName].join(" ")
      : response.childName,
    payerName: response.guardian?.fullName ?? response.payerName,
    allocations,
    // Ro'yxatda taqsimot kelmaydi; avansni faqat tafsilot javobidan hisoblaymiz.
    advanceTiyin:
      allocations && response.sign !== -1
        ? subtractTiyin(
            response.amountTiyin,
            addTiyin(...allocations.map((row) => row.amountTiyin)),
          )
        : undefined,
  };
}
