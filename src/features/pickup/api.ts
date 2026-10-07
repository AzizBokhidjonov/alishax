import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  lookupsApi,
  pickupApi,
  type CreatePickupPersonDto,
  type PickupRecipient,
  type TemporaryPermissionDto,
  type UpdatePickupPersonDto,
} from "@/api";
import { qk, useApiMutation } from "@/lib/query";

export function usePickupPersons(childId: string) {
  return useQuery({
    queryKey: qk.pickupPersons(childId),
    queryFn: () => pickupApi.personsOfChild(childId),
    enabled: Boolean(childId),
  });
}

/** Berilgan sanada amal qiladigan ruxsatlar (`GET /pickup-permissions/active`). */
export function useActivePermissions(childId: string, date: string) {
  return useQuery({
    queryKey: ["pickup", "active", childId, date],
    queryFn: () => pickupApi.activePermissions(childId, date),
    enabled: Boolean(childId),
  });
}

export function usePickupHistory(childId: string) {
  return useQuery({
    queryKey: qk.pickupHistory(childId),
    queryFn: () => pickupApi.history(childId),
    enabled: Boolean(childId),
  });
}

/**
 * Bolaga BOG'LANGAN ota-ona/vasiylar (Handbook, 2026-10-04).
 *
 * Alohida endpoint, chunki olib ketishni rasmiylashtiradigan xodimda butun
 * bog'cha bo'yicha `guardian:read` bo'lishi shart emas. `permission` ANIQ
 * yuboriladi: umumiy DTO'ning standarti (`child:read`) bu yerda rad etiladi.
 *
 * Bu ro'yxat BO'SH bo'lsa ham olib ketish bloklanmaydi — qo'shimcha ruxsatlar
 * ro'yxati alohida yuklanadi.
 */
export function usePickupGuardians(
  childId: string,
  permission: "pickup:read" | "pickup:manage" | "pickup:temporary" = "pickup:read",
) {
  return useQuery({
    queryKey: ["lookups", "pickup-guardians", childId, permission],
    queryFn: () => lookupsApi.pickupGuardians(childId, permission),
    enabled: Boolean(childId),
  });
}

/**
 * Qabulxona uchun asosiy tekshiruv: `allowed` bayrog'i va odamning surati.
 *
 * Qabul qiluvchi teglangan: vasiy, ruxsat yoki ro'yxatdagi shaxs. Kesh kaliti
 * ham turni o'z ichiga oladi — bir xil UUID boshqa turda boshqa natija beradi.
 */
export function usePickupVerify(
  childId: string,
  recipient: PickupRecipient | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["pickup", "verify", childId, recipient?.kind ?? "", recipient?.id ?? ""],
    queryFn: () => pickupApi.verify(childId, recipient as PickupRecipient),
    enabled: enabled && Boolean(childId) && recipient !== null,
    retry: false,
  });
}

export function useCreatePickupPerson(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreatePickupPersonDto) => pickupApi.createPerson(childId, dto),
    successMessage: t("common.state.created"),
    invalidate: [qk.pickupPersons(childId)],
  });
}

export function useUpdatePickupPerson(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePickupPersonDto }) =>
      pickupApi.updatePerson(id, dto),
    successMessage: t("common.state.updated"),
    invalidate: [qk.pickupPersons(childId)],
  });
}

export function useRevokePickupPerson(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      pickupApi.revokePerson(id, reason),
    successMessage: t("pickup.persons.revoked"),
    invalidate: [qk.pickupPersons(childId)],
  });
}

export function useDeletePickupPerson(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (id: string) => pickupApi.removePerson(id),
    successMessage: t("common.state.deleted"),
    invalidate: [qk.pickupPersons(childId)],
  });
}

export function useCreateTemporaryPermission(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: TemporaryPermissionDto) => pickupApi.createTemporary(dto),
    successMessage: t("pickup.temporary.created"),
    invalidate: [qk.pickupPersons(childId), qk.pickupHistory(childId)],
  });
}
