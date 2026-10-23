const { test } = require("node:test");
const assert = require("node:assert/strict");
const { React, mount } = require("./dom.cjs");
const {
  QueryClient,
  QueryClientProvider,
  useQuery,
  notifyManager,
} = require("@tanstack/react-query");
const { loadSource } = require("./load-source.cjs");
notifyManager.setScheduler(queueMicrotask);
const translations = { useTranslation: () => ({ t: (key) => key }) };

function harness() {
  const state = {
    branches: [{ id: "b1", name: "Old branch" }],
    groups: [{ id: "g1", name: "Old group" }],
  };
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  let reads = 0;
  const api = {
    settingsApi: {
      createBranch: async (dto) => {
        const item = { id: "b2", ...dto };
        state.branches.push(item);
        return item;
      },
      updateBranch: async (_id, dto) => {
        Object.assign(state.branches[0], dto);
        return state.branches[0];
      },
      update: async (dto) => ({ ...dto }),
    },
    groupsApi: {
      create: async (dto) => {
        const item = { id: "g2", ...dto };
        state.groups.push(item);
        return item;
      },
      update: async (_id, dto) => {
        Object.assign(state.groups[0], dto);
        return state.groups[0];
      },
      setStaff: async () => {
        state.groups = [{ id: "g1", name: "Assigned group" }];
      },
    },
  };
  const mocks = {
    "@/api": api,
    "react-i18next": translations,
    sonner: { toast: { success() {}, error() {} } },
    "@/auth/auth-context": {
      useBootstrapLookups: () =>
        useQuery({
          queryKey: ["auth", "bootstrap", "test-user", 1],
          queryFn: async () => {
            reads++;
            return structuredClone(state);
          },
          staleTime: Infinity,
        }),
    },
  };
  const settings = loadSource("src/features/settings/api.ts", mocks);
  const groups = loadSource("src/features/groups/api.ts", mocks);
  return {
    client,
    settings,
    groups,
    get reads() {
      return reads;
    },
  };
}

test("branch and group mutations refresh visible bootstrap choices without reloading", async () => {
  const h = harness();
  let actions;
  function Screen() {
    actions = {
      createBranch: h.settings.useCreateBranch(),
      updateBranch: h.settings.useUpdateBranch(),
      createGroup: h.groups.useCreateGroup(),
      updateGroup: h.groups.useUpdateGroup(),
      setStaff: h.groups.useSetGroupStaff("g1"),
    };
    const options = [...h.settings.useBranchOptions(), ...h.groups.useGroupOptions()];
    return React.createElement("p", null, options.map((o) => o.label).join(", "));
  }
  function App() {
    return React.createElement(
      QueryClientProvider,
      { client: h.client },
      React.createElement(Screen),
    );
  }
  const view = await mount(App);
  try {
    assert.match(view.container.textContent, /Old branch, Old group/);
    for (const [action, variables, expected] of [
      ["updateBranch", { id: "b1", dto: { name: "Renamed branch" } }, "Renamed branch"],
      ["createBranch", { code: "second", name: "New branch" }, "New branch"],
      ["updateGroup", { id: "g1", dto: { name: "Renamed group" } }, "Renamed group"],
      ["createGroup", { name: "New group" }, "New group"],
      ["setStaff", {}, "Assigned group"],
    ]) {
      await React.act(async () => {
        await actions[action].mutateAsync(variables);
      });
      assert.ok(view.container.textContent.includes(expected), view.container.textContent);
    }
    assert.equal(h.reads, 6);
  } finally {
    await view.close();
    h.client.clear();
  }
});

test("saving settings updates the cache and cancels an older settings response", async () => {
  const h = harness();
  let mutation;
  let releaseOld;
  const outdated = h.client
    .fetchQuery({
      queryKey: ["settings"],
      queryFn: () =>
        new Promise((resolve) => {
          releaseOld = resolve;
        }),
    })
    .catch(() => {});
  function Screen() {
    mutation = h.settings.useUpdateSettings();
    return null;
  }
  function App() {
    return React.createElement(
      QueryClientProvider,
      { client: h.client },
      React.createElement(Screen),
    );
  }
  const view = await mount(App);
  try {
    await React.act(async () => {
      await mutation.mutateAsync({ defaultLanguage: "uz" });
    });
    releaseOld({ defaultLanguage: "ru" });
    await outdated;
    assert.deepEqual(h.client.getQueryData(["settings"]), { defaultLanguage: "uz" });
  } finally {
    await view.close();
    h.client.clear();
  }
});
