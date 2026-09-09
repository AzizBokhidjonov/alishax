import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  pickupApi,
  type CreatePickupPersonDto,
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
 * Qabulxona uchun asosiy tekshiruv: `allowed` bayrog'i va odamning surati.
 * Faqat ikkala id ham tanlanganda so'raladi.
 */
export function usePickupVerify(childId: string, pickupPersonId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.pickupVerify({ childId, pickupPersonId }),
    queryFn: () => pickupApi.verify(childId, pickupPersonId),
    enabled: enabled && Boolean(childId) && Boolean(pickupPersonId),
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
