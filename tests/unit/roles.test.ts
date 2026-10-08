import { describe, expect, it } from "vitest";

import { requireRoleDecision } from "@/lib/permissions/policy";
import { isUserRole, ROLE_HOME, USER_ROLES } from "@/lib/permissions/roles";
import { UserRole as PrismaUserRole } from "@/generated/prisma/enums";

describe("roles", () => {
  it("defines exactly TEACHER_ADMIN and STUDENT", () => {
    expect([...USER_ROLES]).toEqual(["TEACHER_ADMIN", "STUDENT"]);
  });

  it("matches the Prisma UserRole enum", () => {
    expect(Object.values(PrismaUserRole).sort()).toEqual(
      [...USER_ROLES].sort(),
    );
  });

  it("rejects unknown roles", () => {
    expect(isUserRole("ADMIN")).toBe(false);
    expect(isUserRole("teacher_admin")).toBe(false);
    expect(isUserRole(undefined)).toBe(false);
    expect(isUserRole("STUDENT")).toBe(true);
  });

  it("gives each role its own dashboard", () => {
    expect(ROLE_HOME.TEACHER_ADMIN).toBe("/teacher/dashboard");
    expect(ROLE_HOME.STUDENT).toBe("/student/dashboard");
  });
});

describe("requireRoleDecision", () => {
  it("denies anonymous callers as unauthenticated", () => {
    expect(requireRoleDecision(null, ["STUDENT"])).toEqual({
      allow: false,
      reason: "UNAUTHENTICATED",
    });
  });

  it("denies the wrong role", () => {
    expect(requireRoleDecision("STUDENT", ["TEACHER_ADMIN"])).toEqual({
      allow: false,
      reason: "ROLE_NOT_ALLOWED",
    });
  });

  it("allows a listed role", () => {
    expect(requireRoleDecision("TEACHER_ADMIN", ["TEACHER_ADMIN"])).toEqual({
      allow: true,
    });
  });
});
