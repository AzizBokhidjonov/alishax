const { test } = require("node:test");
const assert = require("node:assert/strict");
const { apiHarness, loadSource } = require("./load-source.cjs");

test("charge lists preserve names, period, issue date and exact allocated money", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  const charge = {
    id: "charge",
    childId: "child",
    amountTiyin: "9007199254740999",
    allocatedTiyin: "9007199254740993",
    outstandingTiyin: "6",
    issuedAt: "2026-10-24T03:00:00Z",
    child: { firstName: "Test", lastName: "Child" },
    accountingPeriod: { year: 2026, month: 10 },
  };
  h.reply("get", "/charges", [charge]);
  h.reply("get", "/children/child/charges", [charge]);
  for (const result of [
    (await h.endpoints.chargesApi.list()).data[0],
    (await h.endpoints.chargesApi.ofChild("child"))[0],
  ]) {
    assert.equal(result.childName, "Child Test");
    assert.equal(result.paidTiyin, "9007199254740993");
    assert.equal(result.createdAt, charge.issuedAt);
    assert.deepEqual(result.period, { year: 2026, month: 10 });
  }
});

test("canceled original payments cannot be canceled again and reversals reduce totals", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  const original = {
    id: "payment",
    childId: "child",
    amountTiyin: "9007199254740993",
    method: "cash",
    paidAt: "2026-10-24T03:00:00Z",
    sign: 1,
    otherPayment: [{ id: "reversal" }],
    recordedByName: "Cashier",
  };
  h.reply("get", "/payments", [
    original,
    { ...original, id: "reversal", sign: -1, otherPayment: [] },
  ]);
  const result = (await h.endpoints.paymentsApi.list()).data;
  assert.equal(result[0].isCancelled, true);
  assert.equal(result[0].recordedByName, "Cashier");
  const { paymentSignedAmount } = loadSource("src/api/adapters/payments.ts");
  assert.equal(paymentSignedAmount(result[1]), "-9007199254740993");
  assert.equal(BigInt(paymentSignedAmount(result[0])) + BigInt(paymentSignedAmount(result[1])), 0n);
});
