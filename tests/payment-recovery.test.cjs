const { test } = require("node:test");
const assert = require("node:assert/strict");
const { React, mount } = require("./dom.cjs");
require("./payment-locks.cjs");
const { loadSource } = require("./load-source.cjs");
const entry = "src/features/finance/payment-recovery-store.ts";
const mocks = { "src/api/http.ts": { API_BASE_URL: "fixture-recovery" } };
const dto = {
  childId: "child-a",
  amountTiyin: "9007199254740993",
  method: "cash",
  paidAt: "2026-11-03T05:00:00.000Z",
  allocations: [{ chargeId: "charge-a", amountTiyin: "10001" }],
};

test("unresolved original survives fresh module/reload with exact integer amount and key", async () => {
  window.localStorage.clear();
  const first = loadSource(entry, mocks);
  first.setPaymentRecoveryScope("account-a", true);
  const record = await first.reservePaymentRecovery(dto, "Test Child", "", {
    "charge-a": "October · charge-a",
  });
  record.dto.amountTiyin = "1";
  const fresh = loadSource(entry, mocks);
  fresh.setPaymentRecoveryScope("account-a", true);
  assert.deepEqual(fresh.originalPayment(record), { dto, idempotencyKey: record.key });
  await assert.rejects(() =>
    fresh.reservePaymentRecovery({ ...dto, amountTiyin: "999" }, "", "", {}),
  );
  assert.deepEqual(fresh.originalPayment(record).dto, dto);
});

test("logout, another account, and permission revocation prevent replay and isolate pending records", async () => {
  window.localStorage.clear();
  const store = loadSource(entry, mocks);
  store.setPaymentRecoveryScope("a", true);
  const original = await store.reservePaymentRecovery(dto, "A", "", {});
  store.setPaymentRecoveryScope(null, false);
  assert.throws(() => store.originalPayment(original));
  store.setPaymentRecoveryScope("b", true);
  assert.throws(() => store.originalPayment(original));
  const other = await store.reservePaymentRecovery({ ...dto, childId: "child-b" }, "B", "", {});
  await store.completePaymentRecovery(original);
  assert.equal(store.originalPayment(other).dto.childId, "child-b");
  store.setPaymentRecoveryScope("a", false);
  assert.throws(() => store.originalPayment(original));
  store.setPaymentRecoveryScope("a", true);
  assert.deepEqual(store.originalPayment(original).dto, dto);
});

test("corrupt or unavailable durable storage fails before an operation can be sent", async () => {
  window.localStorage.clear();
  const store = loadSource(entry, mocks);
  store.setPaymentRecoveryScope("a", true);
  const proto = Object.getPrototypeOf(window.localStorage),
    old = proto.setItem;
  proto.setItem = () => {
    throw new Error("quota");
  };
  try {
    await assert.rejects(() => store.reservePaymentRecovery(dto, "", "", {}));
  } finally {
    proto.setItem = old;
  }
  store.setPaymentRecoveryScope("a", true);
  const record = await store.reservePaymentRecovery(dto, "", "", {});
  const key = window.localStorage.key(0);
  window.localStorage.setItem(key, "corrupt");
  const reloaded = loadSource(entry, mocks);
  reloaded.setPaymentRecoveryScope("a", true);
  assert.throws(() => reloaded.originalPayment(record));
  await assert.rejects(() => reloaded.reservePaymentRecovery(dto, "", "", {}));
  assert.equal(window.localStorage.getItem(key), "corrupt");
});

test("only completion clears the matching operation and permits a new key", async () => {
  window.localStorage.clear();
  const store = loadSource(entry, mocks);
  store.setPaymentRecoveryScope("a", true);
  const first = await store.reservePaymentRecovery(dto, "", "", {});
  await store.completePaymentRecovery({ ...first, key: "stale" });
  assert.equal(store.originalPayment(first).idempotencyKey, first.key);
  await store.completePaymentRecovery(first);
  assert.equal(window.localStorage.length, 0);
  const second = await store.reservePaymentRecovery(dto, "", "", {});
  assert.notEqual(first.key, second.key);
});

test("review associates each charge with its exact allocation and shows exact total and advance", async () => {
  const { PaymentReview } = loadSource("src/features/finance/components/PaymentReview.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "src/components/common/Money.tsx": {
      Money: ({ value }) => React.createElement("span", null, value),
    },
  });
  const view = await mount(PaymentReview, {
    values: {
      childId: "c",
      amountSom: "90071992547409.93",
      method: "cash",
      paidAt: "2026-11-03T10:00",
    },
    childName: "Test Child",
    payerName: "Test Payer",
    manual: true,
    allocations: [
      { chargeId: "a", amountTiyin: "10001" },
      { chargeId: "b", amountTiyin: "20002" },
    ],
    chargeLabels: { a: "October · a", b: "November · b" },
  });
  try {
    const allocation = view.container.querySelector('[aria-label="recovery.allocationReview"]');
    const rows = [...allocation.children].map((row) => [
      row.querySelector("dt").textContent,
      row.querySelector("dd").textContent,
    ]);
    assert.deepEqual(rows, [
      ["October · a", "10001"],
      ["November · b", "20002"],
      ["payments.form.allocated", "30003"],
      ["payments.form.toAdvance", "9007199254710990"],
    ]);
  } finally {
    await view.close();
  }
});
