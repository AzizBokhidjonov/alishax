import { api } from "../http";
import { isApiError } from "../error";
import { bootstrapToMe } from "../types";
import { getSessionGeneration, setAccessToken } from "../token-store";
import { abortedSession } from "../session-refresh";
import type {
  BootstrapResponse,
  ChangePasswordDto,
  LoginDto,
  LoginResponse,
  MeResponse,
  ResetPasswordDto,
} from "../types";

export const authApi = {
  async login(dto: LoginDto, signal?: AbortSignal): Promise<LoginResponse> {
    const generation = getSessionGeneration();
    const result = await api.post<LoginResponse>("/auth/login", dto, { signal, skipRefresh: true });
    if (generation !== getSessionGeneration() || signal?.aborted) throw abortedSession();
    setAccessToken(result.accessToken);
    return result;
  },

  me: (signal?: AbortSignal) => api.get<MeResponse>("/auth/me", undefined, { signal }),

  /**
   * Sessiya boshlanishidagi yagona so'rov (§3).
   *
   * Eski o'rnatmada bu endpoint YO'Q bo'lishi mumkin — o'shanda `404` keladi
   * va chaqiruvchi `/auth/me` ga qaytadi (`AuthProvider`). Shu sababli bu
   * yerda hech qanday himoya yo'q: qaror sessiya qatlamida.
   */
  bootstrap: (signal?: AbortSignal) =>
    api.get<BootstrapResponse>("/auth/bootstrap", undefined, { signal }),

  /**
   * Sessiyani tiklash: bootstrap, bo'lmasa `/auth/me`.
   *
   * Nega zaxira kerak: bootstrap backendning yangi relizida paydo bo'ldi va
   * eski o'rnatmada `404` qaytaradi. Shu bitta endpoint yo'qligi uchun butun
   * ilovaning ochilmay qolishi mumkin emas — ruxsatlar `/auth/me` da ham bor.
   * Boshqa xato (401, tarmoq) esa YUTILMAYDI: u haqiqiy muammo.
   */
  async session(signal?: AbortSignal): Promise<MeResponse> {
    try {
      return bootstrapToMe(await authApi.bootstrap(signal));
    } catch (error) {
      if (isApiError(error) && error.status === 404) return authApi.me(signal);
      throw error;
    }
  },

  async logout(): Promise<void> {
    const generation = getSessionGeneration();
    try {
      await api.post<{ success: boolean }>("/auth/logout", undefined, { skipRefresh: true });
    } finally {
      if (generation === getSessionGeneration()) setAccessToken(null);
    }
  },

  changePassword: (dto: ChangePasswordDto) =>
    api.post<{ success: boolean }>("/auth/change-password", dto),

  forgotPassword: (login: string) =>
    api.post<{ success: boolean }>("/auth/forgot-password", { login }),

  resetPassword: (dto: ResetPasswordDto) =>
    api.post<{ success: boolean }>("/auth/reset-password", dto),
};
