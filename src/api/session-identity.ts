interface TokenIdentity {
  sub: string;
  tid: string;
}

/** Bu tekshiruv JWT imzosini tekshirmaydi — hisoblar aralashishini to'xtatadi. */
function identity(token: string): TokenIdentity | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    if (typeof claims !== "object" || claims === null) return null;
    const { sub, tid } = claims as Record<string, unknown>;
    return typeof sub === "string" && sub.length > 0 && typeof tid === "string" && tid.length > 0
      ? { sub, tid }
      : null;
  } catch {
    return null;
  }
}

/** Boshqa tabdagi cookie o'zgarsa eski hisob amali yangi hisob bilan takrorlanmasin. */
export function canRefreshIdentity(currentToken: string | null, nextToken: string): boolean {
  if (currentToken === null) return true;
  const current = identity(currentToken);
  const next = identity(nextToken);
  return Boolean(current && next && current.sub === next.sub && current.tid === next.tid);
}
