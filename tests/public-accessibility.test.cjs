const { test } = require("node:test");
const assert = require("node:assert/strict");
const { React, mount, change } = require("./dom.cjs");
const { renderToStaticMarkup } = require("react-dom/server");
const { loadSource } = require("./load-source.cjs");
const box = ({ children }) => React.createElement("div", null, children);
function translations(language) {
  const { landing } = loadSource(`src/i18n/locales/${language}/landing.ts`);
  const { auth } = loadSource(`src/i18n/locales/${language}/app.ts`);
  const { common } = loadSource(`src/i18n/locales/${language}/common.ts`);
  const resources = { landing, auth, common };
  return {
    useTranslation: () => ({
      t: (key) => key.split(".").reduce((v, k) => v?.[k], resources) ?? key,
      i18n: { language },
    }),
  };
}
function publicMocks(language) {
  return {
    "react-i18next": translations(language),
    "src/i18n/useLanguage.ts": { useLanguage: () => ({ language, setLanguage() {} }) },
    "@tanstack/react-router": {
      Link: ({ to, children, onClick, ...props }) =>
        React.createElement(
          "a",
          {
            ...props,
            href: to,
            onClick: (event) => {
              event.preventDefault();
              onClick?.(event);
            },
          },
          children,
        ),
    },
    "@/assets/logo-alishax.png": "synthetic-logo.png",
    "@/assets/landing-hero.jpg": "synthetic-hero.jpg",
    "@/assets/landing-about.jpg": "synthetic-about.jpg",
    "src/features/landing/hooks.ts": {
      useScrolled: () => false,
      useActiveSection: () => "#biz-haqimizda",
    },
    "src/features/landing/components/Reveal.tsx": { Reveal: box },
    "src/features/website/api.ts": { usePublicLanding: () => ({ data: undefined }) },
    "src/features/landing/PublicBlocks.tsx": { PublicBlockView: () => null },
  };
}
for (const language of ["uz", "ru"])
  test(`static public landing renders complete ${language} content and contact actions`, () => {
    const { LandingPage } = loadSource(
      "src/features/landing/LandingPage.tsx",
      publicMocks(language),
    );
    const html = renderToStaticMarkup(React.createElement(LandingPage));
    assert.doesNotMatch(html, /landing\./);
    assert.match(html, language === "ru" ? /Место, где ваш ребёнок/ : /Farzandingiz/);
    assert.match(html, language === "ru" ? /Приходите в гости/ : /Bugun tashrif buyuring/);
    assert.match(
      html,
      language === "ru" ? /Воспитатель читает детям книгу/ : /Tarbiyachi bolalarga kitob/,
    );
    assert.match(html, /tel:\+998331310303/);
    assert.match(html, /href="\/kirish"/);
    if (language === "ru")
      assert.doesNotMatch(html, /Biz haqimizda|Xodimlar uchun|Tarbiyachi \/ bola/);
  });
test("both locale catalogs contain the same landing keys", () => {
  const uz = loadSource("src/i18n/locales/uz/landing.ts").landing;
  const ru = loadSource("src/i18n/locales/ru/landing.ts").landing;
  assert.deepEqual(Object.keys(uz).sort(), Object.keys(ru).sort());
});
test("CMS content retains its declared language when it differs from interface language", () => {
  const mocks = publicMocks("ru");
  mocks["src/features/website/api.ts"] = {
    usePublicLanding: () => ({ data: { locale: "uz", blocks: [{ id: "a", type: "hero" }] } }),
  };
  const { LandingPage } = loadSource("src/features/landing/LandingPage.tsx", mocks);
  const html = renderToStaticMarkup(React.createElement(LandingPage));
  assert.match(html, /<div lang="uz">/);
  assert.match(html, /Логотип Alishax Kids/);
});
test("DateTimePicker exposes business date/time names and associates shared errors with both inputs", async () => {
  const mocks = {
    "react-i18next": translations("uz"),
    "src/i18n/useLanguage.ts": { useLanguage: () => ({ language: "uz" }) },
    "src/components/ui/popover.tsx": {
      Popover: box,
      PopoverTrigger: box,
      PopoverContent: () => null,
    },
  };
  const { DateTimePicker } = loadSource("src/components/common/TimeFields.tsx", mocks);
  const { Field } = loadSource("src/components/forms/FormDialog.tsx", mocks);
  const view = await mount(() =>
    React.createElement(
      Field,
      { label: "Boshlanish", error: "Vaqtni tekshiring" },
      React.createElement(DateTimePicker, { value: "2026-11-03T12:30", onChange() {} }),
    ),
  );
  try {
    const inputs = [...view.container.querySelectorAll("input")];
    assert.equal(inputs.length, 2);
    const name = (input) =>
      input
        .getAttribute("aria-labelledby")
        .split(" ")
        .map((id) => document.getElementById(id).textContent)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    assert.equal(name(inputs[0]), "Boshlanish Sana");
    assert.equal(name(inputs[1]), "Boshlanish Vaqt");
    for (const input of inputs) {
      assert.equal(input.getAttribute("aria-invalid"), "true");
      assert.match(
        document.getElementById(input.getAttribute("aria-describedby")).textContent,
        /Vaqtni tekshiring/,
      );
    }
    assert.notEqual(inputs[0].id, inputs[1].id);
  } finally {
    await view.close();
  }
});
test("SessionCheck renders actionable retry and cancel-to-login controls", async () => {
  let retry = 0,
    cancel = 0;
  const { SessionCheck } = loadSource("src/auth/SessionCheck.tsx", {
    ...publicMocks("ru"),
    "src/auth/auth-context.ts": {
      useAuth: () => ({
        status: "error",
        retrySession: async () => retry++,
        cancelSession: () => cancel++,
      }),
    },
  });
  const view = await mount(SessionCheck);
  try {
    assert.match(
      view.container.querySelector("[role=alert]").textContent,
      /Не удалось проверить сессию/,
    );
    await React.act(async () => view.container.querySelector("button").click());
    await React.act(async () => view.container.querySelector("a").click());
    assert.equal(retry, 1);
    assert.equal(cancel, 1);
    assert.equal(view.container.querySelector("a").getAttribute("href"), "/kirish");
  } finally {
    await view.close();
  }
});

const dialogMocks = {
  Dialog: ({ open, onOpenChange, children }) =>
    React.createElement(
      "div",
      null,
      React.createElement("button", { id: "open", onClick: () => onOpenChange(true) }, "open"),
      open ? children : null,
    ),
  DialogTrigger: () => null,
  DialogContent: box,
  DialogHeader: box,
  DialogTitle: box,
  DialogDescription: box,
  DialogFooter: box,
};
test("recovery response retains generic Telegram instructions and offers the code-entry route", async () => {
  let resolve,
    calls = 0;
  const { ForgotPasswordDialog } = loadSource("src/features/auth/ForgotPasswordDialog.tsx", {
    ...publicMocks("ru"),
    "src/components/ui/dialog.tsx": dialogMocks,
    "src/api/index.ts": {
      authApi: {
        forgotPassword: async (login) => {
          calls++;
          assert.equal(login, "synthetic");
          return new Promise((r) => (resolve = r));
        },
      },
    },
    "src/lib/query.ts": { useErrorToast: () => () => {} },
  });
  const view = await mount(ForgotPasswordDialog);
  try {
    await React.act(async () => view.container.querySelector("#open").click());
    await change(view.container.querySelector("input"), " synthetic ");
    const send = [...view.container.querySelectorAll("button")].find(
      (b) => b.textContent === "Отправить",
    );
    await React.act(async () => {
      send.click();
      send.click();
    });
    assert.equal(calls, 1);
    assert.equal(view.container.querySelector("input").disabled, true);
    await React.act(async () => resolve({ success: true }));
    assert.match(view.container.textContent, /Если подходящий аккаунт с подключённым Telegram/);
    assert.match(view.container.textContent, /администратору/);
    assert.equal(view.container.querySelector("a").getAttribute("href"), "/parolni-tiklash");
  } finally {
    await view.close();
  }
});
