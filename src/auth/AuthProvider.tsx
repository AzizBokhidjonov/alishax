import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi, type MeResponse } from "@/api";
import { refreshAccessToken, setUnauthenticatedHandler } from "@/api/http";
import { AuthContext, type AuthContextValue, type AuthStatus } from "./auth-context";

const EMPTY_ME: MeResponse = {
  user: { id: "", fullName: "" },
  branchIds: [],
  roles: [],
  permissions: {},
  permissionsVersion: 0,
};

/**
 * Sessiya: kirish tokeni xotirada, yangilash tokeni httpOnly cookie'da.
 *
 * Yuklanganda bir marta `POST /auth/refresh` yuboriladi — token qaytsa
 * foydalanuvchi allaqachon kirgan, `GET /auth/me` bilan ruxsatlar olinadi.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [me, setMe] = useState<MeResponse>(EMPTY_ME);
  const queryClient = useQueryClient();
  const mounted = useRef(true);

  const applyMe = useCallback((next: MeResponse) => {
    setMe(next);
    setStatus("authenticated");
  }, []);

  const clear = useCallback(() => {
    setMe(EMPTY_ME);
    setStatus("anonymous");
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    mounted.current = true;
    setUnauthenticatedHandler(() => {
      if (mounted.current) clear();
    });
    return () => {
      mounted.current = false;
      setUnauthenticatedHandler(null);
    };
  }, [clear]);

  // Sahifa ochilganda sessiyani tiklash.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const refreshed = await refreshAccessToken();
      if (cancelled) return;
      if (!refreshed) {
        setStatus("anonymous");
        return;
      }
      try {
        const response = await authApi.me();
        if (!cancelled) applyMe(response);
      } catch {
        if (!cancelled) setStatus("anonymous");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyMe]);

  const login = useCallback(
    async (login: string, password: string) => {
      await authApi.login({ login, password });
      const response = await authApi.me();
      applyMe(response);
      return response;
    },
    [applyMe],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clear();
    }
  }, [clear]);

  const refreshMe = useCallback(async () => {
    const response = await authApi.me();
    applyMe(response);
  }, [applyMe]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: status === "authenticated" ? me.user : null,
      roles: me.roles,
      branchIds: me.branchIds,
      permissions: me.permissions,
      permissionsVersion: me.permissionsVersion,
      login,
      logout,
      refreshMe,
    }),
    [status, me, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
