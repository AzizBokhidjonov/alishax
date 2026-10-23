import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  childrenApi,
  type ChildStatusDto,
  type CreateChildDocumentDto,
  type CreateChildDto,
  type LinkGuardianDto,
  type MedicalRecord,
  type UpdateChildDocumentDto,
  type UpdateChildDto,
  type UpdateGuardianLinkDto,
  type Consent,
} from "@/api";
import type { ChildListParams } from "@/api/endpoints/children";
import { qk, useApiMutation } from "@/lib/query";

export function useChildren(params: ChildListParams, enabled = true) {
  return useQuery({
    queryKey: qk.children(params),
    queryFn: () => childrenApi.list(params),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useChild(id: string, enabled = true) {
  return useQuery({
    queryKey: qk.child(id),
    queryFn: () => childrenApi.get(id),
    enabled: enabled && Boolean(id),
  });
}

export function useCreateChild() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateChildDto) => childrenApi.create(dto),
    successMessage: t("common.state.created"),
    invalidate: [["children"]],
  });
}

export function useUpdateChild() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateChildDto }) => childrenApi.update(id, dto),
    successMessage: t("common.state.updated"),
    invalidate: [["children"]],
  });
}

/** Yumshoq o'chirish — yozuv arxivga tushadi (Owner/Director). */
export function useDeleteChild() {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (id: string) => childrenApi.remove(id),
    successMessage: t("common.state.deleted"),
    invalidate: [["children"]],
  });
}

/** Holat PATCH bilan emas, alohida amal bilan o'zgaradi va tarixga tushadi. */
export function useSetChildStatus(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: ChildStatusDto) => childrenApi.setStatus(childId, dto),
    successMessage: t("children.status.changed"),
    invalidate: [["children"], qk.childHistory(childId)],
  });
}

export function useChildHistory(childId: string) {
  return useQuery({
    queryKey: qk.childHistory(childId),
    queryFn: () => childrenApi.history(childId),
    enabled: Boolean(childId),
  });
}

export function useChildDocuments(childId: string) {
  return useQuery({
    queryKey: qk.childDocuments(childId),
    queryFn: () => childrenApi.documents(childId),
    enabled: Boolean(childId),
  });
}

export function useAddDocument(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: CreateChildDocumentDto) => childrenApi.addDocument(childId, dto),
    successMessage: t("common.state.created"),
    invalidate: [qk.childDocuments(childId)],
  });
}

export function useUpdateDocument(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ docId, dto }: { docId: string; dto: UpdateChildDocumentDto }) =>
      childrenApi.updateDocument(childId, docId, dto),
    successMessage: t("common.state.updated"),
    invalidate: [qk.childDocuments(childId)],
  });
}

export function useVerifyDocument(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (docId: string) => childrenApi.verifyDocument(childId, docId),
    successMessage: t("children.documents.verified"),
    invalidate: [qk.childDocuments(childId)],
  });
}

export function useExpiringDocuments(withinDays: number) {
  return useQuery({
    queryKey: qk.documentsExpiring(withinDays),
    queryFn: () => childrenApi.expiringDocuments(withinDays),
  });
}

export function useMedical(childId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.childMedical(childId),
    queryFn: () => childrenApi.medical(childId),
    enabled: enabled && Boolean(childId),
    retry: false,
  });
}

export function useMedicalAlerts(childId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.childAlerts(childId),
    queryFn: () => childrenApi.medicalAlerts(childId),
    enabled: enabled && Boolean(childId),
    retry: false,
  });
}

export function useSaveMedical(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: MedicalRecord) => childrenApi.saveMedical(childId, dto),
    successMessage: t("children.medical.saved"),
    invalidate: [qk.childMedical(childId), qk.childAlerts(childId)],
  });
}

export function useConsents(childId: string) {
  return useQuery({
    queryKey: qk.childConsents(childId),
    queryFn: () => childrenApi.consents(childId),
    enabled: Boolean(childId),
  });
}

export function useRecordConsent(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: {
      guardianId: string;
      consentType: Consent["consentType"];
      granted: boolean;
      evidenceFileId?: string;
    }) => childrenApi.recordConsent(childId, dto),
    successMessage: t("common.state.created"),
    invalidate: [qk.childConsents(childId)],
  });
}

export function useRevokeConsent(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (consentId: string) => childrenApi.revokeConsent(childId, consentId),
    successMessage: t("children.consents.revoked"),
    invalidate: [qk.childConsents(childId)],
  });
}

export function useChildGuardians(childId: string) {
  return useQuery({
    queryKey: qk.childGuardians(childId),
    queryFn: () => childrenApi.guardians(childId),
    enabled: Boolean(childId),
  });
}

export function useLinkGuardian(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (dto: LinkGuardianDto) => childrenApi.linkGuardian(childId, dto),
    successMessage: t("guardians.link.linked"),
    invalidate: [qk.childGuardians(childId), qk.child(childId)],
  });
}

export function useUpdateGuardianLink(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: ({ guardianId, dto }: { guardianId: string; dto: UpdateGuardianLinkDto }) =>
      childrenApi.updateGuardianLink(childId, guardianId, dto),
    successMessage: t("common.state.updated"),
    invalidate: [qk.childGuardians(childId)],
  });
}

export function useUnlinkGuardian(childId: string) {
  const { t } = useTranslation();
  return useApiMutation({
    mutationFn: (guardianId: string) => childrenApi.unlinkGuardian(childId, guardianId),
    successMessage: t("common.state.deleted"),
    invalidate: [qk.childGuardians(childId), qk.child(childId)],
  });
}
