const { test } = require("node:test");
const assert = require("node:assert/strict");
const { React, mount, change } = require("./dom.cjs");
const { loadSource } = require("./load-source.cjs");

test("reset accepts ten characters, preserves Telegram instructions and prevents repeated submission", async () => {
  const { auth } = loadSource("src/i18n/locales/uz/app.ts");
  const calls = [];
  let resolve;
  const { ResetPasswordPage } = loadSource("src/features/auth/ResetPasswordPage.tsx", {
    "react-i18next": {
      useTranslation: () => ({ t: (key) => (key.startsWith("auth.") ? auth[key.slice(5)] : key) }),
    },
    "@tanstack/react-router": {
      Link: ({ children }) => React.createElement("span", null, children),
      useNavigate: () => () => {},
    },
    sonner: { toast: { success() {} } },
    "src/lib/query.ts": { useErrorToast: () => () => {} },
    "src/features/auth/ForgotPasswordDialog.tsx": { ForgotPasswordDialog: () => null },
    "src/api/index.ts": {
      authApi: {
        resetPassword: (dto) => {
          calls.push(dto);
          return new Promise((r) => (resolve = r));
        },
      },
    },
  });
  const view = await mount(ResetPasswordPage);
  try {
    assert.match(view.container.textContent, /Telegram/);
    assert.match(view.container.textContent, /1 soat/);
    assert.match(view.container.textContent, /kamida 10/);
    const [token, password] = view.container.querySelectorAll("input");
    const save = view.container.querySelector("button");
    await change(token, " synthetic-code ");
    await change(password, "123456789");
    assert.equal(save.disabled, true);
    await change(password, "1234567890");
    assert.equal(save.disabled, false);
    await React.act(async () => {
      save.click();
      save.click();
    });
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { token: "synthetic-code", newPassword: "1234567890" });
    assert.equal(password.disabled, true);
    await React.act(async () => resolve({ success: true }));
  } finally {
    await view.close();
  }
});
