import type { Id, ListParams } from "./common";

/**
 * Qamrovli nom tanlagichlari (Handbook, 2026-10-04).
 *
 * Nega alohida endpointlar bor: ilgari bolani yoki ota-onani tanlash uchun
 * to'liq katalog (`/children`, `/guardians`) o'qilardi va bu xodimdan
 * KERAGIDAN KENG huquq talab qilardi — masalan olib ketishni rasmiylashtirish
 * uchun butun bog'cha bo'yicha `guardian:read`. Bu endpointlar esa AMALGA
 * mos huquvni tekshiradi va faqat id bilan ismni qaytaradi.
 */

/** `permission` parametri qabul qiladigan qiymatlar (serverdagi enum). */
export type LookupPermission =
  | "child:read"
  | "payment:read"
  | "payment:create"
  | "charge:read"
  | "charge:generate"
  | "billing_rules:manage"
  | "pickup:read"
  | "pickup:manage"
  | "pickup:temporary"
  | "attendance:checkin";

/**
 * Bolaning qisqa yozuvi.
 *
 * `fullName` BO'LMASLIGI mumkin — bola ismi `firstName`/`lastName` dan
 * yig'iladi (§4). Shuning uchun ikkalasi ham ixtiyoriy va ko'rsatishda
 * `childDisplayName()` ishlatiladi.
 */
export interface ChildLookup {
  id: Id;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  fullName?: string;
  groupName?: string;
}

/**
 * Olib ketish uchun bolaga BOG'LANGAN ota-ona/vasiy.
 *
 * Bu yozuvlarda **vasiy id'si** turadi — bola id'si ham, ruxsat id'si ham
 * emas. Tekshirish va chiqishda u `guardianId` bo'lib yuboriladi.
 */
export interface PickupGuardianLookup {
  id: Id;
  fullName: string;
  phone?: string;
  relationship?: string;
}

/** To'lov uchun to'lovchi vasiy. Bu global vasiylar katalogi EMAS. */
export interface PayerLookup {
  id: Id;
  fullName: string;
}

export interface ChildLookupParams extends ListParams {
  /**
   * AMALNING huquqi — foydalanuvchida bor eng keng huquq emas. Serverda
   * standart `child:read`, lekin har bir chaqiruvda ANIQ yuborilishi kerak.
   */
  permission: LookupPermission;
  branchId?: string;
  groupId?: string;
}

/** Ismni ko'rsatish uchun — bo'laklardan yig'iladi, `fullName` bo'lsa o'sha. */
export function childDisplayName(child: ChildLookup): string {
  if (child.fullName?.trim()) return child.fullName.trim();
  return [child.lastName, child.firstName, child.middleName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}
