const { test } = require("node:test");
const assert = require("node:assert/strict");
const { apiHarness } = require("./load-source.cjs");
test("staff profile resolves nested role labels and login timestamps", async () => {
  const h = apiHarness("src/api/endpoints/admin.ts");
  h.reply("get", "/users/staff/roles", [
    {
      roleId: "role",
      branchId: "branch",
      role: { code: "teacher", nameUz: "Tarbiyachi", nameRu: "Воспитатель" },
      branch: { code: "main" },
    },
  ]);
  h.reply("get", "/users/staff/login-history", [
    { id: "attempt", attemptedAt: "2026-10-24T03:00:00Z", success: true },
  ]);
  const [role] = await h.endpoints.usersApi.roles("staff");
  assert.equal(role.code, "teacher");
  assert.equal(role.nameRu, "Воспитатель");
  assert.equal(role.branchName, "main");
  assert.equal((await h.endpoints.usersApi.loginHistory("staff"))[0].at, "2026-10-24T03:00:00Z");
});
