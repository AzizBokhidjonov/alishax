import { api } from "../http";
import { recipientField } from "../types";
import type {
  ActivePickupPermission,
  CreatePickupPersonDto,
  Id,
  PickupHistoryEntry,
  PickupPerson,
  PickupRecipient,
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

  /**
   * «Boshqa ruxsat berilgan odamlar» ro'yxati.
   *
   * Bu ro'yxat `PickupPerson[]` EMAS: elementlar ruxsatlar va ularning
   * ba'zilari ro'yxatdagi shaxsga bog'lanmagan (bir martalik). Ilgari tur
   * `PickupPerson[]` deb berilgan edi va bir martalik ruxsatlar ismsiz
   * ko'rinardi.
   */
  activePermissions: (childId: Id, date?: string) =>
    api.get<ActivePickupPermission[]>("/pickup-permissions/active", { childId, date }),
  createTemporary: (dto: TemporaryPermissionDto) =>
    api.post<PickupPerson>("/pickup-permissions/temporary", dto),

  history: (childId: Id) => api.get<PickupHistoryEntry[]>(`/children/${childId}/pickup-history`),

  /**
   * Qabulxona bolani berishdan oldin shu yerdan tasdiqlaydi.
   *
   * Qabul qiluvchi UCH xil bo'lishi mumkin va ular o'zaro inkor etadi, shuning
   * uchun u teglangan qiymat sifatida uzatiladi: vasiy id'sini tasodifan
   * `pickupPersonId` ga qo'yib yuborish mumkin bo'lmasin (§0).
   *
   * Muhim: `allowed: false` ham MUVAFFAQIYATLI javob — chaqiruvchi mantiqiy
   * qiymatga qarashi shart, holat kodiga emas.
   */
  verify: (childId: Id, recipient: PickupRecipient) =>
    api.get<PickupVerifyResult>("/pickup/verify", {
      childId,
      ...recipientField(recipient),
    }),
};
