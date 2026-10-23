import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api";
import type { AuthUser, MeResponse, PermissionMap, RoleRef, Scope } from "@/api";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  roles: RoleRef[];
  branchIds: string[];
  permissions: PermissionMap;
  permissionsVersion: number;
  login: (login: string, password: string) => Promise<MeResponse>;
  logout: () => Promise<void>;
  /** Rol/ruxsat o'zgargandan keyin `/auth/me` ni qayta o'qiydi. */
  refreshMe: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth faqat AuthProvider ichida ishlatiladi");
  return context;
}

export function useBootstrapLookups() {
  const { status, user, permissionsVersion } = useAuth();
  return useQuery({
    queryKey: ["auth", "bootstrap", user?.id, permissionsVersion],
    queryFn: () => authApi.bootstrap(),
    enabled: status === "authenticated",
    staleTime: 60 * 1000,
  });
}

export interface PermissionApi {
  /** Ruxsat berilganmi. */
  can: (key: string) => boolean;
  /** Ro'yxatdagilardan kamida bittasi bormi. */
  canAny: (...keys: string[]) => boolean;
  /** Ruxsatning qamrovi (yo'q bo'lsa `undefined`). */
  scopeOf: (key: string) => Scope | undefined;
  /** Foydalanuvchida shu kodli rol bormi — faqat ko'rsatish mantiqi uchun. */
  hasRole: (code: string) => boolean;
}

/** Ruxsat tekshiruvi. Interfeysni ochish/yopish faqat shu orqali. */
export function usePermissions(): PermissionApi {
  const { permissions, roles } = useAuth();

  return useMemo<PermissionApi>(
    () => ({
      can: (key) => Boolean(permissions[key]),
      canAny: (...keys) => keys.some((key) => Boolean(permissions[key])),
      scopeOf: (key) => permissions[key],
      hasRole: (code) => roles.some((role) => role.code === code),
    }),
    [permissions, roles],
  );
}

/** Bitta kalit uchun qisqa yordamchi. */
export function useCan(key: string): boolean {
  const { can } = usePermissions();
  return can(key);
}
