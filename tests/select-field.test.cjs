const { test } = require("node:test");
const assert = require("node:assert/strict");
const { React, mount, change, submit } = require("./dom.cjs");
const { useForm } = require("react-hook-form");
const { loadSource } = require("./load-source.cjs");
const translations = { useTranslation: () => ({ t: (key) => key, i18n: { language: "uz" } }) };
const { SelectField } = loadSource("src/components/common/SelectField.tsx", {
  "react-i18next": translations,
});
test("saved select values survive async loading, native initialization and remount", async () => {
  const changes = [];
  let submitted;
  function Form({ loaded, options }) {
    const form = useForm({ defaultValues: {} });
    React.useEffect(() => {
      if (loaded) form.reset({ choice: loaded });
    }, [loaded, form]);
    return loaded
      ? React.createElement(
          "form",
          {
            onSubmit: form.handleSubmit((v) => {
              submitted = v;
            }),
          },
          React.createElement(SelectField, {
            label: "Choice",
            value: form.watch("choice") ?? "",
            options,
            onChange: (value) => {
              changes.push(value);
              form.setValue("choice", value);
            },
          }),
        )
      : null;
  }
  const options = [
    { value: "uz", label: "Uzbek" },
    { value: "ru", label: "Russian" },
    { value: "all", label: "All" },
  ];
  const view = await mount(Form, { options });
  try {
    await view.render({ loaded: "ru", options });
    assert.equal(view.container.querySelector('[role="combobox"]').textContent, "Russian");
    assert.deepEqual(changes, []);
    await change(view.container.querySelector("select"), "uz");
    await submit(view.container);
    assert.equal(submitted.choice, "uz");
    await view.render({ loaded: undefined, options });
    await view.render({ loaded: submitted.choice, options });
    assert.equal(view.container.querySelector('[role="combobox"]').textContent, "Uzbek");
    await change(view.container.querySelector("select"), "all");
    await submit(view.container);
    assert.equal(submitted.choice, "all");
  } finally {
    await view.close();
  }
});

test("a selection survives delayed options and can still be cleared by its parent", async () => {
  const changes = [];
  function Form({ value, options }) {
    return React.createElement(
      "form",
      null,
      React.createElement(SelectField, {
        label: "Choice",
        value,
        options,
        onChange: (next) => changes.push(next),
      }),
    );
  }
  const view = await mount(Form, { value: "branch-1", options: [] });
  try {
    await view.render({ value: "branch-1", options: [{ value: "branch-1", label: "Branch one" }] });
    assert.equal(view.container.querySelector('[role="combobox"]').textContent, "Branch one");
    assert.deepEqual(changes, []);
    await view.render({ value: "", options: [{ value: "branch-1", label: "Branch one" }] });
    assert.equal(
      view.container.querySelector('[role="combobox"]').textContent,
      "common.actions.select",
    );
  } finally {
    await view.close();
  }
});
