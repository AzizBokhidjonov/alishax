const { test } = require("node:test");
const assert = require("node:assert/strict");
const { React, mount, change, submit } = require("./dom.cjs");
const { loadSource } = require("./load-source.cjs");
const translations = { useTranslation: () => ({ t: (key) => key, i18n: { language: "uz" } }) };
const { settingsSchema } = loadSource("src/components/forms/schemas/admin.ts");
const { settingsToForm, settingsToDto } = loadSource("src/features/settings/settings-form.ts");
const saved = {
  displayName: "Test kindergarten",
  address: "Test address",
  phones: ["+998900000000"],
  workingDays: [1, 2, 3, 4, 5],
  workingHours: { open: "08:00", close: "18:00" },
  defaultLanguage: "ru",
  currency: "UZS",
  timezone: "Asia/Tashkent",
  receiptNumberFormat: "R-{YYYY}-{SEQ:6}",
  paymentDueDay: 5,
  bankDetails: { account: "synthetic" },
  taxInfo: null,
  logoFileId: null,
};

test("settings round-trip keeps language, clears optional values and omits unsupported/hidden fields", () => {
  const values = settingsSchema.parse({
    ...settingsToForm(saved),
    address: "",
    phones: "",
    open: "",
    close: "",
    paymentDueDay: "12",
  });
  const dto = settingsToDto(values);
  assert.equal(dto.defaultLanguage, "ru");
  assert.equal(dto.address, "");
  assert.deepEqual(dto.phones, []);
  assert.deepEqual(dto.workingHours, {});
  assert.equal(dto.paymentDueDay, 12);
  for (const field of ["logoFileId", "bankDetails", "taxInfo"])
    assert.equal(Object.hasOwn(dto, field), false);
  const reloaded = settingsToForm({ ...saved, ...dto });
  assert.equal(reloaded.address, "");
  assert.equal(reloaded.open, "");
  assert.equal(reloaded.close, "");
});

test("invalid due days and incomplete hours produce translated field errors", () => {
  for (const paymentDueDay of ["", 0, 29, 5.5]) {
    const parsed = settingsSchema.safeParse({ ...settingsToForm(saved), paymentDueDay });
    assert.equal(parsed.success, false);
    assert.equal(parsed.error.issues[0].message, "settings.form.invalidDueDay");
  }
  const partial = settingsSchema.safeParse({ ...settingsToForm(saved), close: "" });
  assert.equal(partial.success, false);
  assert.deepEqual(partial.error.issues[0].path, ["close"]);
});

function editorHarness() {
  const requests = [];
  let stored = structuredClone(saved);
  let failure;
  const { GeneralSettingsForm } = loadSource("src/features/settings/components/GeneralTab.tsx", {
    "react-i18next": translations,
    "@/api": { fieldErrors: (error) => error.fields ?? {} },
    "@/i18n/useLanguage": { useLanguage: () => ({ language: "uz" }) },
    "@/components/common/AuthImage": { AuthImage: () => null },
    "src/features/settings/api.ts": {
      useUpdateSettings: () => ({
        mutateAsync: async (dto) => {
          requests.push(dto);
          if (failure) throw failure;
          stored = { ...stored, ...dto };
          return stored;
        },
      }),
    },
  });
  return {
    Component: GeneralSettingsForm,
    requests,
    get stored() {
      return stored;
    },
    fail(error) {
      failure = error;
    },
  };
}

test("settings save/reload preserves the selected language and cleared address", async () => {
  const h = editorHarness();
  const view = await mount(h.Component, { settings: h.stored, canManage: true });
  try {
    assert.equal(
      view.container.querySelector('[role="combobox"]').textContent,
      "common.language.ru",
    );
    await change(view.container.querySelector("select"), "uz");
    await change(view.container.querySelector('[name="address"]'), "");
    await submit(view.container);
    assert.equal(h.requests.length, 1);
    assert.equal(h.stored.defaultLanguage, "uz");
    assert.equal(h.stored.address, "");
  } finally {
    await view.close();
  }
  const reloaded = await mount(h.Component, { settings: h.stored, canManage: true });
  try {
    assert.equal(
      reloaded.container.querySelector('[role="combobox"]').textContent,
      "common.language.uz",
    );
    assert.equal(reloaded.container.querySelector('[name="address"]').value, "");
  } finally {
    await reloaded.close();
  }
});

test("background settings refresh preserves dirty inputs and selected language", async () => {
  const h = editorHarness();
  const view = await mount(h.Component, { settings: h.stored, canManage: true });
  try {
    await change(view.container.querySelector('[name="address"]'), "Unsaved address");
    await change(view.container.querySelector("select"), "uz");
    await view.render({
      settings: { ...h.stored, displayName: "Updated server name" },
      canManage: true,
    });
    assert.equal(view.container.querySelector('[name="address"]').value, "Unsaved address");
    assert.equal(view.container.querySelector('[name="displayName"]').value, "Updated server name");
    assert.equal(
      view.container.querySelector('[role="combobox"]').textContent,
      "common.language.uz",
    );
  } finally {
    await view.close();
  }
});

test("invalid settings are explained and failed saves preserve edits", async () => {
  const h = editorHarness();
  const view = await mount(h.Component, { settings: h.stored, canManage: true });
  try {
    await change(view.container.querySelector('[name="paymentDueDay"]'), "");
    await submit(view.container);
    assert.equal(h.requests.length, 0);
    assert.match(view.container.textContent, /settings.form.invalidDueDay/);
    assert.equal(
      view.container.querySelector('[name="paymentDueDay"]').getAttribute("aria-invalid"),
      "true",
    );
    await change(view.container.querySelector('[name="paymentDueDay"]'), "12");
    await change(view.container.querySelector('[name="address"]'), "Unsaved address");
    h.fail({ fields: { address: "Invalid address" } });
    await submit(view.container);
    assert.equal(view.container.querySelector('[name="address"]').value, "Unsaved address");
    assert.match(view.container.textContent, /Invalid address/);
    assert.equal(view.container.querySelector("fieldset").disabled, false);
  } finally {
    await view.close();
  }
});
