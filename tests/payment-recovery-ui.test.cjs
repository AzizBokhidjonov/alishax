const { test } = require("node:test");
const assert = require("node:assert/strict");
const { React } = require("./dom.cjs");
const { paymentHarness, ApiError } = require("./payment-recovery-harness.cjs");

test("a confirmed initial 422 preserves editable input and the next reviewed attempt gets a new key", async () => {
  const calls = [];
  const h = await paymentHarness(async (payload) => {
    calls.push(payload);
    if (calls.length === 1)
      throw new ApiError({ status: 422, code: "VALIDATION_FAILED", details: { note: "invalid" } });
  });
  try {
    await h.open();
    await h.amount("100.01");
    await h.act();
    await h.act();
    assert.equal(window.localStorage.length, 0);
    assert.equal(h.dialog().submitLabel, "flows.review");
    assert.equal(h.view.container.querySelector("input").value, "100.01");
    await h.amount("200.02");
    await h.act();
    await h.act();
    assert.equal(calls.length, 2);
    assert.notEqual(calls[0].idempotencyKey, calls[1].idempotencyKey);
    assert.equal(calls[1].dto.amountTiyin, "20002");
  } finally {
    await h.view.close();
  }
});

test("422 after an uncertain response never unlocks editing or rotates the original key", async () => {
  const calls = [];
  const h = await paymentHarness(async (payload) => {
    calls.push(payload);
    if (calls.length === 1) throw new Error("lost response");
    throw new ApiError({ status: 422, code: "VALIDATION_FAILED" });
  });
  try {
    await h.open();
    await h.amount("100.01");
    await h.act();
    await h.act();
    await h.act();
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], calls[1]);
    assert.equal(h.dialog().submitLabel, "recovery.retryPayment");
    assert.equal(h.view.container.querySelector("input"), null);
    assert.equal(window.localStorage.length, 1);
  } finally {
    await h.view.close();
  }
});

test("reload restores immutable review; pending retry ignores duplicate submit and dismissal", async () => {
  const calls = [];
  const original = await paymentHarness(async (payload) => {
    calls.push(payload);
    throw new Error("timeout");
  });
  await original.open();
  await original.amount("105.09");
  await original.act();
  await original.act();
  await original.view.close();
  let resolve;
  const h = await paymentHarness(
    (payload) => {
      calls.push(payload);
      return new Promise((done) => {
        resolve = done;
      });
    },
    { reset: false },
  );
  try {
    await h.open();
    assert.equal(h.dialog().submitLabel, "recovery.retryPayment");
    assert.equal(h.view.container.querySelector("input"), null);
    await React.act(async () => {
      h.dialog().onSubmit();
      h.dialog().onSubmit();
    });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], calls[1]);
    await React.act(async () => h.dialog().onOpenChange(false));
    assert.equal(h.dialog().open, true);
    await React.act(async () => resolve({ id: "payment-a" }));
    assert.equal(h.dialog().open, false);
    assert.equal(window.localStorage.length, 0);
  } finally {
    await h.view.close();
  }
});

test("account switch removes previous-account draft and recovery content from the dialog", async () => {
  const h = await paymentHarness(async () => {
    throw new Error("timeout");
  });
  try {
    await h.open();
    await h.amount("100.01");
    await h.act();
    await h.act();
    assert.match(h.view.container.textContent, /recovery.paymentPending/);
    await React.act(async () => h.recovery.setPaymentRecoveryScope(null, false));
    assert.equal(h.dialog().open, false);
    assert.equal(h.view.container.textContent, "");
    await React.act(async () => h.recovery.setPaymentRecoveryScope("b", true));
    await h.open();
    assert.equal(h.view.container.querySelector("input").value, "");
    assert.doesNotMatch(h.view.container.textContent, /recovery.paymentPending/);
    await React.act(async () => h.recovery.setPaymentRecoveryScope("a", true));
    await h.open();
    assert.match(h.view.container.textContent, /recovery.paymentPending/);
    assert.equal(h.view.container.querySelector("input"), null);
  } finally {
    await h.view.close();
  }
});

test("a rejected browser lock shows recovery failure and sends no financial request", async () => {
  let sends = 0;
  const h = await paymentHarness(async () => {
    sends++;
  });
  const locks = navigator.locks;
  try {
    await h.open();
    await h.amount("100.01");
    await h.act();
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: {
        request: () => Promise.reject(new Error("Lock service unavailable")),
      },
    });
    await h.act();
    assert.equal(sends, 0);
    assert.match(h.view.container.textContent, /recovery.storageError/);
    assert.equal(h.dialog().canSubmit, false);
  } finally {
    Object.defineProperty(navigator, "locks", { configurable: true, value: locks });
    await h.view.close();
  }
});
