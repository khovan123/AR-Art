import assert from "node:assert/strict";
import test from "node:test";

import { authFormSchema } from "./auth-form-schema.ts";

test("accepts a valid sign-in payload", () => {
  const result = authFormSchema.safeParse({
    mode: "signin",
    email: "user@example.com",
    password: "secret12",
  });

  assert.equal(result.success, true);
});

test("trims email and keeps valid sign-up payload", () => {
  const result = authFormSchema.safeParse({
    mode: "signup",
    email: "  user@example.com  ",
    password: "secret12",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.email, "user@example.com");
  }
});

test("rejects invalid email and short password", () => {
  const result = authFormSchema.safeParse({
    mode: "signin",
    email: "not-an-email",
    password: "123",
  });

  assert.equal(result.success, false);
  if (!result.success) {
    const fields = result.error.flatten().fieldErrors;
    assert.ok(fields.email?.length);
    assert.ok(fields.password?.length);
  }
});

test("rejects unsupported auth mode", () => {
  const result = authFormSchema.safeParse({
    mode: "reset",
    email: "user@example.com",
    password: "secret12",
  });

  assert.equal(result.success, false);
});
