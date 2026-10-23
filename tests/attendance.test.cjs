const { test } = require("node:test");
const assert = require("node:assert/strict");
const { apiHarness, loadSource } = require("./load-source.cjs");
const child = {
  id: "child",
  firstName: "Test",
  lastName: "Child",
  groupAssignment: [{ groupId: "group", childGroup: { name: "Sunflowers" } }],
};
const record = {
  id: "day",
  childId: "child",
  groupId: "group",
  attendanceDate: "2026-10-23T00:00:00.000Z",
  status: "present",
  child,
};

test("board retains unmarked children and normalizes recorded dates", async () => {
  const h = apiHarness("src/api/endpoints/attendance.ts");
  h.reply("get", "/attendance/board", {
    date: "2026-10-23",
    data: [
      { child, attendance: null, recorded: false },
      {
        child: { ...child, id: "second" },
        attendance: { ...record, childId: "second" },
        recorded: true,
      },
    ],
  });
  const result = await h.endpoints.attendanceApi.board();
  assert.equal(result.data[0].attendance, null);
  assert.equal(result.data[0].recorded, false);
  assert.equal(result.data[0].child.groupId, "group");
  assert.equal(result.data[0].child.groupName, "Sunflowers");
  assert.equal(result.data[1].attendance.date, "2026-10-23");
});

test("attendance journal and calendar use date-only values and visible child names", async () => {
  const h = apiHarness("src/api/endpoints/attendance.ts");
  h.reply("get", "/attendance", [record]);
  h.reply("get", "/attendance/calendar", [record]);
  const journal = await h.endpoints.attendanceApi.list();
  const calendar = await h.endpoints.attendanceApi.calendar("child", 2026, 10);
  assert.equal(journal.data[0].date, "2026-10-23");
  assert.equal(journal.data[0].childName, "Child Test");
  assert.equal(calendar[0].date, "2026-10-23");
});

test("checkout keeps the guardian request field and response pickup identity", async () => {
  const h = apiHarness("src/api/endpoints/attendance.ts");
  h.reply("post", "/attendance/check-out", { ...record, pickupGuardianId: "guardian" });
  const result = await h.endpoints.attendanceApi.checkOut({
    childId: "child",
    guardianId: "guardian",
  });
  assert.equal(result.pickupGuardianId, "guardian");
  assert.equal(result.date, "2026-10-23");
  assert.deepEqual(h.calls[0].args, [{ childId: "child", guardianId: "guardian" }]);
});

test("children without a group remain unassigned", () => {
  const { normalizeAttendanceBoard } = loadSource("src/api/adapters/attendance.ts");
  const result = normalizeAttendanceBoard({
    date: "2026-10-23",
    data: [{ child: { id: "child", groupAssignment: [] }, attendance: null }],
  });
  assert.equal(result.data[0].child.groupId, undefined);
  assert.equal(result.data[0].attendance, null);
});
