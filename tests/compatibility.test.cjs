const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { loadSource } = require("./load-source.cjs");
const translations = { useTranslation: () => ({ t: (key) => key }) };
const { recipientField } = loadSource("src/api/types/attendance.ts");

function pickupHook(verdict, recipient, fetching = false, pending = false) {
  const calls = [];
  const states = [recipient, "", null];
  let stateIndex = 0;
  const { usePickupCheckOut } = loadSource("src/features/pickup/use-pickup-checkout.ts", {
    react: { ...React, useEffect: () => {}, useState: () => [states[stateIndex++], () => {}] },
    "react-i18next": translations,
    "@/api": { recipientField },
    "@/lib/errors": {},
    "@/features/attendance/api": {
      useCheckOut: () => ({
        isPending: pending,
        mutate: (dto) => calls.push(dto),
      }),
    },
    "src/features/pickup/api.ts": {
      usePickupVerify: () => ({
        data: verdict,
        isFetching: fetching,
      }),
    },
  });
  return { hook: usePickupCheckOut("child"), calls };
}

test("pickup cannot submit a missing, denied, stale or pending verification", () => {
  for (const [verdict, fetching, pending] of [
    [undefined, false, false],
    [{ allowed: false }, false, false],
    [{ allowed: true }, true, false],
    [{ allowed: true }, false, true],
  ]) {
    const { hook, calls } = pickupHook(
      verdict,
      { kind: "guardian", id: "parent" },
      fetching,
      pending,
    );
    hook.submit();
    assert.equal(calls.length, 0);
  }
});

test("verified pickup preserves each recipient's distinct backend request field", () => {
  for (const [kind, field] of [
    ["guardian", "guardianId"],
    ["permission", "pickupPermissionId"],
    ["person", "pickupPersonId"],
  ]) {
    const { hook, calls } = pickupHook({ allowed: true }, { kind, id: "recipient" });
    hook.submit();
    assert.deepEqual(calls, [{ childId: "child", [field]: "recipient", note: undefined }]);
  }
});

test("only backend-supported notification channels pass validation", () => {
  const { sendNotificationSchema } = loadSource("src/components/forms/schemas/comms.ts");
  const message = { templateKey: "reminder", recipientIds: ["guardian"] };
  for (const channel of ["telegram", "internal"]) {
    assert.ok(sendNotificationSchema.safeParse({ ...message, channel }).success);
  }
  for (const channel of ["email", "sms"]) {
    assert.equal(sendNotificationSchema.safeParse({ ...message, channel }).success, false);
  }
});

test("existing medical envelope support keeps emergency instructions without allergies", () => {
  const { normalizeAlerts, normalizeMedical } = loadSource("src/api/types/people.ts");
  assert.deepEqual(normalizeAlerts({ allergies: [], emergencyInstructions: "Contact parent" }), [
    { allergen: "", instruction: "Contact parent" },
  ]);
  assert.deepEqual(normalizeMedical({ record: null, allergies: [], medications: [] }), {
    allergies: [],
    medications: [],
  });
});

test("new-record uploads omit entity tags until there is a real entity ID", async () => {
  const calls = [];
  const { FileUploadField } = loadSource("src/components/common/FileUploadField.tsx", {
    react: {
      ...React,
      useCallback: (callback) => callback,
      useRef: (value) => ({ current: value }),
      useState: (value) => [value, () => {}],
    },
    "react-i18next": translations,
    sonner: { toast: { success: () => {}, error: () => {} } },
    "@/lib/query": {
      useErrorToast: () => () => {
        throw new Error("Unexpected upload failure");
      },
    },
    "@/api": {
      ALLOWED_MIME: ["application/pdf"],
      MAX_UPLOAD_MB: 10,
      filesApi: {
        upload: async (...args) => {
          calls.push(args);
          return { fileId: "file" };
        },
      },
    },
  });
  function findInput(element) {
    if (!React.isValidElement(element)) return undefined;
    if (element.type === "input") return element;
    return React.Children.toArray(element.props.children).map(findInput).find(Boolean);
  }
  const file = new File(["test"], "receipt.pdf", { type: "application/pdf" });
  for (const entityId of [undefined, "payment"]) {
    const tree = FileUploadField({ entityType: "payment", entityId, onChange: () => {} });
    findInput(tree).props.onChange({ target: { files: [file], value: "receipt.pdf" } });
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.deepEqual(
    calls.map((call) => call.slice(1)),
    [
      [undefined, undefined],
      ["payment", "payment"],
    ],
  );
});
