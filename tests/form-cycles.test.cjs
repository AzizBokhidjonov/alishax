const { test } = require("node:test");
const assert = require("node:assert/strict");
const { React, mount, change } = require("./dom.cjs");
const { loadSource } = require("./load-source.cjs");
const translations = { useTranslation: () => ({ t: (key) => key, i18n: { language: "uz" } }) };
const box = ({ children }) => React.createElement("div", null, children);
const popover = { Popover: box, PopoverTrigger: box, PopoverContent: () => null };

function dateHarness(props) {
  const { DatePicker } = loadSource("src/components/common/DateField.tsx", {
    "react-i18next": translations,
    "src/i18n/useLanguage.ts": { useLanguage: () => ({ language: "uz" }) },
    "src/components/ui/popover.tsx": popover,
  });
  let value;
  function Harness() {
    const [current, setCurrent] = React.useState(props.value);
    value = current;
    return React.createElement(DatePicker, { ...props, value: current, onChange: setCurrent });
  }
  return { Harness, value: () => value };
}

test("editing a saved date to an impossible or incomplete date never submits the old date", async () => {
  const h = dateHarness({ value: "2026-10-24" });
  const view = await mount(h.Harness);
  try {
    const input = view.container.querySelector("input");
    await change(input, "31022026");
    assert.notEqual(h.value(), "2026-10-24");
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.match(view.container.textContent, /common.validation.invalidDate/);
    await React.act(async () => input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
    assert.equal(input.value, "31.02.2026");
    await change(input, "240");
    assert.equal(input.getAttribute("aria-invalid"), "true");
    await change(input, "29022024");
    assert.equal(h.value(), "2024-02-29");
    assert.equal(input.getAttribute("aria-invalid"), "false");
  } finally {
    await view.close();
  }
});

test("typed dates respect the same bounds as calendar selection", async () => {
  const h = dateHarness({ value: "2026-10-24", min: "2026-10-01", max: "2026-10-31" });
  const view = await mount(h.Harness);
  try {
    await change(view.container.querySelector("input"), "01112026");
    assert.equal(view.container.querySelector("input").getAttribute("aria-invalid"), "true");
    assert.notEqual(h.value(), "2026-11-01");
  } finally {
    await view.close();
  }
});

test("enrollment clears canceled child details and assignment state on every new opening", async () => {
  const created = [];
  let resets = 0;
  const { ChildEnrollmentWizard } = loadSource(
    "src/features/children/components/ChildEnrollmentWizard.tsx",
    {
      "react-i18next": translations,
      "@tanstack/react-router": { useNavigate: () => () => {} },
      sonner: { toast: { success() {} } },
      "src/api/index.ts": { fieldErrors: () => ({}) },
      "src/features/settings/api.ts": {
        useBranchOptions: () => [{ value: "branch-a", label: "A" }],
      },
      "src/features/groups/api.ts": {
        useGroupOptions: () => [],
        useAssignChildToGroup: () => ({
          isPending: false,
          isSuccess: false,
          reset: () => resets++,
        }),
      },
      "src/features/children/api.ts": {
        useCreateChild: () => ({
          mutateAsync: async (v) => {
            created.push(v);
            return { id: "child-a" };
          },
        }),
      },
      "src/features/children/components/EnrollGuardianStep.tsx": { EnrollGuardianStep: () => null },
      "src/features/children/components/ChildFormFields.tsx": {
        ChildFormFields: ({ form }) =>
          React.createElement(
            "div",
            null,
            ...["firstName", "lastName", "birthDate"].map((name) =>
              React.createElement("input", { key: name, ...form.register(name) }),
            ),
          ),
      },
      "src/components/ui/dialog.tsx": {
        Dialog: ({ open, onOpenChange, children }) =>
          React.createElement(
            "div",
            null,
            React.createElement(
              "button",
              { id: "toggle", onClick: () => onOpenChange(!open) },
              "toggle",
            ),
            open ? children : null,
          ),
        DialogContent: box,
        DialogHeader: box,
        DialogTitle: box,
        DialogDescription: box,
        DialogTrigger: () => null,
      },
      "src/components/common/DateField.tsx": { DatePicker: () => null },
      "src/components/common/SelectField.tsx": { SelectField: () => null },
    },
  );
  const view = await mount(ChildEnrollmentWizard, {
    trigger: React.createElement("button", null, "open"),
  });
  const click = async (selector) =>
    React.act(async () => view.container.querySelector(selector).click());
  try {
    await click("#toggle");
    await change(view.container.querySelector("[name=firstName]"), "First");
    await change(view.container.querySelector("[name=lastName]"), "Child");
    await change(view.container.querySelector("[name=birthDate]"), "2021-01-01");
    const next = [...view.container.querySelectorAll("button")].find((b) =>
      b.textContent.includes("enroll.next"),
    );
    await React.act(async () => next.click());
    assert.equal(created.length, 1);
    await click("#toggle");
    await click("#toggle");
    assert.equal(view.container.querySelector("[name=firstName]").value, "");
    assert.equal(view.container.querySelector("[name=lastName]").value, "");
    assert.equal(view.container.querySelector("[name=birthDate]").value, "");
    assert.equal(resets, 2);
    assert.equal(
      [...view.container.querySelectorAll("button")].find((b) =>
        b.textContent.includes("enroll.next"),
      ).disabled,
      true,
    );
  } finally {
    await view.close();
  }
});

test("the entity form submits once while pending and remains open after a field rejection", async () => {
  const { useEntityForm } = loadSource("src/hooks/use-entity-form.ts", {
    "src/api/index.ts": { fieldErrors: () => ({ name: "common.validation.invalidValue" }) },
  });
  const { z } = require("zod");
  let current,
    reject,
    calls = 0;
  function Harness() {
    current = useEntityForm({
      schema: z.object({ name: z.string().min(1) }),
      defaults: { name: "Test" },
      onSubmit: () => {
        calls++;
        return new Promise((_, r) => {
          reject = r;
        });
      },
    });
    return React.createElement("input", current.form.register("name"));
  }
  const view = await mount(Harness);
  try {
    await React.act(async () => current.setOpen(true));
    await React.act(async () => {
      current.submit();
      const repeatedSubmit = new Event("submit", { cancelable: true });
      current.submit(repeatedSubmit);
      assert.equal(repeatedSubmit.defaultPrevented, true);
    });
    assert.equal(calls, 1);
    await React.act(async () => current.setOpen(false));
    assert.equal(current.open, true);
    await React.act(async () => reject(new Error("invalid")));
    assert.equal(current.open, true);
    assert.equal(current.pending, false);
    assert.equal(current.form.formState.errors.name.message, "common.validation.invalidValue");
    await change(view.container.querySelector("input"), "Corrected");
    assert.equal(current.canSubmit, true);
  } finally {
    await view.close();
  }
});
