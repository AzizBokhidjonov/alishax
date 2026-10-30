const { test } = require("node:test");
const assert = require("node:assert/strict");
const { apiHarness } = require("./load-source.cjs");

test("percent and cash discounts retain their value after create and reload", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  const percent = { id: "percent", kind: "percent", valueBp: 1250, valueTiyin: null };
  const fixed = { id: "fixed", kind: "fixed", valueBp: null, valueTiyin: "9007199254740993" };
  h.reply("post", "/children/child/discounts", percent);
  const created = await h.endpoints.discountsApi.create("child", {
    kind: "percent",
    value: "1250",
    validFrom: "2026-10-30",
    reason: "Sibling",
  });
  h.reply("get", "/children/child/discounts", [percent, fixed, { ...percent, valueBp: 0 }]);
  const rows = await h.endpoints.discountsApi.ofChild("child");
  assert.equal(created.value, "1250");
  assert.equal(rows[0].value, created.value);
  assert.equal(rows[1].value, "9007199254740993");
  assert.equal(rows[2].value, "0");
});

test("a missing discount value fails visibly instead of appearing as zero", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  h.reply("get", "/children/child/discounts", [{ id: "unknown", kind: "fixed", valueTiyin: null }]);
  await assert.rejects(h.endpoints.discountsApi.ofChild("child"), /Invalid discount value/);
});
