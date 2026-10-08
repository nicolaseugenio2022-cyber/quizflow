import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { pageQuerySchema, toFieldErrors } from "@/lib/validation/common";

describe("auth validation", () => {
  it("trims email and accepts a valid login", () => {
    const result = loginSchema.parse({
      email: "  student@school.edu ",
      password: "x",
    });
    expect(result.email).toBe("student@school.edu");
  });

  it("requires a well-formed email for password recovery", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(
      false,
    );
  });

  it("enforces the password policy and matching confirmation", () => {
    const short = resetPasswordSchema.safeParse({
      token: "t",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(short.success).toBe(false);

    const mismatch = resetPasswordSchema.safeParse({
      token: "t",
      newPassword: "a long enough passphrase",
      confirmPassword: "a different passphrase",
    });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) {
      expect(toFieldErrors(mismatch.error)).toHaveProperty("confirmPassword");
    }
  });
});

describe("pagination", () => {
  it("defaults and bounds the limit", () => {
    expect(pageQuerySchema.parse({}).limit).toBe(25);
    expect(pageQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
    expect(pageQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
  });
});
