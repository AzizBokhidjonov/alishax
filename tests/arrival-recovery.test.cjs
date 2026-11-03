const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadSource } = require("./load-source.cjs");
const { ApiError, isApiError } = loadSource("src/api/error.ts");

async function harness(run) {
  const original = { window: global.window, setTimeout, clearTimeout, fetch: global.fetch };
  const storage = new Map(),
    timers = new Map(),
    events = new Map(),
    calls = [];
  let outcome = async (dto) => ({ id: "record", ...dto });
  let list = async () => ({ data: [] });
  let storageFails = false,
    id = 0;
  global.fetch = () => {
    throw Error("Network forbidden");
  };
  global.window = {
    localStorage: {
      get length() {
        return storage.size;
      },
      key: (index) => [...storage.keys()][index] ?? null,
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        if (storageFails) throw Error("Quota");
        storage.set(key, value);
      },
      removeItem: (key) => {
        if (storageFails) throw Error("Quota");
        storage.delete(key);
      },
    },
    addEventListener: (name, fn) => events.set(name, fn),
  };
  global.setTimeout = (fn, delay) => {
    timers.set(++id, { fn, delay });
    return id;
  };
  global.clearTimeout = (key) => timers.delete(key);
  const mocks = {
    react: { useSyncExternalStore: (_subscribe, snapshot) => snapshot() },
    "src/api/index.ts": {
      ApiError,
      isApiError,
      attendanceApi: {
        checkIn: async (dto) => {
          calls.push({ ...dto });
          return outcome(dto);
        },
        list: async (params) => list(params),
      },
    },
  };
  const fresh = (base = "https://audit.invalid/api") =>
    loadSource("src/features/attendance/checkin-queue.ts", {
      ...mocks,
      "src/api/config.ts": { API_BASE_URL: base },
    });
  const queue = fresh();
  queue.setCheckInQueueScope("operator-A", true);
  try {
    await run({
      queue,
      fresh,
      storage,
      timers,
      calls,
      events,
      outcome: (fn) => {
        outcome = fn;
      },
      list: (fn) => {
        list = fn;
      },
      failStorage: () => {
        storageFails = true;
      },
    });
  } finally {
    global.window = original.window;
    global.setTimeout = original.setTimeout;
    global.clearTimeout = original.clearTimeout;
    global.fetch = original.fetch;
  }
}

test("arrival persisted before first network response; same payload survives reload and retry", () =>
  harness(async (h) => {
    let reject;
    h.outcome(
      () =>
        new Promise((_resolve, no) => {
          reject = no;
        }),
    );
    const at = new Date().toISOString();
    const request = h.queue.submitCheckIn({ childId: "child", at });
    assert.equal(h.calls.length, 1);
    const saved = JSON.parse([...h.storage.values()][0]);
    assert.equal(saved.at, at);
    assert.equal(saved.childId, "child");
    assert.deepEqual(Object.keys(saved).sort(), ["at", "attempts", "childId", "state"]);
    reject(new ApiError({ code: "NETWORK", status: 0 }));
    await assert.rejects(request);
    const restored = h.fresh();
    restored.setCheckInQueueScope("operator-A", true);
    assert.equal(restored.useCheckInQueue().items[0].at, at);
    h.outcome(async (dto) => ({ id: "record", ...dto }));
    await restored.flushCheckInQueue();
    assert.deepEqual(h.calls[0], h.calls[1]);
    assert.equal(restored.usePendingCheckIns(), 0);
    assert.equal(h.storage.size, 0);
  }));

test("concurrent submissions and flush share one pending request", () =>
  harness(async (h) => {
    let resolve;
    h.outcome(
      (dto) =>
        new Promise((yes) => {
          resolve = () => yes({ id: "record", ...dto });
        }),
    );
    const first = h.queue.submitCheckIn({ childId: "child" });
    const second = h.queue.submitCheckIn({ childId: "child" });
    const flushing = h.queue.flushCheckInQueue();
    assert.equal(first, second);
    assert.equal(h.calls.length, 1);
    resolve();
    await Promise.all([first, second, flushing]);
    assert.equal(h.queue.usePendingCheckIns(), 0);
  }));

test("retryable transport/server failures retain original time; duplicate acknowledgment reconciles", () =>
  harness(async (h) => {
    for (const status of [0, 429, 503]) {
      h.outcome(async () => {
        throw new ApiError({ code: "NETWORK", status });
      });
      h.queue.enqueueCheckIn("child");
      await h.queue.flushCheckInQueue();
      assert.equal(h.queue.useCheckInQueue().items[0].state, "pending");
    }
    assert.ok(h.calls.every((row) => row.at === h.calls[0].at));
    h.outcome(async () => {
      throw new ApiError({ code: "ALREADY_CHECKED_IN", status: 409 });
    });
    await h.queue.flushCheckInQueue();
    assert.equal(h.queue.usePendingCheckIns(), 0);
  }));

test("permanent rejection remains discoverable with child and reason, without automatic retry", () =>
  harness(async (h) => {
    h.outcome(async () => {
      throw new ApiError({ code: "FORBIDDEN", status: 403 });
    });
    h.queue.enqueueCheckIn("child");
    await h.queue.flushCheckInQueue();
    const item = h.queue.useCheckInQueue().items[0];
    assert.equal(item.state, "review");
    assert.equal(item.childId, "child");
    assert.equal(item.errorCode, "FORBIDDEN");
    await h.queue.flushCheckInQueue();
    assert.equal(h.calls.length, 1);
    const restored = h.fresh();
    restored.setCheckInQueueScope("operator-A", true);
    assert.equal(restored.useCheckInQueue().items[0].state, "review");
  }));

test("previous-day arrival is never replayed as today and reconciles by its original day", () =>
  harness(async (h) => {
    const at = new Date(Date.now() - 86_400_000).toISOString();
    h.queue.enqueueCheckIn("child", at);
    await h.queue.flushCheckInQueue();
    assert.equal(h.calls.length, 0);
    assert.equal(h.queue.useCheckInQueue().items[0].state, "review");
    h.queue.retryCheckIn("child");
    assert.equal(h.calls.length, 0);
    let query;
    h.list(async (params) => {
      query = params;
      return { data: [{ childId: "child", checkInAt: at }] };
    });
    await h.queue.reconcileCheckIn("child");
    assert.equal(query.childId, "child");
    assert.equal(
      query.date,
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(new Date(at)),
    );
    assert.equal(h.queue.usePendingCheckIns(), 0);
  }));

test("reconciliation without confirmed arrival preserves review until explicit reviewed removal", () =>
  harness(async (h) => {
    h.queue.enqueueCheckIn("child");
    await h.queue.reconcileCheckIn("child");
    assert.equal(h.queue.useCheckInQueue().items[0].state, "review");
    h.queue.dismissCheckIn("child");
    assert.equal(h.queue.usePendingCheckIns(), 0);
  }));

test("logout pauses queued retries; another account cannot see or send them", () =>
  harness(async (h) => {
    h.queue.enqueueCheckIn("child-A");
    h.queue.setCheckInQueueScope(null, false);
    await h.queue.flushCheckInQueue();
    assert.equal(h.calls.length, 0);
    h.queue.setCheckInQueueScope("operator-B", true);
    assert.equal(h.queue.usePendingCheckIns(), 0);
    await h.queue.flushCheckInQueue();
    assert.equal(h.calls.length, 0);
    h.queue.setCheckInQueueScope("operator-A", true);
    assert.equal(h.queue.usePendingCheckIns(), 1);
  }));

test("late response from old account cannot remove a new account pending arrival", () =>
  harness(async (h) => {
    let resolve;
    h.outcome(
      (dto) =>
        new Promise((yes) => {
          resolve = () => yes({ id: "record", ...dto });
        }),
    );
    const request = h.queue.submitCheckIn({ childId: "child" });
    h.queue.setCheckInQueueScope("operator-B", true);
    h.queue.enqueueCheckIn("child");
    resolve();
    await request;
    assert.equal(h.queue.usePendingCheckIns(), 1);
    h.queue.setCheckInQueueScope("operator-A", true);
    assert.equal(h.queue.usePendingCheckIns(), 1); // Launched request outcome is reconciled under A later.
  }));

test("a prepared old-session operation cannot be sent using the new session", () =>
  harness(async (h) => {
    const generation = h.queue.checkInQueueGeneration();
    h.queue.setCheckInQueueScope("operator-B", true);
    await assert.rejects(h.queue.submitCheckIn({ childId: "child" }, generation));
    assert.equal(h.calls.length, 0);
    assert.equal(h.queue.usePendingCheckIns(), 0);
  }));

test("storage failure exposes warning and unload protection, preserving same-tab recovery", () =>
  harness(async (h) => {
    h.failStorage();
    h.queue.enqueueCheckIn("child");
    assert.equal(h.queue.useCheckInQueue().durable, false);
    let prevented = false;
    h.events.get("beforeunload")({
      preventDefault: () => {
        prevented = true;
      },
    });
    assert.equal(prevented, true);
    h.queue.setCheckInQueueScope(null, false);
    h.queue.setCheckInQueueScope("operator-A", true);
    assert.equal(h.queue.usePendingCheckIns(), 1);
  }));

test("revoked check-in permission preserves pending record without resending", () =>
  harness(async (h) => {
    h.queue.enqueueCheckIn("child");
    h.queue.setCheckInQueueScope("operator-A", false);
    await h.queue.flushCheckInQueue();
    assert.equal(h.calls.length, 0);
    assert.equal(h.queue.usePendingCheckIns(), 1);
  }));

test("two tab instances cannot overwrite unrelated pending arrivals", () =>
  harness(async (h) => {
    h.outcome(async (dto) => {
      if (dto.childId === "child-B") throw new TypeError("offline");
      return { id: "record", ...dto };
    });
    const other = h.fresh();
    other.setCheckInQueueScope("operator-A", true);
    h.queue.enqueueCheckIn("child-A");
    other.enqueueCheckIn("child-B");
    assert.equal(h.storage.size, 2);
    await h.queue.flushCheckInQueue();
    assert.equal(h.storage.size, 1);
    const restored = h.fresh();
    restored.setCheckInQueueScope("operator-A", true);
    assert.equal(restored.useCheckInQueue().items[0].childId, "child-B");
  }));

test("another tab reuses the persisted arrival time and clears its confirmation", () =>
  harness(async (h) => {
    const other = h.fresh();
    other.setCheckInQueueScope("operator-A", true);
    const original = h.queue.enqueueCheckIn("child");
    await other.submitCheckIn({ childId: "child" });
    assert.equal(h.calls[0].at, original.at);
    assert.equal(h.storage.size, 0);
  }));

test("actual mutation hook persists before cache wait and rejects old-session submission", () =>
  harness(async (h) => {
    let resume;
    const cancel = new Promise((resolve) => {
      resume = resolve;
    });
    let patched = 0,
      applied = 0;
    const { useCheckIn } = loadSource("src/features/attendance/use-check-in.ts", {
      react: { useEffect: (fn) => fn(), useRef: (value) => ({ current: value }) },
      "@tanstack/react-query": {
        useMutation: (options) => options,
        useQueryClient: () => ({ cancelQueries: () => cancel, invalidateQueries() {} }),
      },
      "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
      sonner: { toast: { info() {} } },
      "src/api/index.ts": { isApiError },
      "src/lib/query.ts": { useErrorToast: () => () => {} },
      "src/features/attendance/checkin-queue.ts": h.queue,
      "src/features/attendance/board-cache.ts": {
        patchBoard: () => {
          patched++;
        },
        applyRecord: () => {
          applied++;
        },
        restoreBoard() {},
      },
    });
    const mutation = useCheckIn(),
      dto = { childId: "child" };
    const preparing = mutation.onMutate(dto);
    assert.equal(h.storage.size, 1);
    assert.equal(h.calls.length, 0);
    h.queue.setCheckInQueueScope("operator-B", true);
    resume();
    const context = await preparing;
    assert.equal(patched, 0);
    await assert.rejects(mutation.mutationFn(dto));
    assert.equal(h.calls.length, 0);
    mutation.onSuccess({ id: "old-record" }, dto, context);
    assert.equal(applied, 0);
  }));

test("restoring a paused account uses newer persisted records, not stale paused memory", () =>
  harness(async (h) => {
    h.queue.enqueueCheckIn("child-A");
    h.queue.setCheckInQueueScope(null, false);
    const other = h.fresh();
    other.setCheckInQueueScope("operator-A", true);
    await other.reconcileCheckIn("child-A");
    other.dismissCheckIn("child-A");
    other.enqueueCheckIn("child-B");
    h.queue.setCheckInQueueScope("operator-A", true);
    assert.deepEqual(
      h.queue.useCheckInQueue().items.map((item) => item.childId),
      ["child-B"],
    );
  }));

test("another tab reviewed removal prevents a stale tab from automatically resending", () =>
  harness(async (h) => {
    h.queue.enqueueCheckIn("child");
    const other = h.fresh();
    other.setCheckInQueueScope("operator-A", true);
    await other.reconcileCheckIn("child");
    other.dismissCheckIn("child");
    await h.queue.flushCheckInQueue();
    assert.equal(h.calls.length, 0);
    assert.equal(h.queue.usePendingCheckIns(), 0);
  }));

test("late request failure cannot resurrect a record reviewed and removed in another tab", () =>
  harness(async (h) => {
    let reject;
    h.outcome(
      () =>
        new Promise((_resolve, no) => {
          reject = no;
        }),
    );
    const request = h.queue.submitCheckIn({ childId: "child" });
    const other = h.fresh();
    other.setCheckInQueueScope("operator-A", true);
    await other.reconcileCheckIn("child");
    other.dismissCheckIn("child");
    reject(new TypeError("offline"));
    await assert.rejects(request);
    assert.equal(h.storage.size, 0);
    assert.equal(h.queue.usePendingCheckIns(), 0);
  }));

test("a waiting flush does not recreate a later record removed by another tab", () =>
  harness(async (h) => {
    let resolve;
    h.outcome(
      (dto) =>
        new Promise((yes) => {
          resolve = () => yes({ id: "record", ...dto });
        }),
    );
    h.queue.enqueueCheckIn("child-A");
    h.queue.enqueueCheckIn("child-B");
    const flushing = h.queue.flushCheckInQueue();
    const other = h.fresh();
    other.setCheckInQueueScope("operator-A", true);
    await other.reconcileCheckIn("child-B");
    other.dismissCheckIn("child-B");
    resolve();
    await flushing;
    assert.deepEqual(
      h.calls.map((dto) => dto.childId),
      ["child-A"],
    );
    assert.equal(h.storage.size, 0);
  }));

test("settling one arrival does not overwrite another tab review state for an unrelated child", () =>
  harness(async (h) => {
    let resolve;
    h.outcome(
      (dto) =>
        new Promise((yes) => {
          resolve = () => yes({ id: "record", ...dto });
        }),
    );
    h.queue.enqueueCheckIn("child-B");
    const request = h.queue.submitCheckIn({ childId: "child-A" });
    const other = h.fresh();
    other.setCheckInQueueScope("operator-A", true);
    await other.reconcileCheckIn("child-B");
    resolve();
    await request;
    const restored = h.fresh();
    restored.setCheckInQueueScope("operator-A", true);
    assert.equal(restored.useCheckInQueue().items[0].state, "review");
  }));

test("storage event refreshes the visible pending state", () =>
  harness(async (h) => {
    h.queue.enqueueCheckIn("child");
    const key = [...h.storage.keys()][0];
    h.storage.set(key, JSON.stringify({ ...JSON.parse(h.storage.get(key)), state: "review" }));
    h.events.get("storage")({ key });
    assert.equal(h.queue.useCheckInQueue().items[0].state, "review");
  }));

test("different API environments cannot recover each other arrival queue", () =>
  harness(async (h) => {
    h.queue.enqueueCheckIn("child");
    const otherEnvironment = h.fresh("https://other.invalid/api");
    otherEnvironment.setCheckInQueueScope("operator-A", true);
    assert.equal(otherEnvironment.usePendingCheckIns(), 0);
    await otherEnvironment.flushCheckInQueue();
    assert.equal(h.calls.length, 0);
  }));
