import { api } from "../http";
import { toPage } from "../types";
import type {
  ChildLookup,
  ChildLookupParams,
  Id,
  LookupPermission,
  Paginated,
  PayerLookup,
  PickupGuardianLookup,
} from "../types";

/**
 * Qamrovli tanlagichlar (Handbook, 2026-10-04).
 *
 * Har bir chaqiruvda `permission` ANIQ yuboriladi: `pickup-guardians`
 * endpointi umumiy DTO'ning standarti (`child:read`) ni RAD ETADI, ya'ni
 * parametrni tushirib qoldirish 4xx bilan tugaydi.
 *
 * Bo'sh yoki xato javob «ro'yxat bo'sh» degani EMAS — chaqiruvchi xatoni
 * ko'rsatishi shart, aks holda xodim «ruxsat berilgan odam yo'q» deb o'ylaydi.
 */
export const lookupsApi = {
  /*
    So'rov parametrlari ANIQ yig'iladi, `params as QueryParams` qilib
    tashlanmaydi: `permission` majburiy va uni tasodifan tushirib qoldirish
    endpointni standart `child:read` bilan chaqirishga olib keladi — bu esa
    boshqa huquv bilan ishlayotgan xodim uchun `403`.
  */
  children: ({ permission, q, branchId, groupId, page, limit }: ChildLookupParams) =>
    api
      .get<Paginated<ChildLookup> | ChildLookup[]>("/lookups/children", {
        permission,
        q,
        branchId,
        groupId,
        page,
        limit,
      })
      .then(toPage),

  /**
   * Bolaga bog'langan ota-ona/vasiylar — YALANG'OCH massiv qaytadi.
   * Ro'yxat to'liq: uzunligidan keyingi sahifa bor deb xulosa chiqarilmaydi.
   */
  pickupGuardians: (
    childId: Id,
    permission: Extract<LookupPermission, "pickup:read" | "pickup:manage" | "pickup:temporary">,
  ) =>
    api.get<PickupGuardianLookup[]>(`/lookups/children/${childId}/pickup-guardians`, {
      permission,
    }),

  /** To'lovchi vasiylar — `payment:create` talab qiladi. */
  payers: (childId: Id) => api.get<PayerLookup[]>(`/lookups/children/${childId}/payers`),
};
