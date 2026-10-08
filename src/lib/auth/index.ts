import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";

import { requireRoleDecision } from "@/lib/permissions/policy";
import { ROLE_HOME, type UserRole } from "@/lib/permissions/roles";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

import { safeReturnTo } from "./return-to";
import {
  devCredentialsAdapter,
  devCredentialsConfigured,
} from "./dev-credentials-adapter";
import type { AuthAdapter, CurrentUser } from "./types";
import { unconfiguredAuthAdapter } from "./unconfigured-adapter";

/**
 * PROVIDER PENDING: return the selected provider's adapter once the
 * authentication decision is recorded in docs/source-of-truth.md.
 * Until then, development uses the .env test accounts and production has no
 * sign-in at all.
 */
function getAdapter(): AuthAdapter {
  if (process.env.NODE_ENV !== "production" && devCredentialsConfigured()) {
    return devCredentialsAdapter;
  }
  return unconfiguredAuthAdapter;
}

/**
 * Reads the current session. Always request-time: callers render inside a
 * <Suspense> boundary (required with Cache Components).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  await connection();
  return getAdapter().getCurrentUser();
}

/**
 * Server-side role gate for layouts and pages. Redirects to sign-in when no
 * session exists, and to the caller's own dashboard when the role differs.
 * Route handlers must still authorize the specific resource they touch.
 */
export async function requireRole(
  allowed: readonly UserRole[],
  returnTo?: string,
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  const decision = requireRoleDecision(user?.role ?? null, allowed);
  if (decision.allow && user) return user;

  if (!user) {
    const target = safeReturnTo(returnTo);
    redirect(
      target ? `/login?returnTo=${encodeURIComponent(target)}` : "/login",
    );
  }
  redirect(ROLE_HOME[user.role]);
}

/** Outcome shown by the sign-in and recovery forms. */
export type AuthFormResult =
  | { status: "success"; redirectTo?: string }
  | { status: "invalid"; message: string }
  | { status: "unavailable" };

const INVALID_CREDENTIALS = "That email and password combination didn't work.";

export async function signIn(input: unknown): Promise<AuthFormResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success)
    return { status: "invalid", message: INVALID_CREDENTIALS };

  const result = await getAdapter().signIn(parsed.data);
  if (!result.ok) {
    return result.code === "PROVIDER_NOT_CONFIGURED"
      ? { status: "unavailable" }
      : { status: "invalid", message: INVALID_CREDENTIALS };
  }
  return {
    status: "success",
    redirectTo:
      safeReturnTo(parsed.data.returnTo) ?? ROLE_HOME[result.value.role],
  };
}

export async function signOut(): Promise<void> {
  await getAdapter().signOut();
}

/**
 * Always reports success for a well-formed email, whether or not an account
 * exists, so the response never reveals registered addresses.
 */
export async function requestPasswordReset(
  input: unknown,
): Promise<AuthFormResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: "Enter a valid email address." };
  }
  const result = await getAdapter().requestPasswordReset(parsed.data);
  if (!result.ok && result.code === "PROVIDER_NOT_CONFIGURED") {
    return { status: "unavailable" };
  }
  return { status: "success" };
}

export async function resetPassword(input: unknown): Promise<AuthFormResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Check the highlighted fields and try again.",
    };
  }
  const result = await getAdapter().resetPassword({
    token: parsed.data.token,
    newPassword: parsed.data.newPassword,
  });
  if (result.ok) return { status: "success", redirectTo: "/login" };

  switch (result.code) {
    case "PROVIDER_NOT_CONFIGURED":
      return { status: "unavailable" };
    case "RESET_TOKEN_EXPIRED":
      return {
        status: "invalid",
        message: "This reset link has expired. Request a new one.",
      };
    case "RESET_TOKEN_USED":
      return {
        status: "invalid",
        message: "This reset link was already used. Request a new one.",
      };
    case "PASSWORD_POLICY_FAILED":
      return {
        status: "invalid",
        message: "Choose a password that meets the requirements.",
      };
    default:
      return {
        status: "invalid",
        message: "This reset link isn't valid. Request a new one.",
      };
  }
}

export { isDevAccount } from "./dev-credentials-adapter";
