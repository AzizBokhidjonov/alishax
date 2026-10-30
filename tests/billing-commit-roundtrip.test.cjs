const { test } = require("node:test");
const assert = require("node:assert/strict");
const { apiHarness } = require("./load-source.cjs");

test("commit retains run identity and status while restoring saved child names", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  h.reply("post", "/billing-runs/run/commit", {
    id: "run",
    status: "committed",
    childCount: 1,
    accountingPeriod: { id: "period", status: "open", year: 2026, month: 10 },
    previewData: [
      {
        childId: "child",
        kind: "monthly_fixed",
        childName: "Malika Sinov",
        tariffName: "Tuition",
        amountTiyin: "10000",
      },
    ],
    charges: [{ id: "charge", childId: "child", kind: "monthly_fixed", amountTiyin: "8750" }],
  });
  const run = await h.endpoints.billingApi.commit("run", "retry-key");
  assert.equal(run.id, "run");
  assert.equal(run.status, "committed");
  assert.equal(run.year, 2026);
  assert.equal(run.month, 10);
  assert.equal(run.lines[0].childName, "Malika Sinov");
  assert.equal(run.lines[0].tariffName, "Tuition");
  assert.equal(run.lines[0].amountTiyin, "8750");
  assert.equal(run.totalTiyin, "8750");
});

test("billing notes translate service types and attendance without changing tariff names", () => {
  const { loadSource } = require("./load-source.cjs");
  const { billingTraceNote } = loadSource("src/lib/billing-labels.ts");
  const t = (key, options) =>
    key === "flows.traceDays" ? options.count + " / " + options.total + " kun" : key;
  assert.equal(billingTraceNote("Kamalak: 1/22 days", "monthly_fixed", t), "Kamalak: 1 / 22 kun");
  assert.equal(
    billingTraceNote("Kamalak: monthly_fixed", "monthly_fixed", t),
    "Kamalak: flows.chargeKinds.monthly_fixed",
  );
  assert.equal(billingTraceNote("Custom tariff note", "monthly_fixed", t), "Custom tariff note");
});
