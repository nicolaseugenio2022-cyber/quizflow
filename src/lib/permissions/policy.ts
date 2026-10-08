import type { UserRole } from "./roles";

/**
 * Decision returned by every authorization check. Callers map `deny` to the
 * documented status: `401` when unauthenticated, otherwise `404` for private
 * resources the caller must not learn about, or `403` when the resource is
 * already visible to them.
 */
export type AccessDecision =
  | { allow: true }
  | {
      allow: false;
      reason:
        "UNAUTHENTICATED" | "ROLE_NOT_ALLOWED" | "NOT_OWNER" | "NOT_ENROLLED";
    };

export const allow: AccessDecision = { allow: true };

export function requireRoleDecision(
  actual: UserRole | null,
  allowed: readonly UserRole[],
): AccessDecision {
  if (actual === null) return { allow: false, reason: "UNAUTHENTICATED" };
  return allowed.includes(actual)
    ? allow
    : { allow: false, reason: "ROLE_NOT_ALLOWED" };
}
