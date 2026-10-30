const { test } = require("node:test");
const assert = require("node:assert/strict");
const { React, mount, change } = require("./dom.cjs");
const { loadSource, apiHarness } = require("./load-source.cjs");

test("billing periods use named months even without browser Uzbek locale support", () => {
  const { formatPeriod } = loadSource("src/lib/billing-labels.ts");
  assert.equal(formatPeriod({ year: 2026, month: 9 }, "uz"), "Sentabr 2026");
  assert.equal(formatPeriod({ year: 2026, month: 10 }, "ru"), "Октябрь 2026");
});

test("a debt-only user does not request tariff or discount data", async () => {
  const requested = [];
  const { ChildFinanceTab } = loadSource("src/features/children/components/ChildFinanceTab.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "src/api/index.ts": {},
    "src/auth/auth-context.ts": {
      usePermissions: () => ({ can: (permission) => permission === "debt:read" }),
    },
    "src/features/finance/api.ts": {
      useChildTariffs: (id) => {
        requested.push(id);
        return {};
      },
      useDiscounts: (id) => {
        requested.push(id);
        return {};
      },
      useRevokeDiscount: () => ({}),
      useEndChildTariff: () => ({}),
    },
    "src/features/children/components/ChildAccount.tsx": {
      ChildAccountSummary: () => null,
      ChildPaymentsCard: () => null,
    },
    "src/features/children/components/ChildLedgerCard.tsx": { ChildLedgerCard: () => null },
    "src/features/children/components/ChildFinanceDialogs.tsx": {
      AssignTariffDialog: () => null,
      DiscountDialog: () => null,
    },
  });
  const view = await mount(ChildFinanceTab, { childId: "child", childName: "Malika" });
  try {
    assert.deepEqual(requested, ["", ""]);
    assert.equal(view.container.textContent, "");
  } finally {
    await view.close();
  }
});

test("assigned tariffs use nested names and exact prices without inventing zero", async () => {
  const h = apiHarness("src/api/endpoints/finance.ts");
  h.reply("get", "/children/child/tariffs", [
    {
      id: "assignment",
      tariffId: "tariff",
      tariff: { name: "Full day", amountTiyin: "9007199254740993", kind: "full_day" },
    },
    { id: "unknown", tariffId: "missing" },
    { id: "free", tariffId: "free", amountTiyin: "0", tariff: { amountTiyin: "100" } },
  ]);
  const rows = await h.endpoints.tariffsApi.ofChild("child");
  assert.equal(rows[0].tariffName, "Full day");
  assert.equal(rows[0].amountTiyin, "9007199254740993");
  assert.equal(rows[1].amountTiyin, undefined);
  assert.equal(rows[2].amountTiyin, "0");
});

test("manual allocations reject malformed, negative and excessive amounts exactly", () => {
  const { validPaymentAllocation: valid } = loadSource(
    "src/features/finance/payment-allocation.ts",
  );
  assert.equal(valid("100.01", { a: "50", b: "50.01" }), true);
  assert.equal(valid("100", { a: "100.01" }), false);
  assert.equal(valid("100", { a: "-1" }), false);
  assert.equal(valid("100", { a: "1foo" }), false);
  assert.equal(valid("100", { a: "0" }), false);
  assert.equal(valid("90071992547409.93", { a: "90071992547409.92", b: "0.01" }), true);
  assert.equal(valid("90071992547409.93", { a: "90071992547409.92", b: "0.02" }), false);
});

test("discounts and tariff assignments reject an end date before their start", () => {
  const { discountSchema, assignTariffSchema } = loadSource(
    "src/components/forms/schemas/finance.ts",
  );
  assert.equal(
    discountSchema.safeParse({
      kind: "percent",
      value: "10",
      validFrom: "2026-11-01",
      validTo: "2026-10-31",
      reason: "Sibling",
    }).success,
    false,
  );
  assert.equal(
    assignTariffSchema.safeParse({
      tariffId: "tariff",
      effectiveFrom: "2026-11-01",
      effectiveTo: "2026-10-31",
    }).success,
    false,
  );
});

test("payment requires review, preserves exact amount and retries with the same key", async () => {
  let dialog,
    rejectPayment = true,
    resets = 0;
  const calls = [];
  const translations = { useTranslation: () => ({ t: (key) => key, i18n: { language: "uz" } }) };
  const { PaymentFormDialog } = loadSource(
    "src/features/finance/components/PaymentFormDialog.tsx",
    {
      "react-i18next": translations,
      "src/auth/auth-context.ts": { usePermissions: () => ({ can: () => false }) },
      "src/api/index.ts": { fieldErrors: () => ({ amountSom: "common.validation.invalidAmount" }) },
      "src/features/finance/api.ts": {
        useCreatePayment: () => ({
          mutateAsync: async (payload) => {
            calls.push(payload);
            if (rejectPayment) throw new Error("fixture rejection");
          },
        }),
      },
      "src/lib/idempotency.ts": {
        useIdempotencyKey: () => ({ get: () => "stable-key", reset: () => resets++ }),
      },
      "src/features/finance/use-closed-period.ts": { useClosedPeriod: () => ({ closed: false }) },
      "src/features/finance/components/ClosedPeriodNotice.tsx": { ClosedPeriodNotice: () => null },
      "src/features/finance/components/PaymentBalance.tsx": { PaymentBalance: () => null },
      "src/features/finance/components/PaymentOptionalFields.tsx": {
        PaymentOptionalFields: () => null,
      },
      "src/components/common/EntityPicker.tsx": {
        PayerPicker: () => null,
        ChildPicker: () => null,
      },
      "src/components/common/SelectField.tsx": { SelectField: () => null },
      "src/components/common/DateField.tsx": { DateTimePicker: () => null },
      "src/components/forms/FormDialog.tsx": {
        Field: ({ children }) => React.createElement("div", null, children),
        FormDialog: (props) => {
          dialog = props;
          return props.open
            ? React.createElement("div", null, props.children, props.footerStart)
            : null;
        },
      },
      "src/components/common/MoneyInput.tsx": {
        MoneyInput: ({ value, onChange }) =>
          React.createElement("input", {
            "aria-label": "Amount",
            value,
            onChange: (e) => onChange(e.target.value),
          }),
      },
    },
  );
  const view = await mount(PaymentFormDialog, { childId: "child", childName: "Malika Aliyeva" });
  try {
    await React.act(async () => dialog.onOpenChange(true));
    assert.match(view.container.textContent, /Malika Aliyeva/);
    await change(view.container.querySelector("input"), "123.45");
    await React.act(async () => dialog.onSubmit());
    assert.equal(calls.length, 0);
    assert.equal(dialog.submitLabel, "flows.record");
    assert.match(view.container.textContent, /Malika Aliyeva/);
    assert.match(view.container.textContent, /123,45/);
    await React.act(async () => dialog.onSubmit());
    assert.equal(calls.length, 1);
    assert.equal(calls[0].dto.amountTiyin, "12345");
    assert.equal(dialog.open, true);
    assert.equal(dialog.submitLabel, "flows.review");
    assert.equal(resets, 0);
    await change(view.container.querySelector("input"), "123.45");
    await React.act(async () => dialog.onSubmit());
    rejectPayment = false;
    await React.act(async () => dialog.onSubmit());
    assert.equal(calls.length, 2);
    assert.equal(calls[1].idempotencyKey, calls[0].idempotencyKey);
    assert.equal(dialog.open, false);
    assert.equal(resets, 1);
  } finally {
    await view.close();
  }
});
