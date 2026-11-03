const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadSource } = require("./load-source.cjs");
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};
const response = (token) =>
  new Response(JSON.stringify({ accessToken: token }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
function harness() {
  const token = loadSource("src/api/token-store.ts");
  return {
    token,
    ...loadSource("src/api/session-refresh.ts", { "src/api/token-store.ts": token }),
  };
}

test("concurrent refreshes share one transport request for the current session", async (t) => {
  const h = harness(),
    d = deferred();
  let calls = 0;
  t.mock.method(globalThis, "fetch", () => {
    calls++;
    return d.promise;
  });
  const a = h.refreshSession("https://synthetic.invalid"),
    b = h.refreshSession("https://synthetic.invalid");
  d.resolve(response("A"));
  assert.deepEqual(await Promise.all([a, b]), [true, true]);
  assert.equal(calls, 1);
  assert.equal(h.token.getAccessToken(), "A");
});
test("late token refresh cannot restore an invalidated session", async (t) => {
  const h = harness(),
    d = deferred();
  t.mock.method(globalThis, "fetch", () => d.promise);
  const pending = h.refreshSession("https://synthetic.invalid");
  h.token.invalidateSession();
  d.resolve(response("old"));
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(h.token.getAccessToken(), null);
});
test("a newer session refresh is independent and retains its token after older completion", async (t) => {
  const h = harness(),
    old = deferred(),
    newer = deferred();
  let calls = 0;
  t.mock.method(globalThis, "fetch", () => (++calls === 1 ? old.promise : newer.promise));
  const a = h.refreshSession("https://synthetic.invalid");
  h.token.invalidateSession();
  const b = h.refreshSession("https://synthetic.invalid");
  newer.resolve(response("B"));
  await b;
  old.resolve(response("A"));
  await assert.rejects(a, { name: "AbortError" });
  assert.equal(h.token.getAccessToken(), "B");
});
test("cancel aborts the transport and leaves no token", async (t) => {
  const h = harness(),
    d = deferred();
  let signal;
  t.mock.method(globalThis, "fetch", (_url, options) => {
    signal = options.signal;
    return d.promise;
  });
  const c = new AbortController(),
    p = h.refreshSession("https://synthetic.invalid", c.signal);
  c.abort();
  await assert.rejects(p, { name: "AbortError" });
  assert.equal(signal.aborted, true);
  d.resolve(response("late"));
  assert.equal(h.token.getAccessToken(), null);
});
test("refresh deadline is 10 seconds and aborts a nonresponsive transport", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const h = harness();
  let signal;
  t.mock.method(globalThis, "fetch", (_url, options) => {
    signal = options.signal;
    return new Promise(() => {});
  });
  const p = h.refreshSession("https://synthetic.invalid");
  t.mock.timers.tick(9999);
  assert.equal(signal.aborted, false);
  t.mock.timers.tick(1);
  await assert.rejects(p, { name: "AbortError" });
  assert.equal(signal.aborted, true);
  assert.equal(h.SESSION_TIMEOUT_MS, 10000);
});
test("401 means anonymous while network and server failures remain retryable errors", async (t) => {
  const h = harness();
  const mock = t.mock.method(globalThis, "fetch", async () => new Response("", { status: 401 }));
  assert.equal(await h.refreshSession("https://synthetic.invalid"), false);
  mock.mock.mockImplementation(async () => new Response("", { status: 503 }));
  await assert.rejects(h.refreshSession("https://synthetic.invalid"));
  mock.mock.mockImplementation(async () => {
    throw new TypeError("offline");
  });
  await assert.rejects(h.refreshSession("https://synthetic.invalid"), { name: "TypeError" });
});
test("login endpoint cannot install a token after session invalidation", async () => {
  const h = harness(),
    d = deferred();
  const { authApi } = loadSource("src/api/endpoints/auth.ts", {
    "src/api/token-store.ts": h.token,
    "src/api/http.ts": { api: { post: () => d.promise } },
  });
  const p = authApi.login({ login: "A", password: "synthetic" });
  h.token.invalidateSession();
  d.resolve({ accessToken: "late" });
  await assert.rejects(p, { name: "AbortError" });
  assert.equal(h.token.getAccessToken(), null);
});
