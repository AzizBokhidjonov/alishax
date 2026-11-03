const { React, mount, change } = require("./dom.cjs");
require("./payment-locks.cjs");
const { loadSource } = require("./load-source.cjs");
const errorModule = loadSource("src/api/error.ts");

async function paymentHarness(send, { reset = true, user = "a" } = {}) {
  if (reset) window.localStorage.clear();
  const recovery = loadSource("src/features/finance/payment-recovery-store.ts", {
    "src/api/http.ts": { API_BASE_URL: "ui-fixture" },
  });
  recovery.setPaymentRecoveryScope(user, true);
  let dialog;
  const { PaymentFormDialog } = loadSource(
    "src/features/finance/components/PaymentFormDialog.tsx",
    {
      "react-i18next": { useTranslation: () => ({ t: (key) => key, i18n: { language: "uz" } }) },
      "@tanstack/react-router": { useRouter: () => null },
      "src/api/index.ts": { fieldErrors: errorModule.fieldErrors },
      "src/api/error.ts": errorModule,
      "src/features/finance/payment-recovery-store.ts": recovery,
      "src/auth/auth-context.ts": { usePermissions: () => ({ can: () => false }) },
      "src/features/finance/api.ts": { useCreatePayment: () => ({ mutateAsync: send }) },
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
          React.createElement("input", { value, onChange: (e) => onChange(e.target.value) }),
      },
    },
  );
  const view = await mount(PaymentFormDialog, { childId: "child-a", childName: "Fixture A" });
  return {
    view,
    recovery,
    dialog: () => dialog,
    open: () => React.act(async () => dialog.onOpenChange(true)),
    act: () => React.act(async () => dialog.onSubmit()),
    amount: (value) => change(view.container.querySelector("input"), value),
  };
}
module.exports = { paymentHarness, ApiError: errorModule.ApiError };
