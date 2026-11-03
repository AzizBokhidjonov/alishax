const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  React,
  mount,
  loadSource,
  translations,
  box,
  button,
  click,
} = require("./permission-empty-harness.cjs");

async function renderEmpty(grants, filtered = false) {
  let resets = 0;
  const { ChildrenPage } = loadSource("src/features/children/ChildrenPage.tsx", {
    "react-i18next": translations,
    "src/auth/auth-context.ts": { usePermissions: () => ({ can: (p) => grants.includes(p) }) },
    "src/hooks/use-list-params.ts": {
      useListParams: () => ({
        q: filtered ? "no-match" : "",
        filters: { groupId: "all", status: "all" },
        query: {},
        setQuery() {},
        setFilter() {},
        setPage() {},
        setLimit() {},
        reset() {
          resets++;
        },
      }),
    },
    "src/features/children/api.ts": {
      useChildren: () => ({
        data: { data: [], meta: { total: 0 } },
        isLoading: false,
        isFetching: false,
        isPlaceholderData: false,
        dataUpdatedAt: 0,
        refetch() {},
      }),
      useDeleteChild: () => ({
        mutate() {
          throw new Error("Unexpected delete");
        },
      }),
    },
    "src/lib/errors.ts": {
      isForbidden: () => false,
      errorTraceId: () => undefined,
      errorMessage: () => "error",
    },
    "src/components/ui/button.tsx": { Button: button },
    "src/components/ui/tabs.tsx": { Tabs: box, TabsList: box, TabsTrigger: box },
    "src/components/common/PageHeader.tsx": {
      PageHeader: ({ children }) =>
        React.createElement("header", { "data-region": "header" }, children),
    },
    "src/components/common/EmptyState.tsx": {
      EmptyState: ({ action }) =>
        React.createElement("section", { "data-region": "empty" }, action),
    },
    "src/components/common/TableCard.tsx": { TableCard: box, TableSkeleton: () => null },
    "src/components/common/ListPagination.tsx": { ListPagination: () => null },
    "src/components/common/RefreshButton.tsx": { RefreshButton: () => null },
    "src/features/children/components/ChildFilters.tsx": { ChildFilters: () => null },
    "src/features/children/components/ChildRow.tsx": { ChildRow: () => null },
    "src/features/children/components/ChildEnrollmentWizard.tsx": {
      ChildEnrollmentWizard: ({ trigger }) =>
        React.createElement("div", { "data-enrollment-entry": true }, trigger),
    },
  });
  const view = await mount(ChildrenPage);
  return {
    view,
    resets: () => resets,
    entries: (region) =>
      view.container.querySelectorAll(`[data-region=${region}] [data-enrollment-entry]`).length,
  };
}

for (const [permission, expected] of [
  ["child:create", 1],
  ["child:update", 0],
  ["child:read", 0],
]) {
  test(`${permission}: header and empty state consistently require creation permission`, async () => {
    const h = await renderEmpty(["child:read", permission]);
    try {
      assert.equal(h.entries("header"), expected);
      assert.equal(h.entries("empty"), expected);
    } finally {
      await h.view.close();
    }
  });
}

test("no-result filters retain a working clear action", async () => {
  const h = await renderEmpty(["child:read", "child:create"], true);
  try {
    assert.equal(h.entries("empty"), 0);
    const clear = h.view.container.querySelector("[data-region=empty] button");
    assert.equal(clear.textContent, "common.filters.clear");
    await click(clear);
    assert.equal(h.resets(), 1);
  } finally {
    await h.view.close();
  }
});
