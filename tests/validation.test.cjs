const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadSource } = require("./load-source.cjs");
const common = loadSource("src/components/forms/schemas/common.ts");
const dates = loadSource("src/lib/dates.ts");
const { ApiError, fieldErrors } = loadSource("src/api/error.ts");

test("calendar validation rejects rollover dates and accepts leap days", () => {
  for (const value of ["2026-02-31", "2025-02-29", "2026-13-01", "2026-00-10"]) {
    assert.equal(common.isoDate.safeParse(value).success, false, value);
    assert.equal(common.optionalIsoDate.safeParse(value).success, false, value);
    assert.equal(dates.isoToDate(value), undefined, value);
  }
  assert.equal(common.isoDate.safeParse("2024-02-29").success, true);
  assert.equal(common.optionalIsoDate.parse(""), undefined);
});

test("phone requires digits rather than punctuation", () => {
  for (const value of ["-------", "( ) ( )", "+12 34"]) {
    assert.equal(common.phone.safeParse(value).success, false, value);
  }
  assert.equal(common.phone.safeParse("+998 (90) 123-45-67").success, true);
});

test("payment date inputs are Tashkent time regardless of the computer timezone", () => {
  const original = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/Los_Angeles", "Asia/Tashkent"]) {
      process.env.TZ = zone;
      assert.equal(dates.localInputToIso("2026-10-24T09:30"), "2026-10-24T04:30:00.000Z");
      assert.equal(dates.isoToLocalInput("2026-10-24T04:30:00Z"), "2026-10-24T09:30");
    }
    assert.throws(() => dates.localInputToIso("2026-02-31T09:30"));
    assert.throws(() => dates.localInputToIso(""));
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test("server validation errors use real field paths and localized messages", () => {
  const errors = fieldErrors(
    new ApiError({
      status: 422,
      code: "VALIDATION_FAILED",
      details: {
        email: ["email must be an email"],
        "medications.0.validFrom": ["validFrom must be a valid ISO 8601 date string"],
      },
    }),
  );
  assert.equal(errors.email, "common.validation.invalidValue");
  assert.equal(errors["medications.0.validFrom"], "common.validation.invalidValue");
});

test("child status requires a reason and disallows future effective dates", () => {
  const { childStatusSchema } = loadSource("src/components/forms/schemas/people.ts");
  for (const reason of ["", "   ", undefined])
    assert.equal(
      childStatusSchema.safeParse({ status: "active", effectiveDate: "2026-01-01", reason })
        .success,
      false,
    );
  assert.equal(
    childStatusSchema.safeParse({
      status: "active",
      effectiveDate: "9999-01-01",
      reason: "Enrollment",
    }).success,
    false,
  );
  assert.equal(
    childStatusSchema.safeParse({
      status: "active",
      effectiveDate: "2026-01-01",
      reason: "Enrollment",
    }).success,
    true,
  );
});
