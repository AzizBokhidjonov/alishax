import type { Charge } from "../types";

export interface ChargeResponse extends Charge {
  child?: { firstName: string; lastName: string } | null;
  accountingPeriod?: { year: number; month: number } | null;
  issuedAt?: string;
  allocatedTiyin?: string;
}

export function normalizeCharge(response: ChargeResponse): Charge {
  return {
    ...response,
    childName: response.child
      ? [response.child.lastName, response.child.firstName].join(" ")
      : response.childName,
    period: response.accountingPeriod ?? response.period,
    createdAt: response.issuedAt ?? response.createdAt,
    paidTiyin: response.allocatedTiyin ?? response.paidTiyin,
  };
}
