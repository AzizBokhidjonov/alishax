import { api, type QueryParams } from "../http";
import { normalizeAlerts, normalizeMedical, toPage } from "../types";
import type {
  Child,
  ChildDetail,
  ChildDocument,
  ChildHistoryEntry,
  ChildStatusDto,
  Consent,
  CreateChildDocumentDto,
  CreateChildDto,
  GuardianLink,
  Id,
  LinkGuardianDto,
  ListParams,
  MedicalAlert,
  MedicalAlertsEnvelope,
  MedicalEnvelope,
  MedicalRecord,
  Paginated,
  UpdateChildDocumentDto,
  UpdateChildDto,
  UpdateGuardianLinkDto,
} from "../types";

export interface ChildListParams extends ListParams {
  groupId?: string;
  status?: string;
  hasDebt?: boolean;
  hasMedicalAlert?: boolean;
  branchId?: string;
}

export const childrenApi = {
  async list(params: ChildListParams = {}): Promise<Paginated<Child>> {
    const response = await api.get<Paginated<Child> | Child[]>("/children", params as QueryParams);
    return toPage(response);
  },

  get: (id: Id) => api.get<ChildDetail>(`/children/${id}`),
  create: (dto: CreateChildDto) => api.post<Child>("/children", dto),
  update: (id: Id, dto: UpdateChildDto) => api.patch<Child>(`/children/${id}`, dto),
  remove: (id: Id) => api.delete<void>(`/children/${id}`),

  setStatus: (id: Id, dto: ChildStatusDto) => api.post<Child>(`/children/${id}/status`, dto),
  history: (id: Id) => api.get<ChildHistoryEntry[]>(`/children/${id}/history`),

  documents: (id: Id) => api.get<ChildDocument[]>(`/children/${id}/documents`),
  addDocument: (id: Id, dto: CreateChildDocumentDto) =>
    api.post<ChildDocument>(`/children/${id}/documents`, dto),
  updateDocument: (id: Id, docId: Id, dto: UpdateChildDocumentDto) =>
    api.patch<ChildDocument>(`/children/${id}/documents/${docId}`, dto),
  verifyDocument: (id: Id, docId: Id) =>
    api.post<ChildDocument>(`/children/${id}/documents/${docId}/verify`),

  expiringDocuments: (withinDays = 30) =>
    api.get<ChildDocument[]>("/documents/expiring", { withinDays }),

  /*
    Server `{record, allergies, medications}` qaytaradi, eski o'rnatma esa
    yassi yozuv. Ikkalasi ham bitta shaklga keltiriladi — aks holda
    allergiyalar va dorilar ekranda yo'qolib ketadi.
  */
  medical: (id: Id) =>
    api.get<MedicalRecord | MedicalEnvelope>(`/children/${id}/medical`).then(normalizeMedical),
  saveMedical: (id: Id, dto: MedicalRecord) =>
    api.put<MedicalRecord>(`/children/${id}/medical`, dto),
  /** `{allergies, emergencyInstructions}` yoki massiv — ikkalasi ham. */
  medicalAlerts: (id: Id) =>
    api
      .get<MedicalAlert[] | MedicalAlertsEnvelope>(`/children/${id}/medical/alerts`)
      .then(normalizeAlerts),

  consents: (id: Id) => api.get<Consent[]>(`/children/${id}/consents`),
  recordConsent: (
    id: Id,
    dto: {
      guardianId: Id;
      consentType: Consent["consentType"];
      granted: boolean;
      evidenceFileId?: Id;
    },
  ) => api.post<Consent>(`/children/${id}/consents`, dto),
  revokeConsent: (id: Id, consentId: Id) =>
    api.post<Consent>(`/children/${id}/consents/${consentId}/revoke`),

  guardians: (childId: Id) => api.get<GuardianLink[]>(`/children/${childId}/guardians`),
  linkGuardian: (childId: Id, dto: LinkGuardianDto) =>
    api.post<GuardianLink>(`/children/${childId}/guardians`, dto),
  updateGuardianLink: (childId: Id, guardianId: Id, dto: UpdateGuardianLinkDto) =>
    api.patch<GuardianLink>(`/children/${childId}/guardians/${guardianId}`, dto),
  unlinkGuardian: (childId: Id, guardianId: Id) =>
    api.delete<void>(`/children/${childId}/guardians/${guardianId}`),
};
