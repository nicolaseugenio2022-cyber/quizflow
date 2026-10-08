import type { UserRole } from "@/lib/permissions/roles";

export type ThemePreference = "LIGHT" | "DARK" | "SYSTEM";

/** Mirrors `CurrentUser` in docs/api.md. */
export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  themePreference: ThemePreference;
}

/** Product-level outcome of an authentication operation. */
export type AuthResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code:
        | "INVALID_CREDENTIALS"
        | "RESET_TOKEN_INVALID"
        | "RESET_TOKEN_EXPIRED"
        | "RESET_TOKEN_USED"
        | "PASSWORD_POLICY_FAILED"
        | "RATE_LIMITED"
        | "PROVIDER_NOT_CONFIGURED";
    };

/**
 * Boundary between QuizFlow and the authentication provider.
 * The provider is an open decision (docs/source-of-truth.md). An adapter must
 * keep the documented guarantees: generic credential errors, no account
 * discovery on password recovery, hashed single-use reset tokens, and session
 * invalidation after a reset.
 */
export interface AuthAdapter {
  readonly name: string;
  getCurrentUser(): Promise<CurrentUser | null>;
  signIn(input: {
    email: string;
    password: string;
  }): Promise<AuthResult<CurrentUser>>;
  signOut(): Promise<void>;
  requestPasswordReset(input: { email: string }): Promise<AuthResult<void>>;
  resetPassword(input: {
    token: string;
    newPassword: string;
  }): Promise<AuthResult<void>>;
}
