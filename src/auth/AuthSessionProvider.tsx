import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi, type MeResponse } from "@/api";
import { refreshAccessToken, setUnauthenticatedHandler } from "@/api/http";
import { getSessionGeneration, invalidateSession } from "@/api/token-store";
import { abortable, abortedSession, SESSION_TIMEOUT_MS } from "@/api/session-refresh";
import { P } from "@/config/permissions";
import { setCheckInQueueScope } from "@/features/attendance/checkin-queue";
import { setPaymentRecoveryScope } from "@/features/finance/payment-recovery-store";
import { AuthContext, type AuthContextValue, type AuthStatus } from "./auth-context";

const EMPTY_ME: MeResponse = {
  user: { id: "", fullName: "" },
  branchIds: [],
  roles: [],
  permissions: {},
  permissionsVersion: 0,
};

function pauseRecovery() {
  setCheckInQueueScope(null, false);
  setPaymentRecoveryScope(null, false);
}

/** Kechikkan javob faqat uni boshlagan, hali amaldagi sessiyaga tegishli. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [me, setMe] = useState<MeResponse>(EMPTY_ME);
  const queryClient = useQueryClient();
  const mounted = useRef(true);
  const controllers = useRef(new Set<AbortController>());
  const phase = useRef<AuthStatus>("loading");
  const refreshSequence = useRef(0);

  const resetSession = useCallback(
    (next: AuthStatus = "anonymous") => {
      const hadSession = phase.current === "authenticated";
      pauseRecovery();
      invalidateSession();
      for (const controller of controllers.current) controller.abort();
      controllers.current.clear();
      refreshSequence.current += 1;
      phase.current = next;
      if (mounted.current) {
        setMe(EMPTY_ME);
        setStatus(next);
      }
      // Anonim ochiq sahifaning yuklanishi sessiya tekshiruvi bilan uzilmasin.
      if (hadSession) queryClient.clear();
    },
    [queryClient],
  );

  const applyMe = useCallback((next: MeResponse, generation: number) => {
    if (!mounted.current || generation !== getSessionGeneration()) throw abortedSession();
    setCheckInQueueScope(next.user.id, Boolean(next.permissions[P.attendanceCheckIn]));
    setPaymentRecoveryScope(next.user.id, Boolean(next.permissions[P.paymentCreate]));
    phase.current = "authenticated";
    setMe(next);
    setStatus("authenticated");
  }, []);

  const run = useCallback(async <T,>(task: (signal: AbortSignal) => Promise<T>): Promise<T> => {
    const controller = new AbortController();
    controllers.current.add(controller);
    const timer = setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS);
    try {
      return await abortable(task(controller.signal), controller.signal);
    } finally {
      clearTimeout(timer);
      controllers.current.delete(controller);
    }
  }, []);

  const retrySession = useCallback(async () => {
    resetSession("loading");
    const generation = getSessionGeneration();
    try {
      const response = await run(async (signal) => {
        if (!(await refreshAccessToken(signal))) return null;
        if (signal.aborted) throw abortedSession();
        return authApi.session(signal);
      });
      if (generation !== getSessionGeneration() || !mounted.current) return;
      if (response) applyMe(response, generation);
      else resetSession();
    } catch {
      if (generation === getSessionGeneration() && mounted.current) resetSession("error");
    }
  }, [applyMe, resetSession, run]);

  useEffect(() => {
    mounted.current = true;
    setUnauthenticatedHandler(() => resetSession());
    void retrySession();
    return () => {
      mounted.current = false;
      setUnauthenticatedHandler(null);
      resetSession();
    };
  }, [resetSession, retrySession]);

  const login = useCallback(
    async (login: string, password: string) => {
      resetSession();
      const generation = getSessionGeneration();
      try {
        const response = await run(async (signal) => {
          await authApi.login({ login, password }, signal);
          if (signal.aborted) throw abortedSession();
          return authApi.session(signal);
        });
        applyMe(response, generation);
        return response;
      } catch (error) {
        if (generation === getSessionGeneration()) resetSession();
        throw error;
      }
    },
    [applyMe, resetSession, run],
  );

  const logout = useCallback(async () => {
    // Navbatlar so'rovdan OLDIN to'xtaydi; so'rov eski Bearer bilan boshlanadi.
    pauseRecovery();
    const pending = authApi.logout();
    resetSession();
    // Tarmoq uzilsa ham mahalliy hisobga kirish yopilgan bo'lib qoladi.
    await pending.catch(() => undefined);
  }, [resetSession]);

  const refreshMe = useCallback(async () => {
    if (phase.current !== "authenticated") return;
    const generation = getSessionGeneration();
    const sequence = ++refreshSequence.current;
    try {
      const response = await run((signal) => authApi.session(signal));
      if (sequence === refreshSequence.current) applyMe(response, generation);
    } catch (error) {
      if (generation === getSessionGeneration()) throw error;
    }
  }, [applyMe, run]);

  const cancelSession = useCallback(() => resetSession(), [resetSession]);
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
      retrySession,
      cancelSession,
    }),
    [status, me, login, logout, refreshMe, retrySession, cancelSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
