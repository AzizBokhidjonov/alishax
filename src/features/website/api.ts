import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  landingApi,
  publicLandingApi,
  type CreateBlockDto,
  type Id,
  type LandingSeo,
  type PublishDto,
  type ReorderBlocksDto,
  type UpdateBlockDto,
} from "@/api";
import { qk, useApiMutation } from "@/lib/query";

/** Muharrir butun ekranni shu bitta so'rov ustiga quradi (§4). */
export function useLandingDraft() {
  return useQuery({
    queryKey: qk.landing,
    queryFn: () => landingApi.draft(),
  });
}

/** Turlar katalogi sessiyaga bir marta olinadi — u kamdan-kam o'zgaradi. */
export function useBlockTypes() {
  return useQuery({
    queryKey: qk.landingBlockTypes,
    queryFn: () => landingApi.blockTypes(),
    staleTime: Infinity,
  });
}

export function useLandingVersions(enabled = true) {
  return useQuery({
    queryKey: qk.landingVersions,
    queryFn: () => landingApi.versions(),
    enabled,
  });
}

export function useLandingVersion(version: number | null) {
  return useQuery({
    queryKey: qk.landingVersion(version ?? 0),
    queryFn: () => landingApi.version(version as number),
    enabled: version !== null,
  });
}

const LANDING_KEYS = [qk.landing];

export function useCreateBlock() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateBlockDto) => landingApi.createBlock(dto),
    successMessage: t("common.state.created"),
    invalidate: LANDING_KEYS,
  });
}

export function useUpdateBlock() {
  return useApiMutation({
    // Saqlash odatiy amal — natijasi ro'yxatda ko'rinadi, toast kerak emas (§2.9).
    mutationFn: ({ id, dto }: { id: Id; dto: UpdateBlockDto }) => landingApi.updateBlock(id, dto),
    invalidate: LANDING_KEYS,
  });
}

export function useDeleteBlock() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (id: Id) => landingApi.deleteBlock(id),
    successMessage: t("website.blocks.deleted"),
    invalidate: LANDING_KEYS,
  });
}

export function useReorderBlocks() {
  return useApiMutation({
    mutationFn: (dto: ReorderBlocksDto) => landingApi.reorder(dto),
    invalidate: LANDING_KEYS,
  });
}

export function useSaveSeo() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: LandingSeo) => landingApi.saveSeo(dto),
    successMessage: t("common.state.saved"),
    invalidate: LANDING_KEYS,
  });
}

export function usePublishLanding() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: PublishDto) => landingApi.publish(dto),
    successMessage: t("website.publish.done"),
    invalidate: [qk.landing, qk.landingVersions],
  });
}

/**
 * Versiyani tiklash.
 *
 * Tiklash qoralamani almashtiradi va HAR BIR BLOKKA YANGI `id` beradi —
 * komponent holatidagi eski id'lar shu ondan e'tiboran yaroqsiz (§4, §10.3).
 * Shuning uchun kesh oddiy `invalidate` bilan emas, darhol qayta o'qish
 * bilan yangilanadi.
 */
export function useRestoreVersion() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (version: number) => landingApi.restore(version),
    successMessage: t("website.versions.restored"),
    onSuccess: () => {
      void queryClient.refetchQueries({ queryKey: qk.landing });
      void queryClient.invalidateQueries({ queryKey: qk.landingVersions });
    },
  });
}

/**
 * Ommaviy sahifa — tashrif buyuruvchi ko'radigan chop etilgan nusxa.
 *
 * `retry: false`: `404` bu yerda «hali chop etilmagan» degani va uni qayta
 * so'rashning ma'nosi yo'q — sayt statik matnga qaytadi (§6).
 */
export function usePublicLanding(lang: string) {
  return useQuery({
    queryKey: qk.publicLanding(lang),
    queryFn: () => publicLandingApi.page(lang),
    retry: false,
    staleTime: 60_000,
  });
}
