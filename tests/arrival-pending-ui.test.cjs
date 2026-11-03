const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadSource } = require("./load-source.cjs");
const { React, mount } = require("./dom.cjs");
const { todayIso } = loadSource("src/lib/dates.ts");

async function pendingView(entry, name, run) {
  const at = new Date().toISOString();
  const state = { items: [{ childId: "child", at, state: "pending" }] };
  const wrapper = ({ children }) => React.createElement("div", null, children);
  const loaded = loadSource(entry, {
    "src/api/config.ts": { API_BASE_URL: "https://audit.invalid/api" },
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "src/auth/auth-context.ts": { usePermissions: () => ({ can: () => true }) },
    "src/features/attendance/checkin-queue.ts": { useCheckInQueue: () => state },
    "src/components/common/AuthImage.tsx": { AuthAvatar: () => null },
    "src/components/common/StatusBadge.tsx": {
      AttendanceBadge: ({ status }) => React.createElement("span", null, status),
    },
    "src/components/ui/button.tsx": { Button: (props) => React.createElement("button", props) },
    "src/components/ui/dropdown-menu.tsx": Object.fromEntries(
      [
        "DropdownMenu",
        "DropdownMenuContent",
        "DropdownMenuItem",
        "DropdownMenuLabel",
        "DropdownMenuTrigger",
      ].map((key) => [key, wrapper]),
    ),
    "src/features/attendance/components/CheckOutDialog.tsx": {
      CheckOutDialog: () =>
        React.createElement("button", { "data-testid": "checkout" }, "Check out"),
    },
  });
  const props = {
    row: { childId: "child", id: "record", date: todayIso(), checkInAt: at },
    name: "Audit child",
    canManage: true,
    onCheckIn() {},
    onSetStatus() {},
  };
  const view = await mount(loaded[name], props);
  try {
    await run({ state, view, props });
  } finally {
    await view.close();
  }
}

for (const component of ["AttendanceCard", "QuickMarkRow"]) {
  test(`${component}: unresolved arrival is explicitly pending and cannot start checkout`, () =>
    pendingView(`src/features/attendance/components/${component}.tsx`, component, async (h) => {
      assert.ok(h.view.container.textContent.includes("attendance.recovery.unconfirmed"));
      assert.equal(h.view.container.querySelector("[data-testid=checkout]"), null);
      if (component === "QuickMarkRow") {
        assert.ok(
          [...h.view.container.querySelectorAll("button")].every((button) => button.disabled),
        );
        assert.equal(h.view.container.querySelector("[aria-pressed=true]"), null);
      }
      h.state.items = [];
      await h.view.render(h.props);
      assert.ok(h.view.container.querySelector("[data-testid=checkout]"));
      assert.equal(h.view.container.textContent.includes("attendance.recovery.unconfirmed"), false);
    }));
}
