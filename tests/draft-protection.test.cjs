const { test } = require("node:test");
const assert = require("node:assert/strict");
const { z } = require("zod");
const { React, mount, change } = require("./dom.cjs");
const { loadSource } = require("./load-source.cjs");
const translations = { useTranslation: () => ({ t: (key) => key }) };

for (const entity of [undefined, { name: "Saved" }]) {
  test(`dirty ${entity ? "edit" : "create"} refuses implicit dismissal; explicit discard resets next opening`, async () => {
    const { useEntityForm } = loadSource("src/hooks/use-entity-form.ts", {
      "src/api/index.ts": { fieldErrors: () => ({}) },
      "react-i18next": translations,
      "@tanstack/react-router": { useRouter: () => null },
    });
    let current,
      allow = false;
    const prompts = [],
      old = window.confirm;
    window.confirm = (message) => {
      prompts.push(message);
      return allow;
    };
    function Harness() {
      current = useEntityForm({
        schema: z.object({ name: z.string() }),
        defaults: { name: "" },
        entity,
        onSubmit: async () => {},
      });
      return React.createElement("input", current.form.register("name"));
    }
    const view = await mount(Harness);
    try {
      await React.act(async () => current.setOpen(true));
      await change(view.container.querySelector("input"), "Unsaved draft");
      await React.act(async () => current.setOpen(false));
      assert.equal(current.open, true);
      assert.equal(current.form.getValues("name"), "Unsaved draft");
      const refresh = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(refresh);
      assert.equal(refresh.defaultPrevented, true);
      allow = true;
      await React.act(async () => current.setOpen(false));
      assert.equal(current.open, false);
      await React.act(async () => current.setOpen(true));
      assert.equal(current.form.getValues("name"), entity?.name ?? "");
      assert.deepEqual(prompts, ["recovery.discard", "recovery.discard"]);
      const clean = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(clean);
      assert.equal(clean.defaultPrevented, false);
    } finally {
      window.confirm = old;
      await view.close();
    }
  });
}

test("programmatic custom-control edits are protected even without react-hook-form shouldDirty", async () => {
  const { useEntityForm } = loadSource("src/hooks/use-entity-form.ts", {
    "src/api/index.ts": { fieldErrors: () => ({}) },
    "react-i18next": translations,
    "@tanstack/react-router": { useRouter: () => null },
  });
  const old = window.confirm;
  window.confirm = () => false;
  let current;
  function Harness() {
    current = useEntityForm({
      schema: z.object({ name: z.string() }),
      defaults: { name: "" },
      onSubmit() {},
    });
    return null;
  }
  const view = await mount(Harness);
  try {
    await React.act(async () => current.setOpen(true));
    await React.act(async () => current.form.setValue("name", "Custom date or picker"));
    await React.act(async () => current.setOpen(false));
    assert.equal(current.open, true);
    assert.equal(current.form.getValues("name"), "Custom date or picker");
  } finally {
    window.confirm = old;
    await view.close();
  }
});

test("route changes require explicit discard and cannot hide pending writes", async () => {
  let blocker,
    removed = 0,
    allow = false,
    prompts = 0;
  const router = {
    history: {
      block(options) {
        blocker = options.blockerFn;
        return () => {
          blocker = undefined;
          removed++;
        };
      },
    },
  };
  const { useDraftProtection } = loadSource("src/hooks/use-draft-protection.ts", {
    "react-i18next": translations,
    "@tanstack/react-router": { useRouter: () => router },
  });
  const old = window.confirm;
  window.confirm = () => {
    prompts++;
    return allow;
  };
  function Harness({ dirty, busy }) {
    useDraftProtection(true, dirty, "recovery.discard", busy);
    return null;
  }
  const view = await mount(Harness, { dirty: true, busy: false });
  try {
    assert.equal(blocker(), true);
    allow = true;
    assert.equal(blocker(), false);
    await view.render({ dirty: true, busy: true });
    assert.equal(blocker(), true);
    assert.equal(prompts, 2, "pending write cannot be discarded through route confirmation");
    await view.render({ dirty: false, busy: false });
    assert.equal(blocker, undefined);
    assert.ok(removed >= 2);
  } finally {
    window.confirm = old;
    await view.close();
  }
});
