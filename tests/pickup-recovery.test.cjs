const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const webRequire = createRequire(require("node:path").join(__dirname, "../package.json"));
const { loadSource } = require("./load-source.cjs");
const { React, mount } = require("./dom.cjs");
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  throw new Error("Real network forbidden");
};
after(() => {
  globalThis.fetch = originalFetch;
});
function probe(id, title, run) {
  test(`${id}: ${title}`, () => run({}));
}
function wrapper(tag = "div") {
  return ({ children, className }) => React.createElement(tag, { className }, children);
}
async function pickupHarness(options = {}) {
  const calls = [];
  const toasts = [];
  let refetches = 0;
  const state = {
    inside: options.inside || {
      data: [{ childId: "audit-child" }],
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: async () => {},
    },
    verify: options.verify || {
      data: { allowed: true, pickupName: "Audit Guardian" },
      isLoading: false,
      isFetching: false,
      error: null,
    },
  };
  const { PickupPage } = loadSource("src/features/pickup/PickupPage.tsx", {
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    sonner: { toast: { success: (message) => toasts.push(message) } },
    "src/api/index.ts": {
      isApiError: (error) => Boolean(error && error.fixtureApiError),
      recipientField: (recipient) => ({ guardianId: recipient.id }),
    },
    "src/lib/errors.ts": {
      errorMessage: (_t, error) => error.code || error.message || "fixture-error",
    },
    "src/lib/dates.ts": { formatDate: (value) => value, formatDateTime: (value) => value },
    "src/auth/auth-context.ts": { usePermissions: () => ({ can: () => true }) },
    "src/features/attendance/api.ts": {
      useInside: () => state.inside,
      useCheckOut: () => ({
        isPending: false,
        mutate: (dto, handlers) => {
          calls.push(structuredClone(dto));
          if (options.confirmError) handlers.onError(options.confirmError);
          else handlers.onSuccess();
        },
      }),
    },
    "src/features/pickup/api.ts": {
      usePickupVerify: (childId, recipient) => ({
        ...(childId && recipient
          ? state.verify
          : { data: undefined, isLoading: false, isFetching: false, error: null }),
        refetch: async () => {
          refetches++;
          return {};
        },
      }),
    },
    "src/features/children/api.ts": { useChildGuardians: () => ({ data: [] }) },
    "src/features/children/use-child-lookup.ts": {
      useChildLookup: () => new Map(),
      childDisplayName: (_lookup, id) =>
        id === "audit-child" ? "Audit Child" : "Audit Second Child",
    },
    "src/components/common/EntityPicker.tsx": {
      ChildPicker: ({ onChange }) =>
        React.createElement(
          "div",
          null,
          React.createElement(
            "button",
            { "data-testid": "select-child", onClick: () => onChange("audit-child") },
            "Select audit child",
          ),
          React.createElement(
            "button",
            { "data-testid": "select-second-child", onClick: () => onChange("audit-child-two") },
            "Select second child",
          ),
        ),
    },
    "src/features/pickup/components/PickupRecipientPicker.tsx": {
      PickupRecipientPicker: ({ onChange }) =>
        React.createElement(
          "button",
          {
            "data-testid": "select-recipient",
            onClick: () => onChange({ kind: "guardian", id: "audit-guardian" }),
          },
          "Select audit recipient",
        ),
    },
    "src/features/pickup/components/PickupPersonsPanel.tsx": { PickupPersonsPanel: () => null },
    "src/components/common/PageHeader.tsx": {
      PageHeader: ({ title, subtitle }) => React.createElement("header", null, title, subtitle),
    },
    "src/components/common/EmptyState.tsx": {
      EmptyState: ({ title }) => React.createElement("p", null, title),
    },
    "src/components/common/AuthImage.tsx": { AuthAvatarImage: () => null },
    "src/components/ui/card.tsx": {
      Card: wrapper(),
      CardContent: wrapper(),
      CardHeader: wrapper(),
      CardTitle: wrapper("h2"),
    },
    "src/components/ui/avatar.tsx": { Avatar: wrapper("span"), AvatarFallback: wrapper("span") },
    "src/components/ui/button.tsx": {
      Button: ({ children, onClick, disabled, className }) =>
        React.createElement("button", { onClick, disabled, className }, children),
    },
    "src/components/ui/textarea.tsx": {
      Textarea: (props) => React.createElement("textarea", props),
    },
  });
  const view = await mount(PickupPage);
  const click = async (selector) =>
    React.act(async () => view.container.querySelector(selector).click());
  const checkout = () =>
    [...view.container.querySelectorAll("button")].find((button) =>
      button.textContent.includes("attendance.checkOut"),
    );
  return {
    view,
    state,
    calls,
    toasts,
    checkout,
    refetches: () => refetches,
    async select() {
      await click("[data-testid=select-child]");
      await click("[data-testid=select-recipient]");
    },
    async secondChild() {
      await click("[data-testid=select-second-child]");
    },
    async confirm() {
      await React.act(async () => checkout().click());
    },
  };
}
async function withPickup(options, run) {
  const h = await pickupHarness(options);
  try {
    await h.select();
    await run(h);
  } finally {
    await h.view.close();
  }
}
function snapshot(h, detail) {
  detail.renderedTextKeys = h.view.container.textContent;
  detail.checkoutVisible = Boolean(h.checkout());
  detail.checkoutCalls = h.calls;
}

probe(
  "PICK-00",
  "installed TanStack Query retains approved data alongside a refetch error",
  async (detail) => {
    const { QueryClient, QueryObserver } = webRequire("@tanstack/react-query");
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    let fail = false;
    const observer = new QueryObserver(client, {
      queryKey: ["audit-pickup-refetch-shape"],
      retry: false,
      queryFn: async () => {
        if (fail) throw new Error("fixture refetch failed");
        return { allowed: true };
      },
    });
    const unsubscribe = observer.subscribe(() => {});
    try {
      await observer.refetch();
      fail = true;
      await observer.refetch();
      const result = observer.getCurrentResult();
      detail.data = result.data;
      detail.isError = result.isError;
      detail.isFetching = result.isFetching;
      detail.error = result.error?.message;
      assert.deepEqual(result.data, { allowed: true });
      assert.equal(result.isError, true);
      assert.equal(result.isFetching, false);
      assert.equal(result.error.message, "fixture refetch failed");
    } finally {
      unsubscribe();
      client.clear();
    }
  },
);

probe("PICK-01", "REGRESSION: loading attendance is not presented as confirmed absence", (detail) =>
  withPickup(
    {
      inside: { data: undefined, isLoading: true, error: null },
    },
    async (h) => {
      snapshot(h, detail);
      assert.equal(
        h.view.container.textContent.includes("pickup.verify.notInside"),
        false,
        "Loading inside roster must not be called notInside.",
      );
    },
  ),
);

probe(
  "PICK-02",
  "REGRESSION: failed attendance lookup is not presented as confirmed absence",
  (detail) =>
    withPickup(
      {
        inside: { data: undefined, isLoading: false, error: new Error("fixture offline") },
      },
      async (h) => {
        snapshot(h, detail);
        assert.equal(
          h.view.container.textContent.includes("pickup.verify.notInside"),
          false,
          "Failed inside roster must not be called notInside.",
        );
      },
    ),
);

probe("PICK-03", "confirmed presence and allowed recipient can record one departure", (detail) =>
  withPickup({}, async (h) => {
    assert.ok(h.checkout());
    await h.confirm();
    snapshot(h, detail);
    detail.toasts = h.toasts;
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].childId, "audit-child");
    assert.equal(h.calls[0].guardianId, "audit-guardian");
    assert.deepEqual(h.toasts, ["attendance.checkedOut"]);
    assert.equal(Boolean(h.checkout()), false);
  }),
);

probe("PICK-04", "confirmed outside child cannot be checked out", (detail) =>
  withPickup(
    {
      inside: { data: [], isLoading: false, error: null },
    },
    async (h) => {
      snapshot(h, detail);
      assert.equal(Boolean(h.checkout()), false);
      assert.ok(h.view.container.textContent.includes("pickup.verify.notInside"));
      assert.equal(h.calls.length, 0);
    },
  ),
);

probe("PICK-05", "explicitly denied recipient has no checkout action", (detail) =>
  withPickup(
    {
      verify: {
        data: { allowed: false, reason: "fixture authorization expired" },
        isLoading: false,
        isFetching: false,
        error: null,
      },
    },
    async (h) => {
      snapshot(h, detail);
      assert.ok(h.view.container.textContent.includes("pickup.verify.denied"));
      assert.equal(Boolean(h.checkout()), false);
      assert.equal(h.calls.length, 0);
    },
  ),
);

probe(
  "PICK-06",
  "verification failure without cached approval is unknown rather than denied",
  (detail) =>
    withPickup(
      {
        verify: {
          data: undefined,
          isLoading: false,
          isFetching: false,
          error: new Error("fixture offline"),
        },
      },
      async (h) => {
        snapshot(h, detail);
        assert.ok(h.view.container.textContent.includes("pickup.verify.unknown"));
        assert.equal(h.view.container.textContent.includes("pickup.verify.denied"), false);
        assert.equal(Boolean(h.checkout()), false);
      },
    ),
);

probe(
  "PICK-07",
  "verification loading exposes loading rather than denial and prevents checkout",
  (detail) =>
    withPickup(
      {
        verify: { data: undefined, isLoading: true, isFetching: true, error: null },
      },
      async (h) => {
        snapshot(h, detail);
        assert.ok(h.view.container.textContent.includes("common.state.loading"));
        assert.equal(h.view.container.textContent.includes("pickup.verify.denied"), false);
        assert.equal(Boolean(h.checkout()), false);
      },
    ),
);

probe(
  "PICK-08",
  "authorization rejected at confirmation replaces approval and removes checkout",
  (detail) =>
    withPickup(
      {
        confirmError: { fixtureApiError: true, status: 403, code: "PERMISSION_EXPIRED" },
      },
      async (h) => {
        assert.ok(h.checkout());
        await h.confirm();
        snapshot(h, detail);
        detail.refetches = h.refetches();
        assert.equal(h.calls.length, 1);
        assert.equal(Boolean(h.checkout()), false);
        assert.ok(h.view.container.textContent.includes("pickup.verify.denied"));
        assert.equal(h.refetches(), 1);
      },
    ),
);

probe("PICK-09", "switching children clears previous recipient approval", (detail) =>
  withPickup({}, async (h) => {
    assert.ok(h.checkout());
    await h.secondChild();
    snapshot(h, detail);
    assert.equal(Boolean(h.checkout()), false);
    assert.ok(h.view.container.textContent.includes("pickup.verify.selectBoth"));
    assert.equal(h.calls.length, 0);
  }),
);

probe(
  "PICK-10",
  "REGRESSION: cached approval with a failed verification cannot submit while verdict is unknown",
  (detail) =>
    withPickup({}, async (h) => {
      detail.checkoutVisibleBeforeRecheckFailure = Boolean(h.checkout());
      assert.ok(h.checkout());
      h.state.verify = { ...h.state.verify, error: new Error("fixture refetch failed") };
      await h.view.render({});
      snapshot(h, detail);
      detail.unknownVerdictBeforeAction =
        h.view.container.textContent.includes("pickup.verify.unknown");
      if (h.checkout()) await h.confirm();
      detail.checkoutCalls = h.calls;
      detail.toastsAfterAction = h.toasts;
      assert.ok(detail.unknownVerdictBeforeAction);
      assert.equal(detail.checkoutVisible, false);
      assert.equal(
        h.calls.length,
        0,
        "Unknown verification state must not retain an actionable stale approval. Server revalidation is mocked, not bypass-tested.",
      );
    }),
);

probe("PICK-11", "failed cached approval retries to success without losing identities", () =>
  withPickup({}, async (h) => {
    h.state.verify = { ...h.state.verify, error: new Error("offline") };
    await h.view.render({});
    assert.equal(Boolean(h.checkout()), false);
    const retry = [...h.view.container.querySelectorAll("button")].find(
      (b) => b.textContent === "pickup.verify.retry",
    );
    assert.ok(retry);
    await React.act(async () => retry.click());
    assert.equal(h.refetches(), 1);
    h.state.verify = { ...h.state.verify, error: null };
    await h.view.render({});
    assert.ok(h.checkout());
    await h.confirm();
    assert.equal(h.calls.length, 1);
  }),
);

probe("PICK-12", "background verification cannot retain actionable cached approval", () =>
  withPickup({}, async (h) => {
    h.state.verify = { ...h.state.verify, isFetching: true };
    await h.view.render({});
    assert.equal(Boolean(h.checkout()), false);
    assert.ok(h.view.container.textContent.includes("common.state.loading"));
  }),
);

probe("PICK-13", "presence failure offers retry and successful roster restores confirmation", () =>
  withPickup(
    {
      inside: {
        data: undefined,
        isLoading: false,
        isFetching: false,
        error: new Error("offline"),
        refetch: async () => {},
      },
    },
    async (h) => {
      assert.ok(h.view.container.textContent.includes("pickup.verify.presenceUnavailable"));
      assert.equal(Boolean(h.checkout()), false);
      let retries = 0;
      h.state.inside.refetch = async () => {
        retries++;
      };
      const retry = [...h.view.container.querySelectorAll("button")].find(
        (b) => b.textContent === "common.actions.retry",
      );
      await React.act(async () => retry.click());
      assert.equal(retries, 1);
      h.state.inside = { ...h.state.inside, error: null, data: [{ childId: "audit-child" }] };
      await h.view.render({});
      assert.ok(h.checkout());
    },
  ),
);

probe("PICK-14", "cached presence with failed background fetch cannot authorize checkout", () =>
  withPickup(
    {
      inside: {
        data: [{ childId: "audit-child" }],
        isLoading: false,
        isFetching: false,
        error: new Error("offline"),
        refetch: async () => {},
      },
    },
    async (h) => {
      assert.ok(h.view.container.textContent.includes("pickup.verify.presenceUnavailable"));
      assert.equal(Boolean(h.checkout()), false);
      assert.equal(h.calls.length, 0);
    },
  ),
);
