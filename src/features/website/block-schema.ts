import type { BlockContent, I18nText } from "@/api";

/**
 * Blok maydonlarining SHAKLI.
 *
 * «Bu jadvalni qotirib qo'ymang» degan talab (§3) turlar RO'YXATIGA tegishli:
 * qaysi turlar borligi va ularda qanday maydonlar borligini server aytadi
 * (`GET /landing/block-types`) va yangi tur frontend relizisiz qo'shiladi.
 * Ammo maydonni CHIZISH uchun uning turi ham kerak — matnmi, rasmmi,
 * ro'yxatmi. Shuning uchun bu yerda faqat shakl saqlanadi va u serverdagi
 * ro'yxat bilan kesishtiriladi: katalogda bor, bu yerda yo'q maydon
 * chizilmaydi, katalogda yo'q tur esa «hali qo'llab-quvvatlanmaydi» deb
 * belgilanadi.
 */
export type FieldKind = "i18n" | "text" | "url" | "image" | "bool" | "strings" | "items";

export interface FieldSpec {
  name: string;
  kind: FieldKind;
  required?: boolean;
  /** Uzun matn — `textarea` bilan chiziladi. */
  multiline?: boolean;
  /** `items` uchun ichki maydonlar. */
  fields?: FieldSpec[];
  /** Server cheklovi — ro'yxatga shuncha element sig'adi. */
  max?: number;
}

const i18n = (name: string, extra: Partial<FieldSpec> = {}): FieldSpec => ({
  name,
  kind: "i18n",
  ...extra,
});

export const BLOCK_FIELDS: Record<string, FieldSpec[]> = {
  hero: [
    i18n("title", { required: true }),
    i18n("subtitle", { multiline: true }),
    { name: "imageFileId", kind: "image" },
    i18n("ctaLabel"),
    { name: "ctaHref", kind: "text" },
  ],
  about: [
    i18n("title"),
    i18n("body", { required: true, multiline: true }),
    { name: "imageFileId", kind: "image" },
  ],
  features: [
    i18n("title"),
    {
      name: "items",
      kind: "items",
      max: 24,
      fields: [
        i18n("title", { required: true }),
        i18n("description", { multiline: true }),
        { name: "icon", kind: "text" },
        { name: "imageFileId", kind: "image" },
      ],
    },
  ],
  gallery: [
    i18n("title"),
    {
      name: "images",
      kind: "items",
      max: 60,
      fields: [{ name: "fileId", kind: "image", required: true }, i18n("caption")],
    },
  ],
  teachers: [
    i18n("title"),
    {
      name: "people",
      kind: "items",
      max: 60,
      fields: [
        { name: "name", kind: "text", required: true },
        i18n("role"),
        i18n("bio", { multiline: true }),
        { name: "photoFileId", kind: "image" },
      ],
    },
  ],
  pricing: [
    i18n("title"),
    i18n("note", { multiline: true }),
    {
      name: "plans",
      kind: "items",
      max: 12,
      fields: [
        i18n("name", { required: true }),
        /*
          `price` — MARKETING MATNI, pul emas: «1 500 000 so'mdan». Uni tiyin
          yordamchilaridan o'tkazish mumkin emas, haqiqiy tariflar butunlay
          boshqa modulda (§3, §10.7).
        */
        i18n("price", { required: true }),
        i18n("description", { multiline: true }),
        { name: "highlighted", kind: "bool" },
      ],
    },
  ],
  testimonials: [
    i18n("title"),
    {
      name: "items",
      kind: "items",
      max: 30,
      fields: [
        i18n("quote", { required: true, multiline: true }),
        { name: "author", kind: "text", required: true },
        i18n("role"),
        { name: "photoFileId", kind: "image" },
      ],
    },
  ],
  faq: [
    i18n("title"),
    {
      name: "items",
      kind: "items",
      max: 50,
      fields: [
        i18n("question", { required: true }),
        i18n("answer", { required: true, multiline: true }),
      ],
    },
  ],
  contacts: [
    i18n("title"),
    i18n("address"),
    { name: "phones", kind: "strings" },
    { name: "email", kind: "text" },
    i18n("workingHours"),
    { name: "mapEmbedUrl", kind: "url" },
    {
      name: "social",
      kind: "items",
      max: 12,
      fields: [
        { name: "platform", kind: "text", required: true },
        { name: "url", kind: "url", required: true },
      ],
    },
  ],
  cta: [
    i18n("title", { required: true }),
    i18n("subtitle", { multiline: true }),
    i18n("buttonLabel", { required: true }),
    { name: "buttonHref", kind: "text", required: true },
  ],
  stats: [
    i18n("title"),
    {
      name: "items",
      kind: "items",
      max: 12,
      /* `value` — oddiy satr: «12», «7+», «98%». Ataylab son emas (§3). */
      fields: [{ name: "value", kind: "text", required: true }, i18n("label", { required: true })],
    },
  ],
};

export const isSupportedType = (type: string): boolean => type in BLOCK_FIELDS;

/**
 * Blok chop etiladimi.
 *
 * FAQAT aniq `false` yashirilgan degani. Ilgari bu `!block.isVisible` bilan
 * o'qilardi va server maydonni javobda tushirib qoldirsa, HAR BIR blok
 * «Chop etilmaydi» deb belgilanardi — aslida ular ko'rinadigan bo'lsa ham.
 * Serverdagi standart `true`, shuning uchun `undefined` ham ko'rinadigan.
 */
export const isBlockVisible = (block: { isVisible?: boolean }): boolean =>
  block.isVisible !== false;

/**
 * Serverdagi maydonlar ro'yxati bilan kesishma. Katalogda bo'lmagan maydon
 * chizilmaydi — aks holda `content` da ortiqcha kalit paydo bo'ladi va
 * server uni `422` bilan rad etadi (tarkib obyektlari QAT'IY, §3).
 */
export function fieldsFor(type: string, catalogFields?: string[]): FieldSpec[] {
  const specs = BLOCK_FIELDS[type] ?? [];
  if (!catalogFields?.length) return specs;
  return specs.filter((spec) => catalogFields.includes(spec.name));
}

function emptyValue(spec: FieldSpec): unknown {
  switch (spec.kind) {
    case "i18n":
      return {} as I18nText;
    case "bool":
      return false;
    case "strings":
    case "items":
      return [];
    default:
      return "";
  }
}

export function emptyItem(fields: FieldSpec[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((spec) => [spec.name, emptyValue(spec)]));
}

/** Yangi blok uchun bo'sh tarkib — faqat majburiy maydonlar bilan. */
export function emptyContent(type: string): BlockContent {
  const content: BlockContent = {};
  for (const spec of BLOCK_FIELDS[type] ?? []) {
    if (spec.required || spec.kind === "items" || spec.kind === "strings") {
      content[spec.name] = emptyValue(spec);
    }
  }
  return content;
}

/**
 * Yuborishdan oldingi tozalash: bo'sh matn, bo'sh obyekt va bo'sh ro'yxat
 * olib tashlanadi. Server ixtiyoriy maydonni YO'Q deb qabul qiladi, bo'sh
 * satrni esa qiymat deb — va `""` chop etilgan sahifada bo'sh sarlavha
 * bo'lib chiqadi.
 */
export function pruneContent(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(pruneContent).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, pruneContent(item)] as const)
      .filter(([, item]) => item !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  if (typeof value === "string") return value.trim() ? value.trim() : undefined;
  if (typeof value === "boolean") return value ? true : undefined;
  return value ?? undefined;
}

/** Blok sarlavhasi ro'yxatda ko'rinishi uchun — birinchi topilgan matn. */
export function blockPreviewText(content: BlockContent, locales: string[]): string {
  const candidates = ["title", "name", "quote", "body", "question"];
  for (const key of candidates) {
    const value = content[key];
    if (typeof value === "string" && value.trim()) return value;
    if (value && typeof value === "object") {
      for (const locale of locales) {
        const text = (value as Record<string, unknown>)[locale];
        if (typeof text === "string" && text.trim()) return text;
      }
    }
  }
  return "";
}
