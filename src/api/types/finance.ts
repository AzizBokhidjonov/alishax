import type { Id, IsoDate, IsoDateTime, Tiyin } from "./common";

export type TariffKind =
  | "monthly_fixed"
  | "full_day"
  | "half_day"
  | "group_based"
  | "attendance_based"
  | "meal"
  | "transport"
  | "extra_class"
  | "registration_fee";

export interface Tariff {
  id: Id;
  branchId?: Id;
  name: string;
  kind: TariffKind;
  amountTiyin: Tiyin;
  active?: boolean;
}

export interface CreateTariffDto {
  branchId?: Id;
  name: string;
  kind: TariffKind;
  amountTiyin: Tiyin;
}

export interface UpdateTariffDto {
  name?: string;
  amountTiyin?: Tiyin;
  active?: boolean;
}

export interface ChildTariff {
  id: Id;
  childId?: Id;
  tariffId: Id;
  tariffName?: string;
  kind?: TariffKind;
  amountTiyin?: Tiyin;
  effectiveFrom: IsoDate;
  effectiveTo?: IsoDate;
}

export interface AssignChildTariffDto {
  tariffId: Id;
  effectiveFrom: IsoDate;
  effectiveTo?: IsoDate;
}

export type DiscountKind = "percent" | "fixed";

export interface Discount {
  id: Id;
  childId?: Id;
  kind: DiscountKind;
  /** `fixed` uchun tiyin satri, `percent` uchun bazis punkt (1000 = 10%). */
  value: string;
  validFrom: IsoDate;
  validTo?: IsoDate;
  reason: string;
  revokedAt?: IsoDateTime;
}

export interface CreateDiscountDto {
  kind: DiscountKind;
  value: string;
  validFrom: IsoDate;
  validTo?: IsoDate;
  reason: string;
}

export interface Period {
  id: Id;
  year: number;
  month: number;
  status?: "open" | "closed";
  closedAt?: IsoDateTime;
  closedBy?: string;
  reopenedAt?: IsoDateTime;
}
