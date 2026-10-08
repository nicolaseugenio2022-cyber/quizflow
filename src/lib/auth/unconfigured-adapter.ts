import type { AuthAdapter } from "./types";

/**
 * Used until an authentication provider is selected. Nobody is signed in and
 * every credential operation reports PROVIDER_NOT_CONFIGURED, so the UI can
 * say sign-in is unavailable instead of pretending it worked.
 */
export const unconfiguredAuthAdapter: AuthAdapter = {
  name: "unconfigured",
  async getCurrentUser() {
    return null;
  },
  async signIn() {
    return { ok: false, code: "PROVIDER_NOT_CONFIGURED" };
  },
  async signOut() {},
  async requestPasswordReset() {
    return { ok: false, code: "PROVIDER_NOT_CONFIGURED" };
  },
  async resetPassword() {
    return { ok: false, code: "PROVIDER_NOT_CONFIGURED" };
  },
};
