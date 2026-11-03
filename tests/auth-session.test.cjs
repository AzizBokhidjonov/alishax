const { test } = require("node:test");
const assert = require("node:assert/strict");
const { React } = require("./dom.cjs");
const { me, deferred, harness } = require("./auth-session-harness.cjs");

test("session bootstrap accepts a valid session and scopes both recovery stores", async () => {
  const h = await harness({ refresh: async () => true });
  try {
    assert.equal(h.value().user.id, "A");
    assert.deepEqual(h.calls.queue.at(-1), ["A", true]);
    assert.deepEqual(h.calls.payments.at(-1), ["A", true]);
  } finally {
    await h.view.close();
  }
});
test("missing refresh cookie yields anonymous state without requesting private session", async () => {
  const h = await harness();
  try {
    assert.equal(h.value().status, "anonymous");
    assert.equal(h.calls.session.length, 0);
  } finally {
    await h.view.close();
  }
});
test("network failure exposes retry and a successful retry establishes the session", async () => {
  const h = await harness({
    refresh: async () => {
      throw new TypeError("offline");
    },
  });
  try {
    assert.equal(h.value().status, "error");
    h.refresh(async () => true);
    await React.act(() => h.value().retrySession());
    assert.equal(h.value().user.id, "A");
  } finally {
    await h.view.close();
  }
});
test("session deadline aborts a hung request and ignores its late response", async () => {
  const d = deferred();
  const h = await harness({ timeout: 15, refresh: () => d.promise });
  try {
    await React.act(() => new Promise((r) => setTimeout(r, 25)));
    assert.equal(h.value().status, "error");
    assert.equal(h.calls.refresh[0].aborted, true);
    await React.act(async () => d.resolve(true));
    assert.equal(h.value().status, "error");
    assert.equal(h.calls.session.length, 0);
  } finally {
    await h.view.close();
  }
});
test("cancel stops bootstrap immediately and never restores its later result", async () => {
  const d = deferred();
  const h = await harness({ refresh: () => d.promise });
  try {
    await React.act(async () => h.value().cancelSession());
    assert.equal(h.value().status, "anonymous");
    assert.equal(h.calls.refresh[0].aborted, true);
    await React.act(async () => d.resolve(true));
    assert.equal(h.value().status, "anonymous");
  } finally {
    await h.view.close();
  }
});
test("logout immediately clears permissions and queues before waiting for the server", async () => {
  const logout = deferred();
  const h = await harness({ refresh: async () => true, api: { logout: () => logout.promise } });
  try {
    let pending;
    await React.act(async () => {
      pending = h.value().logout();
    });
    assert.equal(h.value().status, "anonymous");
    assert.deepEqual(h.value().permissions, {});
    assert.deepEqual(h.calls.queue.at(-1), [null, false]);
    assert.deepEqual(h.calls.payments.at(-1), [null, false]);
    await React.act(async () => logout.resolve());
    await pending;
  } finally {
    await h.view.close();
  }
});
for (const action of ["logout", "expiry"])
  test(`late refreshMe cannot revive authentication after ${action}`, async () => {
    const h = await harness({ refresh: async () => true });
    const d = deferred();
    h.api.session = () => d.promise;
    try {
      let pending;
      await React.act(async () => {
        pending = h.value().refreshMe();
      });
      await React.act(async () => (action === "logout" ? h.value().logout() : h.expire()));
      await React.act(async () => d.resolve(me("A")));
      await pending;
      assert.equal(h.value().status, "anonymous");
      assert.equal(h.value().user, null);
    } finally {
      await h.view.close();
    }
  });
test("old refreshMe cannot replace a newly signed-in account", async () => {
  const h = await harness({ refresh: async () => true });
  const d = deferred();
  h.api.session = () => d.promise;
  try {
    let pending;
    await React.act(async () => {
      pending = h.value().refreshMe();
    });
    h.api.session = async () => me("B");
    await React.act(() => h.value().login("B", "synthetic"));
    await React.act(async () => d.resolve(me("A")));
    await pending;
    assert.equal(h.value().user.id, "B");
  } finally {
    await h.view.close();
  }
});
test("a late bootstrap cannot overwrite a newer explicit login", async () => {
  const d = deferred();
  const h = await harness({ refresh: () => d.promise });
  try {
    h.api.session = async () => me("B");
    await React.act(() => h.value().login("B", "synthetic"));
    await React.act(async () => d.resolve(true));
    assert.equal(h.value().user.id, "B");
  } finally {
    await h.view.close();
  }
});
test("an earlier login completion cannot replace the latest login", async () => {
  const first = deferred();
  const h = await harness({
    api: { login: ({ login }) => (login === "A" ? first.promise : Promise.resolve()) },
  });
  try {
    let pending;
    await React.act(async () => {
      pending = h
        .value()
        .login("A", "synthetic")
        .catch((e) => e.name);
    });
    h.api.session = async () => me("B");
    await React.act(() => h.value().login("B", "synthetic"));
    await React.act(async () => first.resolve());
    assert.equal(await pending, "AbortError");
    assert.equal(h.value().user.id, "B");
  } finally {
    await h.view.close();
  }
});
test("unmount cancels active bootstrap and releases session ownership", async () => {
  const d = deferred();
  const h = await harness({ refresh: () => d.promise });
  await h.view.close();
  assert.equal(h.calls.refresh[0].aborted, true);
  d.resolve(true);
  assert.deepEqual(h.calls.queue.at(-1), [null, false]);
});
