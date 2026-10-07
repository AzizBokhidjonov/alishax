import { api } from "../http";
import { isApiError } from "../error";
import { bootstrapToMe } from "../types";
import { setAccessToken } from "../token-store";
import type {
  BootstrapResponse,
  ChangePasswordDto,
  LoginDto,
  LoginResponse,
  MeResponse,
  ResetPasswordDto,
} from "../types";

export const authApi = {
  async login(dto: LoginDto): Promise<LoginResponse> {
    const result = await api.post<LoginResponse>("/auth/login", dto);
    setAccessToken(result.accessToken);
    return result;
  },

  me: () => api.get<MeResponse>("/auth/me"),

  /**
   * Sessiya boshlanishidagi yagona so'rov (§3).
   *
   * Eski o'rnatmada bu endpoint YO'Q bo'lishi mumkin — o'shanda `404` keladi
   * va chaqiruvchi `/auth/me` ga qaytadi (`AuthProvider`). Shu sababli bu
   * yerda hech qanday himoya yo'q: qaror sessiya qatlamida.
   */
  bootstrap: () => api.get<BootstrapResponse>("/auth/bootstrap"),

  /**
   * Sessiyani tiklash: bootstrap, bo'lmasa `/auth/me`.
   *
   * Nega zaxira kerak: bootstrap backendning yangi relizida paydo bo'ldi va
   * eski o'rnatmada `404` qaytaradi. Shu bitta endpoint yo'qligi uchun butun
   * ilovaning ochilmay qolishi mumkin emas — ruxsatlar `/auth/me` da ham bor.
   * Boshqa xato (401, tarmoq) esa YUTILMAYDI: u haqiqiy muammo.
   */
  async session(): Promise<MeResponse> {
    try {
      return bootstrapToMe(await authApi.bootstrap());
    } catch (error) {
      if (isApiError(error) && error.status === 404) return authApi.me();
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post<{ success: boolean }>("/auth/logout");
    } finally {
      setAccessToken(null);
    }
  },

  changePassword: (dto: ChangePasswordDto) =>
    api.post<{ success: boolean }>("/auth/change-password", dto),

  forgotPassword: (login: string) =>
    api.post<{ success: boolean }>("/auth/forgot-password", { login }),

  resetPassword: (dto: ResetPasswordDto) =>
    api.post<{ success: boolean }>("/auth/reset-password", dto),
};
