const { test } = require("node:test");
const assert = require("node:assert/strict");
require("./dom.cjs");
require("./payment-locks.cjs");
const { loadSource } = require("./load-source.cjs");

test("payment mutation rechecks the claimed identity after scheduling and sends only stored DTO", async () => {
  window.localStorage.clear();
  const store = loadSource("src/features/finance/payment-recovery-store.ts", {
    "src/api/http.ts": { API_BASE_URL: "mutation-scope-fixture" },
  });
  const calls = [];
  const { useCreatePayment } = loadSource("src/features/finance/api-ledger.ts", {
    "src/features/finance/payment-recovery-store.ts": store,
    "src/api/index.ts": {
      paymentsApi: {
        create: (...args) => {
          calls.push(args);
          return Promise.resolve({ id: "p" });
        },
      },
    },
    "src/lib/query.ts": { useApiMutation: (options) => options, qk: {} },
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
  });
  const mutation = useCreatePayment();
  const dto = {
    childId: "a",
    amountTiyin: "10001",
    method: "cash",
    paidAt: "2026-11-03T05:00:00Z",
  };
  store.setPaymentRecoveryScope("a", true);
  const record = await store.reservePaymentRecovery(dto, "A", "", {});
  const attempt = await store.claimPaymentAttempt(record);
  store.setPaymentRecoveryScope(null, false);
  store.setPaymentRecoveryScope("b", true);
  assert.throws(() => mutation.mutationFn(attempt));
  assert.equal(calls.length, 0);
  store.setPaymentRecoveryScope("a", true);
  assert.throws(() => mutation.mutationFn(attempt), "same account after logout is a new session");
  assert.equal(calls.length, 0);
  const fresh = await store.claimPaymentAttempt(record);
  fresh.dto.amountTiyin = "1";
  await mutation.mutationFn(fresh);
  assert.deepEqual(
    calls,
    [[dto, record.key]],
    "mutation reads immutable stored payload immediately before API forwarding",
  );
});
