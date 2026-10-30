const { test } = require("node:test");
const assert = require("node:assert/strict");
const { QueryClient } = require("@tanstack/react-query");
const { loadSource } = require("./load-source.cjs");

test("finance mutations invalidate cached child charges and ledger", async () => {
  const qk = loadSource("src/lib/query.ts", { "src/lib/errors.ts": {} }).qk;
  const client = new QueryClient();
  const hooks = loadSource("src/features/finance/api-ledger.ts", {
    "src/api/index.ts": {},
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "src/lib/query.ts": { qk, useApiMutation: (options) => options },
  });
  try {
    for (const name of [
      "useCreatePayment",
      "useCancelPayment",
      "useCreateManualCharge",
      "useReverseCharge",
      "useCreateAdjustment",
      "useRecalculateChildBilling",
    ]) {
      client.setQueryData(qk.childCharges("child"), [{ remainingTiyin: "10000" }]);
      client.setQueryData(["charge-ledger", "child", {}], []);
      for (const key of hooks[name]("child").invalidate)
        await client.invalidateQueries({ queryKey: key });
      assert.equal(client.getQueryState(qk.childCharges("child")).isInvalidated, true, name);
      if (!["useCreatePayment", "useCancelPayment"].includes(name))
        assert.equal(
          client.getQueryState(["charge-ledger", "child", {}]).isInvalidated,
          true,
          name,
        );
    }
  } finally {
    client.clear();
  }
});
