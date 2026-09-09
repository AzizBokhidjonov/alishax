import type { Id, IsoDateTime } from "./common";

/**
 * Landing CMS turlari (Landing spec §3–§6).
 *
 * Ikkita boshqa-boshqa o'qish bor va ular ATAYLAB bir-biriga o'xshamaydi:
 * muharrir QORALAMANI ko'radi (har bir matn `{uz, ru, en}` obyekti), tashrif
 * buyuruvchi esa CHOP ETILGAN nusxani (matn bitta tilga yassilangan).
 * Shuning uchun blokning ikki turi bor — `LandingBlock` va `PublicBlock`.
 */

export type LandingLocale = "uz" | "ru" | "en";

/** Har bir til ixtiyoriy — yarim tarjima qilingan sahifa ham chop etsa bo'ladi (§7). */
export type I18nText = Partial<Record<LandingLocale, string>>;

export const LANDING_BLOCK_TYPES = [
  "hero",
  "about",
  "features",
  "gallery",
  "teachers",
  "pricing",
  "testimonials",
  "faq",
  "contacts",
  "cta",
  "stats",
] as const;

export type LandingBlockType = (typeof LANDING_BLOCK_TYPES)[number];

/**
 * Blok tarkibi — shakli `type` ga bog'liq va uni SERVER tekshiradi.
 * Mijozda qat'iy tur berilmaydi: yangi turni backend qo'shsa, frontend
 * relizisiz ishlashi kerak (§3).
 */
export type BlockContent = Record<string, unknown>;

export interface LandingBlock {
  id: Id;
  tenantId?: Id;
  pageId?: Id;
  type: string;
  position: number;
  isVisible: boolean;
  content: BlockContent;
  /** Serverda hisoblanadi — FAQAT o'qish uchun, qaytarib yuborilmaydi (§10.9). */
  fileIds?: Id[];
  createdAt?: IsoDateTime;
  updatedAt?: IsoDateTime;
  updatedBy?: Id;
}

export interface LandingSeo {
  title?: I18nText;
  description?: I18nText;
  ogImageFileId?: Id;
  canonicalUrl?: string;
}

export interface LandingDraft {
  id: Id;
  slug: string;
  seo: LandingSeo;
  blocks: LandingBlock[];
  /** Oxirgi chop etilgan versiya raqami. */
  version: number;
  publishedAt: IsoDateTime | null;
  publishedVersion: number | null;
  /** Chop etish tugmasi va sahifadan chiqish ogohlantirishi shunga bog'liq. */
  hasUnpublishedChanges: boolean;
}

/** «Blok qo'shish» menyusi va til tablari shu katalogdan quriladi (§4). */
export interface BlockTypeCatalog {
  locales: string[];
  types: { type: string; fields: string[] }[];
}

export interface CreateBlockDto {
  type: string;
  content: BlockContent;
  position?: number;
  isVisible?: boolean;
}

/** Faqat shu ikki kalit qabul qilinadi — ortiqchasi `400` (§4). */
export interface UpdateBlockDto {
  content?: BlockContent;
  isVisible?: boolean;
}

export interface ReorderBlocksDto {
  blocks: { id: Id; position: number }[];
}

export interface PublishDto {
  note?: string;
}

export interface PublishResult {
  version: number;
  publishedAt: IsoDateTime;
  blocks: number;
}

export interface RestoreResult {
  version: number;
  restoredFrom: number;
  publishedAt: IsoDateTime;
}

export interface LandingVersion {
  id: Id;
  version: number;
  note?: string;
  publishedAt: IsoDateTime;
  publishedBy?: string;
  /** Faqat bitta versiyani so'raganda keladi — ro'yxatda bo'lmaydi. */
  snapshot?: { blocks?: PublicBlock[]; seo?: Record<string, unknown> };
}

/** Ommaviy javob: matn bitta tilga yassilangan, tarjimasi yo'q maydon — `null` (§7). */
export type PublicValue = string | null;

export interface PublicBlock {
  id: Id;
  type: string;
  content: BlockContent;
}

export interface PublicLandingPage {
  slug: string;
  locale: string;
  version: number;
  publishedAt: IsoDateTime;
  seo: { title?: PublicValue; description?: PublicValue; ogImageFileId?: PublicValue };
  blocks: PublicBlock[];
  /** Prefiks bilan keladi: `${mediaBaseUrl}/${fileId}` — token kerak emas (§5). */
  mediaBaseUrl: string;
}
