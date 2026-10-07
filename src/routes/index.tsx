import { createFileRoute } from "@tanstack/react-router";
import { API_BASE_URL, publicLandingApi, type PublicLandingPage } from "@/api";
import { DEFAULT_LANGUAGE } from "@/i18n";
import { LandingPage } from "@/features/landing/LandingPage";

/**
 * Zaxira meta — CMS sahifasi bo'lmaganda ishlatiladi.
 *
 * Ommaviy sayt ikki rejimda ishlaydi (qarang `LandingPage`): chop etilgan
 * sahifa bo'lsa bloklar shundan chiziladi, bo'lmasa statik matn qoladi.
 * Sarlavha va tavsif ham xuddi shu qoidaga bo'ysunishi kerak edi, lekin
 * ilgari ular FAQAT shu yerda, qotirib yozilgan edi: adminkadagi «SEO»
 * varaqasi saqlanar, chop etilar va ommaviy javobda qaytar — ammo sahifada
 * hech qachon ishlatilmasdi.
 */
const FALLBACK_META = [
  { title: "Alishax Kids — Toshkentdagi zamonaviy xususiy bog'cha" },
  {
    name: "description",
    content:
      "Alishax Kids bog'chasi: 1,5 yoshdan 7 yoshgacha qabul. Ingliz va rus tili, matematika, logopediya, karate, kuniga 5 mahal ovqat.",
  },
  { property: "og:title", content: "Alishax Kids bog'chasi" },
  {
    property: "og:description",
    content:
      "1,5 yoshdan 7 yoshgacha bolalar qabul. Xavfsiz muhit, ijodiy mashg'ulotlar va onlayn davomat nazorati.",
  },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary_large_image" },
];

/** Bo'sh va `null` qiymatlar meta ro'yxatiga tushmasligi kerak (§7). */
const value = (input: string | null | undefined): string | undefined =>
  typeof input === "string" && input.trim() ? input.trim() : undefined;

function metaFor(page: PublicLandingPage | null) {
  if (!page) return FALLBACK_META;

  const title = value(page.seo.title);
  const description = value(page.seo.description);
  const ogImageFileId = value(page.seo.ogImageFileId);
  const fallbackTitle = FALLBACK_META[0].title as string;
  const fallbackDescription = FALLBACK_META[1].content as string;

  /*
    Har bir maydon ALOHIDA zaxiraga tushadi: tarjimasi bo'lmagan maydon
    ommaviy javobda `null` bo'lib keladi, ya'ni yarim to'ldirilgan SEO
    sahifani sarlavhasiz qoldirmasligi kerak.
  */
  const meta: Record<string, string>[] = [
    { title: title ?? fallbackTitle },
    { name: "description", content: description ?? fallbackDescription },
    { property: "og:title", content: title ?? fallbackTitle },
    { property: "og:description", content: description ?? fallbackDescription },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];

  if (ogImageFileId) {
    // Ommaviy rasm — tokensiz manzil orqali (§5).
    meta.push({ property: "og:image", content: `${page.mediaBaseUrl}/${ogImageFileId}` });
  }

  return meta;
}

export const Route = createFileRoute("/")({
  /**
   * Meta SERVERDA to'ldiriladi: qidiruv tizimi va havola ko'rinishini
   * tayyorlaydigan botlar JavaScript kutmaydi.
   *
   * Uchta himoya bor va uchalasi ham zarur:
   *
   *   1. Dev'da `API_BASE_URL` nisbiy (`/api/v1`) — serverda bunday manzilga
   *      `fetch` qilib bo'lmaydi. Bunday holatda so'rov umuman yuborilmaydi.
   *   2. Har qanday xato yutiladi: bosh sahifa API tufayli ochilmay qolmasligi
   *      kerak — u bog'chaning telefon raqami turgan sahifa.
   *   3. Kutish vaqti cheklangan: sekin API butun sahifani ushlab turmasin.
   */
  loader: async (): Promise<PublicLandingPage | null> => {
    const isAbsolute = /^https?:\/\//i.test(API_BASE_URL);
    if (typeof window === "undefined" && !isAbsolute) return null;

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 3000);
    try {
      return await publicLandingApi.page(DEFAULT_LANGUAGE, undefined, abort.signal);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  },
  head: ({ loaderData }) => ({ meta: metaFor(loaderData ?? null) }),
  component: LandingPage,
});
