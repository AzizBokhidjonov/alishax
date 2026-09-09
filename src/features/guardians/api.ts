import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { guardiansApi, type CreateGuardianDto, type UpdateGuardianDto } from "@/api";
import type { GuardianListParams } from "@/api/endpoints/guardians";
import { qk, useApiMutation } from "@/lib/query";

export function useGuardians(params: GuardianListParams) {
  return useQuery({
    queryKey: qk.guardians(params),
    queryFn: () => guardiansApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useGuardian(id: string) {
  return useQuery({
    queryKey: qk.guardian(id),
    queryFn: () => guardiansApi.get(id),
    enabled: Boolean(id),
  });
}

export function useGuardianChildren(id: string) {
  return useQuery({
    queryKey: [...qk.guardian(id), "children"],
    queryFn: () => guardiansApi.children(id),
    enabled: Boolean(id),
  });
}

/**
 * Yaratish. Telefon takrorlansa server `409 DUPLICATE` va mavjud yozuvni
 * qaytaradi — xatoni forma o'zi ushlab, «bog'lash» oqimini taklif qiladi,
 * shuning uchun bu yerda toast ko'rsatilmaydi.
 */
export function useCreateGuardian() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateGuardianDto) => guardiansApi.create(dto),
    successMessage: t("common.state.created"),
    invalidate: [["guardians"]],
    onError: () => {},
  });
}

export function useUpdateGuardian() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGuardianDto }) =>
      guardiansApi.update(id, dto),
    successMessage: t("common.state.updated"),
    invalidate: [["guardians"]],
  });
}

export function useTelegramBindings() {
  return useQuery({
    queryKey: [...qk.telegram, "bindings"],
    queryFn: () => guardiansApi.telegramBindings(),
  });
}

export function useTelegramUnbound() {
  return useQuery({
    queryKey: [...qk.telegram, "unbound"],
    queryFn: () => guardiansApi.telegramUnbound(),
  });
}

export function useTelegramInvite() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (guardianId: string) => guardiansApi.telegramInvite(guardianId),
    successMessage: t("guardians.telegram.inviteCreated"),
    invalidate: [qk.telegram],
  });
}
