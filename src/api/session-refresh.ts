import { getAccessToken, getSessionGeneration, setAccessToken } from "./token-store";
import { canRefreshIdentity } from "./session-identity";

export const SESSION_TIMEOUT_MS = 10_000;
let active: { generation: number; promise: Promise<boolean> } | null = null;

export function abortedSession(): DOMException {
  return new DOMException("Session cancelled", "AbortError");
}

/** Signal transportdan qat'i nazar kutishni to'xtatadi. */
export function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortedSession());
  return new Promise<T>((resolve, reject) => {
    const cancel = () => reject(abortedSession());
    signal.addEventListener("abort", cancel, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", cancel));
  });
}

/** Bir sessiyadagi parallel 401 javoblari bitta yangilashni kutadi. */
export function refreshSession(baseUrl: string, signal?: AbortSignal): Promise<boolean> {
  const generation = getSessionGeneration();
  const currentToken = getAccessToken();
  if (active?.generation === generation) {
    return signal ? abortable(active.promise, signal) : active.promise;
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(cancel, SESSION_TIMEOUT_MS);
  const promise = (async () => {
    try {
      const response = await abortable(
        fetch(`${baseUrl}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        }),
        controller.signal,
      );
      if (generation !== getSessionGeneration()) throw abortedSession();
      if (response.status === 401 || response.status === 403) return false;
      if (!response.ok) throw new Error("Session refresh unavailable");
      const data = await abortable(
        response.json() as Promise<{ accessToken?: string }>,
        controller.signal,
      );
      if (generation !== getSessionGeneration()) throw abortedSession();
      if (!data.accessToken) throw new Error("Invalid session response");
      if (!canRefreshIdentity(currentToken, data.accessToken)) return false;
      setAccessToken(data.accessToken);
      return true;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", cancel);
      if (active?.generation === generation) active = null;
    }
  })();
  active = { generation, promise };
  return promise;
}
