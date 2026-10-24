const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { renderToString } = require("react-dom/server");
const { loadSource } = require("./load-source.cjs");
const {
  createRootRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
  RouterProvider,
} = require("@tanstack/react-router");

for (const [slug, feature, listName, detailName, idProp] of [
  ["bolalar", "children", "ChildrenPage", "ChildDetailPage", "childId"],
  ["otaonalar", "guardians", "GuardiansPage", "GuardianDetailPage", "guardianId"],
  ["guruhlar", "groups", "GroupsPage", "GroupDetailPage", "groupId"],
  ["xodimlar", "users", "UsersPage", "UserDetailPage", "userId"],
])
  test(slug + " renders details after list navigation and direct loading", async () => {
    const mocks = {
      ["src/features/" + feature + "/" + listName + ".tsx"]: {
        [listName]: () => React.createElement("h1", null, "list"),
      },
      ["src/features/" + feature + "/" + detailName + ".tsx"]: {
        [detailName]: (props) => React.createElement("h1", null, "detail:" + props[idProp]),
      },
    };
    for (const direct of [false, true]) {
      const root = createRootRoute({ component: Outlet });
      const parent = loadSource("src/routes/" + slug + ".tsx", mocks).Route.update({
        id: "/" + slug,
        path: "/" + slug,
        getParentRoute: () => root,
      });
      const index = loadSource("src/routes/" + slug + ".index.tsx", mocks).Route.update({
        id: "/",
        path: "/",
        getParentRoute: () => parent,
      });
      const detail = loadSource("src/routes/" + slug + ".$id.tsx", mocks).Route.update({
        id: "/$id",
        path: "/$id",
        getParentRoute: () => parent,
      });
      const router = createRouter({
        routeTree: root.addChildren([parent.addChildren([index, detail])]),
        history: createMemoryHistory({
          initialEntries: ["/" + slug + (direct ? "/record-1" : "")],
        }),
        defaultPendingMinMs: 0,
      });
      await router.load();
      const rendered = () =>
        renderToString(React.createElement(RouterProvider, { router })).replace(/<!--.*?-->/g, "");
      if (!direct) {
        assert.equal(rendered(), "<h1>list</h1>");
        await router.navigate({ to: "/" + slug + "/record-1" });
        await router.load();
      }
      assert.equal(rendered(), "<h1>detail:record-1</h1>");
      await router.navigate({ to: "/" + slug });
      await router.load();
      assert.equal(rendered(), "<h1>list</h1>");
    }
  });
