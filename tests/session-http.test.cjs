const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadSource } = require("./load-source.cjs");
const jwt = (sub = "A", tid = "tenant", bid = []) =>
  `header.${Buffer.from(JSON.stringify({ sub, tid, bid })).toString("base64url")}.signature`;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const unauthorized = () => json({ error: { code: "TOKEN_EXPIRED" } }, 401);
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};
function harness() {
  const token = loadSource("src/api/token-store.ts");
  const http = loadSource("src/api/http.ts", {
    "src/api/token-store.ts": token,
    "src/api/config.ts": { API_BASE_URL: "https://synthetic.invalid" },
  });
  return { token, ...http };
}

test("old unauthorized response cannot expire a newer session or trigger refresh", async (t) => {
  const h = harness(),
    d = deferred();
  h.token.setAccessToken("A");
  let expired = 0,
    calls = 0;
  h.setUnauthenticatedHandler(() => expired++);
  t.mock.method(globalThis, "fetch", () => {
    calls++;
    return d.promise;
  });
  const p = h.api.get("/children");
  h.token.invalidateSession();
  h.token.setAccessToken("B");
  d.resolve(unauthorized());
  await assert.rejects(p, { name: "AbortError" });
  assert.equal(expired, 0);
  assert.equal(calls, 1);
  assert.equal(h.token.getAccessToken(), "B");
});
test("expired request refreshes once and replays with the new bearer token", async (t) => {
  const h = harness();
  const previous = jwt(),
    next = jwt("A", "tenant", ["new-branch"]);
  h.token.setAccessToken(previous);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push([url, options.headers.get?.("Authorization")]);
    return calls.length === 1
      ? unauthorized()
      : calls.length === 2
        ? json({ accessToken: next })
        : json({ id: "child" });
  });
  assert.deepEqual(await h.api.get("/children"), { id: "child" });
  assert.equal(calls.length, 3);
  assert.match(calls[1][0], /\/auth\/refresh$/);
  assert.equal(calls[0][1], `Bearer ${previous}`);
  assert.equal(calls[2][1], `Bearer ${next}`);
});
test("unauthorized replay clears the token and announces session expiry", async (t) => {
  const h = harness();
  let calls = 0,
    expired = 0;
  h.token.setAccessToken(jwt());
  h.setUnauthenticatedHandler(() => expired++);
  t.mock.method(globalThis, "fetch", async () =>
    ++calls === 2 ? json({ accessToken: jwt() }) : unauthorized(),
  );
  await assert.rejects(h.api.get("/children"), { status: 401 });
  assert.equal(calls, 3);
  assert.equal(h.token.getAccessToken(), null);
  assert.equal(expired, 1);
});

for (const [change, refreshedToken] of [
  ["another user", jwt("B")],
  ["another tenant", jwt("A", "different-tenant")],
  ["unreadable identity", "invalid-token"],
]) {
  test(`shared-cookie refresh returning ${change} cannot replay an existing account action`, async (t) => {
    const h = harness();
    h.token.setAccessToken(jwt());
    let calls = 0,
      expired = 0;
    h.setUnauthenticatedHandler(() => expired++);
    t.mock.method(globalThis, "fetch", async () => {
      calls++;
      return calls === 1 ? unauthorized() : json({ accessToken: refreshedToken });
    });
    await assert.rejects(h.api.post("/attendance/checkin", { childId: "account-A-child" }), {
      status: 401,
    });
    assert.equal(calls, 2, "The original action must not be replayed with a different identity");
    assert.equal(h.token.getAccessToken(), null);
    assert.equal(expired, 1);
  });
}
test("logout never refreshes a rejected token", async (t) => {
  const h = harness();
  h.token.setAccessToken("A");
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return unauthorized();
  });
  const { authApi } = loadSource("src/api/endpoints/auth.ts", {
    "src/api/http.ts": h,
    "src/api/token-store.ts": h.token,
  });
  await assert.rejects(authApi.logout(), { status: 401 });
  assert.equal(calls, 1);
  assert.equal(h.token.getAccessToken(), null);
});
test("late logout acknowledgement cannot clear a new login token", async (t) => {
  const h = harness(),
    d = deferred();
  h.token.setAccessToken("A");
  t.mock.method(globalThis, "fetch", () => d.promise);
  const { authApi } = loadSource("src/api/endpoints/auth.ts", {
    "src/api/http.ts": h,
    "src/api/token-store.ts": h.token,
  });
  const p = authApi.logout();
  h.token.invalidateSession();
  h.token.setAccessToken("B");
  d.resolve(json({ success: true }));
  await assert.rejects(p, { name: "AbortError" });
  assert.equal(h.token.getAccessToken(), "B");
});

for (const cancel of ["account switch", "abort signal"]) {
  test(`a delayed JSON body cannot complete a request after ${cancel}`, async (t) => {
    const h = harness(),
      body = deferred(),
      started = deferred();
    const controller = new AbortController();
    const response = json({});
    response.text = () => {
      started.resolve();
      return body.promise;
    };
    t.mock.method(globalThis, "fetch", async () => response);
    h.token.setAccessToken("A");
    const pending = h.api.get("/children", undefined, { signal: controller.signal });
    await started.promise;
    if (cancel === "account switch") {
      h.token.invalidateSession();
      h.token.setAccessToken("B");
    } else controller.abort();
    body.resolve(JSON.stringify({ id: "old-account-record" }));
    await assert.rejects(pending, { name: "AbortError" });
  });
}

for (const format of ["json", "blob"]) {
  test(`a delayed ${format} export body cannot complete under a newer account`, async (t) => {
    const h = harness(),
      body = deferred(),
      started = deferred();
    const response = new Response("", {
      headers: { "Content-Type": format === "json" ? "application/json" : "application/pdf" },
    });
    response[format] = () => {
      started.resolve();
      return body.promise;
    };
    t.mock.method(globalThis, "fetch", async () => response);
    h.token.setAccessToken("A");
    const pending = h.requestExport("/reports/export");
    await started.promise;
    h.token.invalidateSession();
    h.token.setAccessToken("B");
    body.resolve(format === "json" ? { jobId: "old-job" } : new Blob(["old-file"]));
    await assert.rejects(pending, { name: "AbortError" });
    assert.equal(h.token.getAccessToken(), "B");
  });
}
