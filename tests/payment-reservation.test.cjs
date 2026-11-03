const { test } = require("node:test");
const assert = require("node:assert/strict");
require("./dom.cjs");
require("./payment-locks.cjs");
const { loadSource } = require("./load-source.cjs");
const entry = "src/features/finance/payment-recovery-store.ts";
const mocks = { "src/api/http.ts": { API_BASE_URL: "fixture-lock" } };
const dto = { childId: "a", amountTiyin: "12345", method: "cash", paidAt: "2026-11-03T05:00:00Z" };

test("two contexts competing for one account never overwrite the unresolved operation", async () => {
  window.localStorage.clear();
  const tabA = loadSource(entry, mocks),
    tabB = loadSource(entry, mocks);
  tabA.setPaymentRecoveryScope("user", true);
  tabB.setPaymentRecoveryScope("user", true);
  const result = await Promise.allSettled([
    tabA.reservePaymentRecovery(dto, "A", "", {}),
    tabB.reservePaymentRecovery({ ...dto, amountTiyin: "99999" }, "B", "", {}),
  ]);
  assert.equal(result[0].status, "fulfilled");
  assert.equal(result[1].status, "rejected");
  assert.equal(tabB.originalPayment(result[0].value).dto.amountTiyin, "12345");
  assert.equal(window.localStorage.length, 1);
});

test("account switch while reservation waits cannot write old data into the new account", async () => {
  window.localStorage.clear();
  const store = loadSource(entry, mocks);
  store.setPaymentRecoveryScope("a", true);
  const pending = store.reservePaymentRecovery(dto, "A", "", {});
  store.setPaymentRecoveryScope("b", true);
  await assert.rejects(pending);
  assert.equal(window.localStorage.length, 0);
  store.setPaymentRecoveryScope("a", true);
  const staleSession = store.reservePaymentRecovery(dto, "A", "", {});
  store.setPaymentRecoveryScope(null, false);
  store.setPaymentRecoveryScope("a", true);
  await assert.rejects(staleSession);
  assert.equal(window.localStorage.length, 0);
});

test("without Web Locks no unsafe reservation is created", async () => {
  window.localStorage.clear();
  const store = loadSource(entry, mocks),
    locks = navigator.locks;
  store.setPaymentRecoveryScope("a", true);
  Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
  try {
    await assert.rejects(store.reservePaymentRecovery(dto, "A", "", {}));
    assert.equal(window.localStorage.length, 0);
  } finally {
    Object.defineProperty(navigator, "locks", { configurable: true, value: locks });
  }
});

test("a concurrent retry prevents first-response validation from clearing an unresolved operation", async () => {
  window.localStorage.clear();
  const a = loadSource(entry, mocks),
    b = loadSource(entry, mocks);
  a.setPaymentRecoveryScope("user", true);
  b.setPaymentRecoveryScope("user", true);
  const record = await a.reservePaymentRecovery(dto, "A", "", {});
  const first = await a.claimPaymentAttempt(record),
    second = await b.claimPaymentAttempt(record);
  assert.deepEqual(first, second);
  await a.rejectInitialPaymentRecovery(record);
  assert.deepEqual(a.originalPayment(record), {
    dto: first.dto,
    idempotencyKey: first.idempotencyKey,
  });
  await a.completePaymentRecovery(record);
  const next = await a.reservePaymentRecovery(dto, "A", "", {});
  await a.claimPaymentAttempt(next);
  await a.rejectInitialPaymentRecovery(next);
  assert.equal(window.localStorage.length, 0);
});
