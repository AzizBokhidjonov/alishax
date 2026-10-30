const { test } = require("node:test");
const assert = require("node:assert/strict");
const { apiHarness, loadSource } = require("./load-source.cjs");
const { formatTiyin, toBigInt } = loadSource("src/lib/money.ts");

const ageing = { notOverdue: "50000000", d1_7: "100000000", d8_30: "0", d30plus: "0" };
const debt = {
  childId: "child",
  currentChargeTiyin: "200000000",
  previousDebtTiyin: "0",
  totalPaidTiyin: "50000000",
  advanceBalanceTiyin: "0",
  currentDebtTiyin: "150000000",
  overdueAmountTiyin: "100000000",
  ageing,
};
const line = {
  childId: "child",
  childName: "Test Child",
  tariffId: "tariff",
  tariffName: "Tuition",
  kind: "tuition",
  amountTiyin: "150000000",
  trace: [{ step: "base", amount: "150000000" }],
};

test("child debt displays real money and enables the reminder condition", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  h.reply("get", "/debts/child", debt);
  const result = await h.endpoints.debtsApi.ofChild("child");
  assert.equal(formatTiyin(result.currentDebt), "1 500 000,00");
  assert.ok(toBigInt(result.currentDebt) > 0n);
  assert.equal(result.totalPaid, "50000000");
  assert.equal(result.overdueAmount, "100000000");
  assert.deepEqual(result.ageing, ageing);
});

test("missing debt amount rejects the response instead of displaying a false zero", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  h.reply("get", "/debts/child", { ...debt, currentDebtTiyin: undefined });
  await assert.rejects(h.endpoints.debtsApi.ofChild("child"));
});

test("debt list retains metadata, names, negative balances and advances", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  const meta = { page: 2, limit: 20, total: 21, pages: 2 };
  h.reply("get", "/debts", {
    meta,
    data: [
      {
        childId: "child",
        firstName: "Test",
        lastName: "Child",
        debtTiyin: "-25001",
        advanceTiyin: "25001",
      },
    ],
  });
  const result = await h.endpoints.debtsApi.list({ page: 2 });
  assert.deepEqual(result.meta, meta);
  assert.equal(result.data[0].childName, "Child Test");
  assert.equal(result.data[0].currentDebt, "-25001");
  assert.equal(result.data[0].advanceBalance, "25001");
  assert.equal(result.data[0].overdueAmount, undefined);
});

test("debt summary sums tiyin exactly, including ungrouped children", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  h.reply("get", "/debts/summary", {
    byGroup: [
      { groupId: "group", groupName: "Group", totalDebtTiyin: "9007199254740993" },
      { groupId: null, groupName: null, totalDebtTiyin: "8" },
    ],
    ageing,
  });
  const result = await h.endpoints.debtsApi.summary();
  assert.equal(result.totalDebt, "9007199254741001");
  assert.equal(result.byGroup[1].groupId, null);
  assert.deepEqual(result.byAgeing, ageing);
});

test("empty debt summary remains zero", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  h.reply("get", "/debts/summary", { byGroup: [], ageing });
  assert.equal((await h.endpoints.debtsApi.summary()).totalDebt, "0");
});

test("payment detail exposes allocations and the exact unallocated balance", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  h.reply("get", "/payments/payment", {
    id: "payment",
    childId: "child",
    amountTiyin: "200000001",
    sign: 1,
    method: "cash",
    paidAt: "2026-10-23T03:00:00Z",
    paymentAllocation: [
      {
        chargeId: "charge",
        amountTiyin: "150000000",
        charge: { description: "October tuition", kind: "monthly_fixed" },
      },
    ],
  });
  const result = await h.endpoints.paymentsApi.get("payment");
  assert.deepEqual(result.allocations, [
    {
      chargeId: "charge",
      amountTiyin: "150000000",
      chargeDescription: "October tuition",
      chargeKind: "monthly_fixed",
    },
  ]);
  assert.equal(result.advanceTiyin, "50000001");
});

test("payment list does not invent an advance when allocations were not included", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  h.reply("get", "/payments", [
    {
      id: "payment",
      childId: "child",
      amountTiyin: "100",
      method: "cash",
      paidAt: "2026-10-23T03:00:00Z",
      child: { firstName: "Test", lastName: "Child" },
      guardian: { fullName: "Parent" },
    },
  ]);
  const result = (await h.endpoints.paymentsApi.list()).data[0];
  assert.equal(result.childName, "Child Test");
  assert.equal(result.payerName, "Parent");
  assert.equal(result.advanceTiyin, undefined);
});

test("preview explains every tariff and committed runs use calculationTrace", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  h.reply("get", "/billing-runs/run/explain/child", [
    line,
    {
      ...line,
      id: "charge",
      kind: "meal",
      tariffName: undefined,
      trace: undefined,
      amountTiyin: "30000000",
      calculationTrace: [{ step: "meal", amount: "30000000" }],
    },
  ]);
  const result = await h.endpoints.billingApi.explain("run", "child");
  assert.equal(result.length, 2);
  assert.equal(result[0].trace[0].step, "base");
  assert.equal(result[1].trace[0].step, "meal");
  assert.equal(result[1].amountTiyin, "30000000");
});

test("saved runs recover period, unique child count and preview lines", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  const response = {
    id: "run",
    status: "preview",
    accountingPeriod: { year: 2026, month: 9 },
    childCount: 1,
    totalTiyin: "180000000",
    previewData: [line, { ...line, kind: "meal" }],
  };
  h.reply("get", "/billing-runs", [response]);
  h.reply("get", "/billing-runs/run", response);
  const saved = (await h.endpoints.billingApi.runs()).data[0];
  const resumed = await h.endpoints.billingApi.run("run");
  assert.deepEqual(saved, resumed);
  assert.equal(resumed.month, 9);
  assert.equal(resumed.year, 2026);
  assert.equal(resumed.childrenCount, 1);
  assert.equal(resumed.lines.length, 2);
});

test("new previews use the requested period and commit retains idempotency", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  h.reply("post", "/billing-runs", { id: "run", status: "preview", childCount: 1, lines: [line] });
  const result = await h.endpoints.billingApi.preview(2026, 9);
  assert.equal(result.month, 9);
  h.reply("post", "/billing-runs/run/commit", {
    id: "run",
    status: "committed",
    childCount: 1,
    accountingPeriod: { year: 2026, month: 9 },
    charges: [{ ...line, amountTiyin: "100000000" }],
  });
  const committed = await h.endpoints.billingApi.commit("run", "stable-key");
  assert.equal(committed.lines[0].amountTiyin, "100000000");
  assert.deepEqual(h.calls.at(-1).args, [undefined, { idempotencyKey: "stable-key" }]);
});
