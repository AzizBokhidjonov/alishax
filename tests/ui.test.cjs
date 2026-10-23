const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { loadSource, apiHarness } = require("./load-source.cjs");
const translations = { useTranslation: () => ({ t: (key) => key }) };

test("billing explanation renders both tariffs, committed trace and the combined total", () => {
  const { BillingExplanationLines } = loadSource(
    "src/features/finance/components/BillingExplanationLines.tsx",
    { "react-i18next": translations },
  );
  const html = renderToStaticMarkup(
    React.createElement(BillingExplanationLines, {
      lines: [
        {
          childId: "child",
          label: "Tuition",
          amountTiyin: "150000000",
          trace: [{ step: "tuition-base", amount: "150000000" }],
        },
        {
          childId: "child",
          label: "Meals",
          amountTiyin: "30000000",
          trace: [{ step: "meal-base", amount: "30000000" }],
        },
      ],
    }),
  );
  assert.match(html, /Tuition/);
  assert.match(html, /Meals/);
  assert.match(html, /tuition-base/);
  assert.match(html, /meal-base/);
  assert.match(html, /1 800 000,00/);
});

test("invitation endpoint returns the backend deepLink without renaming it", async () => {
  const h = apiHarness("src/api/endpoints/guardians.ts");
  h.reply("post", "/guardians/guardian/telegram-invite", {
    deepLink: "https://t.me/example_bot?start=synthetic",
    expiresInHours: 72,
  });
  const invite = await h.endpoints.guardiansApi.telegramInvite("guardian");
  assert.equal(invite.deepLink, "https://t.me/example_bot?start=synthetic");
  assert.equal(invite.expiresInHours, 72);
});

test("Telegram panel stores the generated deepLink for display", () => {
  let displayedLink = "old-link";
  const { TelegramPanel } = loadSource("src/features/guardians/components/TelegramPanel.tsx", {
    react: {
      ...React,
      useState: () => [
        null,
        (value) => {
          displayedLink = value;
        },
      ],
    },
    "react-i18next": translations,
    "@/api": {},
    "src/features/guardians/api.ts": {
      useTelegramBindings: () => ({ data: [] }),
      useTelegramUnbound: () => ({ data: [{ id: "guardian", fullName: "Parent" }] }),
      useTelegramInvite: () => ({
        mutate: (_id, options) =>
          options.onSuccess({ deepLink: "https://t.me/example_bot?start=new" }),
      }),
    },
  });
  function clickInvite(element) {
    if (!React.isValidElement(element)) return false;
    if (typeof element.props.onClick === "function") {
      element.props.onClick();
      return true;
    }
    return React.Children.toArray(element.props.children).some(clickInvite);
  }
  assert.ok(clickInvite(TelegramPanel()));
  assert.equal(displayedLink, "https://t.me/example_bot?start=new");
});
