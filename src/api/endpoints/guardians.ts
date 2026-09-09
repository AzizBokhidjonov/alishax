import { api, type QueryParams } from "../http";
import { toPage } from "../types";
import type {
  Child,
  CreateGuardianDto,
  Guardian,
  Id,
  ListParams,
  Paginated,
  TelegramBinding,
  TelegramInviteResult,
  UpdateGuardianDto,
} from "../types";

export interface GuardianListParams extends ListParams {
  phone?: string;
}

export const guardiansApi = {
  async list(params: GuardianListParams = {}): Promise<Paginated<Guardian>> {
    const response = await api.get<Paginated<Guardian> | Guardian[]>(
      "/guardians",
      params as QueryParams,
    );
    return toPage(response);
  },

  get: (id: Id) => api.get<Guardian & { children?: Child[] }>(`/guardians/${id}`),
  /**
   * Telefon takrorlansa backend `409 DUPLICATE` va mavjud yozuvni qaytaradi —
   * shuning uchun bu yerda xato ushlanmaydi, chaqiruvchi «bog'lash» oqimiga o'tadi.
   */
  create: (dto: CreateGuardianDto) => api.post<Guardian>("/guardians", dto),
  update: (id: Id, dto: UpdateGuardianDto) => api.patch<Guardian>(`/guardians/${id}`, dto),
  children: (id: Id) => api.get<Child[]>(`/guardians/${id}/children`),

  telegramInvite: (id: Id) => api.post<TelegramInviteResult>(`/guardians/${id}/telegram-invite`),
  telegramBindings: () => api.get<TelegramBinding[]>("/telegram/bindings"),
  telegramUnbound: () => api.get<Guardian[]>("/telegram/unbound"),
};
