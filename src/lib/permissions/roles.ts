/**
 * Product roles. The initial release has exactly these two
 * (docs/source-of-truth.md, "Users and permissions"). Keep in sync with the
 * `UserRole` enum in prisma/schema.prisma.
 */
export const USER_ROLES = ["TEACHER_ADMIN", "STUDENT"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}

/** Home route for each role after sign-in. */
export const ROLE_HOME: Record<UserRole, string> = {
  TEACHER_ADMIN: "/teacher/dashboard",
  STUDENT: "/student/dashboard",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  TEACHER_ADMIN: "Teacher",
  STUDENT: "Student",
};
