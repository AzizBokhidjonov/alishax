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
export const publicLandingApi = {
  async page(lang: string, tenantCode = LANDING_TENANT_CODE): Promise<PublicLandingPage> {
    const path = tenantCode ? `/public/landing/${tenantCode}` : "/public/landing";
    const response = await fetch(`${API_BASE_URL}${path}${buildQuery({ lang })}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      let envelope: Partial<ErrorEnvelope> = {};
      try {
        envelope = (await response.json()) as Partial<ErrorEnvelope>;
      } catch {
        // Javob JSON emas — holat kodidan zaxira kod olinadi.
      }
      throw new ApiError({
        code: envelope.error?.code ?? fallbackCode(response.status),
        status: response.status,
        message: envelope.error?.message,
        traceId: envelope.error?.traceId,
      });
    }

    return (await response.json()) as PublicLandingPage;
  },

  /** Ommaviy rasm manzili. Muharrirda esa oddiy `/files/:id` ishlatiladi (§5). */
  mediaUrl: (page: Pick<PublicLandingPage, "mediaBaseUrl">, fileId: string) =>
    `${page.mediaBaseUrl}/${fileId}`,
};
