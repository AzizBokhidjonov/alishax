import { api } from "../http";
import type {
  CreatePickupPersonDto,
  Id,
  PickupHistoryEntry,
  PickupPerson,
  PickupVerifyResult,
  TemporaryPermissionDto,
  UpdatePickupPersonDto,
} from "../types";

export const pickupApi = {
  personsOfChild: (childId: Id) => api.get<PickupPerson[]>(`/children/${childId}/pickup-persons`),
  createPerson: (childId: Id, dto: CreatePickupPersonDto) =>
    api.post<PickupPerson>(`/children/${childId}/pickup-persons`, dto),
  updatePerson: (id: Id, dto: UpdatePickupPersonDto) =>
    api.patch<PickupPerson>(`/pickup-persons/${id}`, dto),
  removePerson: (id: Id) => api.delete<void>(`/pickup-persons/${id}`),
  revokePerson: (id: Id, reason: string) =>
    api.post<PickupPerson>(`/pickup-persons/${id}/revoke`, { reason }),

  activePermissions: (childId: Id, date?: string) =>
    api.get<PickupPerson[]>("/pickup-permissions/active", { childId, date }),
  createTemporary: (dto: TemporaryPermissionDto) =>
    api.post<PickupPerson>("/pickup-permissions/temporary", dto),

  history: (childId: Id) => api.get<PickupHistoryEntry[]>(`/children/${childId}/pickup-history`),

  /** Qabulxona bolani berishdan oldin shu yerdan tasdiqlaydi. */
  verify: (childId: Id, pickupPersonId: Id) =>
    api.get<PickupVerifyResult>("/pickup/verify", { childId, pickupPersonId }),
};
