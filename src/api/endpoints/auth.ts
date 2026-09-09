import { api } from "../http";
import { setAccessToken } from "../token-store";
import type {
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
