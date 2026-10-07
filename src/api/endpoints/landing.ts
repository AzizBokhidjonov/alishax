import { api, API_BASE_URL, buildQuery } from "../http";
import { ApiError, fallbackCode, type ErrorEnvelope } from "../error";
import type {
  BlockTypeCatalog,
  CreateBlockDto,
  Id,
  LandingBlock,
  LandingDraft,
  LandingSeo,
  LandingVersion,
  PublicLandingPage,
  PublishDto,
  PublishResult,
  ReorderBlocksDto,
  RestoreResult,
  UpdateBlockDto,
} from "../types";

/** Muharrir uchun — hammasi `landing:manage`, chop etish `landing:publish` (§2). */
export const landingApi = {
  draft: () => api.get<LandingDraft>("/landing"),
  blockTypes: () => api.get<BlockTypeCatalog>("/landing/block-types"),

  createBlock: (dto: CreateBlockDto) => api.post<LandingBlock>("/landing/blocks", dto),
  /*
    `content` BUTUNLAY almashtiriladi, chuqur birlashtirish yo'q; `id`, `type`,
    `fileIds` ni qaytarib yuborish esa `400` beradi (§10.5, §10.9).
  */
  updateBlock: (id: Id, dto: UpdateBlockDto) => api.put<LandingBlock>(`/landing/blocks/${id}`, dto),
  deleteBlock: (id: Id) => api.delete<void>(`/landing/blocks/${id}`),
  reorder: (dto: ReorderBlocksDto) => api.put<LandingBlock[]>("/landing/blocks/reorder", dto),

  saveSeo: (dto: LandingSeo) => api.put<LandingSeo>("/landing/seo", dto),

  publish: (dto: PublishDto) => api.post<PublishResult>("/landing/publish", dto),
  versions: () => api.get<LandingVersion[]>("/landing/versions"),
  version: (version: number) => api.get<LandingVersion>(`/landing/versions/${version}`),
  restore: (version: number) => api.post<RestoreResult>(`/landing/versions/${version}/restore`),
};

/**
 * Sayt qaysi bog'cha nomidan o'qiydi. Bo'sh bo'lsa server o'zining
 * `LANDING_DEFAULT_TENANT_CODE` sozlamasiga tayanadi (§6).
 */
export const LANDING_TENANT_CODE: string =
  (import.meta.env.VITE_LANDING_TENANT_CODE as string | undefined) ?? "";

/**
 * Ommaviy o'qish — TOKENSIZ va COOKIE'SIZ (§10.8).
 *
 * `api.get` bu yerda ishlamaydi: u `Authorization` sarlavhasini va
 * `credentials: "include"` ni qo'shadi, ommaviy yo'llar esa allow-list
 * bo'yicha CORS tekshiruvidan o'tadi va cookie qaytarmaydi. Shuning uchun
 * bu yerda yalang'och `fetch`.
 *
 * Kesh brauzerga qoldirilgan: javob `ETag` va `max-age=60` bilan keladi,
 * ya'ni takroriy so'rov `304` bo'lib qaytadi va tarmoqqa yuk tushmaydi.
 */

/**
 * Sahifa ikki xil manzilda turishi mumkin va QAYSI BIRI ishlashi bu
 * yerdan ko'rinmaydi:
 *
 *   - `/public/landing/{tenantCode}` — kod `VITE_LANDING_TENANT_CODE` da;
 *   - `/public/landing` — backendda `LANDING_DEFAULT_TENANT_CODE` o'rnatilgan
 *     bitta bog'chali o'rnatmalar uchun.
 *
 * Ilgari faqat bittasi sinalardi: kod bo'sh bo'lsa yalang'och yo'l, aks holda
 * kodli yo'l. Ikkala sozlama ham qo'yilmagan bo'lsa natija `404` bo'lardi va
 * sayt jimgina statik matnga qaytardi — ya'ni adminkada kiritilgan va CHOP
 * ETILGAN kontent hech qachon ko'rinmasdi, sababi esa ekranda aytilmasdi.
 * Endi ikkalasi ham sinaladi va qaysi biri ishlagani `diagnose()` orqali
 * muharrirga ko'rsatiladi.
 */
function candidatePaths(tenantCode: string): string[] {
  const paths = tenantCode
    ? [`/public/landing/${tenantCode}`, "/public/landing"]
    : ["/public/landing"];
  return paths;
}

async function readEnvelope(response: Response): Promise<ApiError> {
  let envelope: Partial<ErrorEnvelope> = {};
  try {
    envelope = (await response.json()) as Partial<ErrorEnvelope>;
  } catch {
    // Javob JSON emas — holat kodidan zaxira kod olinadi.
  }
  return new ApiError({
    code: envelope.error?.code ?? fallbackCode(response.status),
    status: response.status,
    message: envelope.error?.message,
    traceId: envelope.error?.traceId,
  });
}

/** Qaysi yo'l ishlagani — keyingi so'rovlar to'g'ridan-to'g'ri shunga boradi. */
let resolvedPath: string | null = null;

export const publicLandingApi = {
  async page(
    lang: string,
    tenantCode = LANDING_TENANT_CODE,
    /** SSR'da meta uchun o'qilganda kutish vaqtini cheklash uchun. */
    signal?: AbortSignal,
  ): Promise<PublicLandingPage> {
    const paths = resolvedPath
      ? [resolvedPath, ...candidatePaths(tenantCode)]
      : candidatePaths(tenantCode);
    let lastError: ApiError | null = null;

    for (const path of [...new Set(paths)]) {
      const response = await fetch(`${API_BASE_URL}${path}${buildQuery({ lang })}`, {
        headers: { Accept: "application/json" },
        signal,
      });

      if (response.ok) {
        resolvedPath = path;
        return (await response.json()) as PublicLandingPage;
      }

      lastError = await readEnvelope(response);
      // `404` — «bu manzilda sahifa yo'q»: keyingi nomzodni sinash mantiqiy.
      // Boshqa har qanday xato (5xx, tarmoq) takrorlansa ham shu bo'ladi.
      if (response.status !== 404) break;
      if (resolvedPath === path) resolvedPath = null;
    }

    throw lastError ?? new ApiError({ code: "NOT_FOUND", status: 404 });
  },

  /** Ommaviy rasm manzili. Muharrirda esa oddiy `/files/:id` ishlatiladi (§5). */
  mediaUrl: (page: Pick<PublicLandingPage, "mediaBaseUrl">, fileId: string) =>
    `${page.mediaBaseUrl}/${fileId}`,

  /**
   * Muharrir uchun tashxis: har bir nomzod manzil nima qaytaradi.
   *
   * «Chop etdim, lekin saytda ko'rinmayapti» eng ko'p uchraydigan shikoyat va
   * uning sababi deyarli har doim sozlamada — tenant kodi yo'q yoki noto'g'ri.
   * Shuni taxmin qildirmay, aniq ko'rsatish kerak.
   */
  async diagnose(
    lang: string,
    /*
      Sinaladigan tenant kodlari. Muharrir AUTENTIFIKATSIYALANGAN, ya'ni u
      qoralamadagi `slug` ni biladi — ommaviy sahifa esa bilmaydi. Shuning
      uchun tashxis shu qo'shimcha nomzodni ham sinaydi: kod topilsa, uni
      `.env` ga ko'chirib yozish kifoya va taxmin qilish kerak bo'lmaydi.
    */
    codes: string[] = [LANDING_TENANT_CODE],
  ): Promise<{ path: string; url: string; status: number; code?: string; blocks?: number }[]> {
    const paths = [
      ...new Set(codes.filter(Boolean).map((code) => `/public/landing/${code}`)),
      "/public/landing",
    ];

    const results = [];
    for (const path of paths) {
      const url = `${API_BASE_URL}${path}${buildQuery({ lang })}`;
      try {
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (response.ok) {
          const page = (await response.json()) as PublicLandingPage;
          results.push({ path, url, status: response.status, blocks: page.blocks?.length ?? 0 });
        } else {
          const error = await readEnvelope(response);
          results.push({ path, url, status: response.status, code: error.code });
        }
      } catch {
        results.push({ path, url, status: 0, code: "NETWORK" });
      }
    }
    return results;
  },
};
