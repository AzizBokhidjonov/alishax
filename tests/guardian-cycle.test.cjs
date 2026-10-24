const { test } = require("node:test");
const assert = require("node:assert/strict");
const { React, mount, change } = require("./dom.cjs");
const { loadSource } = require("./load-source.cjs");

test("guardian enrollment rejects punctuation phones and stays busy until linking completes", async () => {
  let resolveLink,
    links = 0;
  const busy = [],
    linked = [];
  const { EnrollGuardianStep } = loadSource(
    "src/features/children/components/EnrollGuardianStep.tsx",
    {
      "react-i18next": { useTranslation: () => ({ t: (k) => k }) },
      sonner: { toast: { success() {} } },
      "src/api/index.ts": {
        childrenApi: {
          linkGuardian: () => {
            links++;
            return new Promise((resolve) => (resolveLink = resolve));
          },
        },
      },
      "src/lib/query.ts": { useErrorToast: () => () => {} },
      "src/features/guardians/duplicate.ts": {
        createOrReuseGuardian: async () => ({
          guardian: { id: "guardian", fullName: "Parent" },
          reused: false,
        }),
      },
      "src/components/common/EntityPicker.tsx": { GuardianPicker: () => null },
    },
  );
  const view = await mount(EnrollGuardianStep, {
    childId: "child",
    onBusyChange: (value) => busy.push(value),
    onLinked: (value) => linked.push(value),
  });
  try {
    const inputs = view.container.querySelectorAll("input");
    await change(inputs[0], "Parent");
    await change(inputs[1], "---");
    await change(inputs[2], "Mother");
    const submit = [...view.container.querySelectorAll("button")].find(
      (b) => b.textContent === "guardians.link.add",
    );
    assert.equal(submit.disabled, true);
    assert.match(view.container.textContent, /common.validation.invalidPhone/);
    await change(inputs[1], "+998901234567");
    assert.equal(submit.disabled, false);
    await React.act(async () => {
      submit.click();
      submit.click();
    });
    assert.equal(links, 1);
    assert.deepEqual(busy, [true]);
    assert.equal(view.container.querySelector("fieldset").disabled, true);
    await React.act(async () => resolveLink());
    assert.deepEqual(busy, [true, false]);
    assert.equal(linked[0].id, "guardian");
    assert.equal(inputs[1].value, "");
  } finally {
    await view.close();
  }
});

test("blank optional group ages stay absent instead of becoming zero months", () => {
  const { groupSchema } = loadSource("src/components/forms/schemas/people.ts");
  const result = groupSchema.parse({
    branchId: "branch",
    name: "Test group",
    capacity: 20,
    ageMinMonths: "",
    ageMaxMonths: "",
  });
  assert.equal(result.ageMinMonths, undefined);
  assert.equal(result.ageMaxMonths, undefined);
});

test("parent profile resolves nested child links to usable names and detail URLs", async () => {
  const { apiHarness } = require("./load-source.cjs");
  const h = apiHarness("src/api/endpoints/guardians.ts");
  h.reply("get", "/guardians/parent/children", [
    {
      childId: "child-1",
      relationship: "mother",
      child: { id: "child-1", firstName: "Ali", lastName: "Karimov", status: "active" },
    },
  ]);
  const [child] = await h.endpoints.guardiansApi.children("parent");
  assert.equal(child.id, "child-1");
  assert.equal(child.firstName, "Ali");
  assert.equal(child.status, "active");
});
