import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { ROLE_LABEL, type UserRole } from "@/lib/permissions/roles";

import { DEV_SESSION_COOKIE } from "./session-cookie";
import type { AuthAdapter, CurrentUser } from "./types";

/**
 * DEVELOPMENT ONLY. Lets the two test accounts in .env sign in while no
 * authentication provider is selected:
 *
 *   TEACHER_USERNAME / TEACHER_PASSWORD  -> TEACHER_ADMIN
 *   STUDENT_USERNAME / STUDENT_PASSWORD  -> STUDENT
 *
 * It is never used when NODE_ENV is "production" (see ./index.ts). It does
 * not touch the database, cannot reset passwords, and is not a provider
 * choice. Remove it once the real adapter exists.
 */

const COOKIE = DEV_SESSION_COOKIE;
const MAX_AGE_SECONDS = 8 * 60 * 60;

interface DevAccount {
  role: UserRole;
  email: string;
  password: string;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function devAccounts(): DevAccount[] {
  const accounts: DevAccount[] = [];
  const pairs: [UserRole, string | undefined, string | undefined][] = [
    [
      "TEACHER_ADMIN",
      process.env.TEACHER_USERNAME,
      process.env.TEACHER_PASSWORD,
    ],
    ["STUDENT", process.env.STUDENT_USERNAME, process.env.STUDENT_PASSWORD],
  ];
  for (const [role, email, password] of pairs) {
    if (email && password) {
      accounts.push({ role, email: normalizeEmail(email), password });
    }
  }
  return accounts;
}

export function devCredentialsConfigured(): boolean {
  return devAccounts().length > 0;
}

// Signing key: AUTH_DEV_SESSION_SECRET when set, otherwise a random key per
// server process (kept on globalThis so dev reloads do not sign everyone out).
const globalForKey = globalThis as typeof globalThis & {
  __quizflowDevSessionKey?: Buffer;
};

function signingKey(): Buffer {
  const configured = process.env.AUTH_DEV_SESSION_SECRET;
  if (configured) return Buffer.from(configured);
  globalForKey.__quizflowDevSessionKey ??= randomBytes(32);
  return globalForKey.__quizflowDevSessionKey;
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // Hash both sides first so the comparison does not leak length.
  const key = signingKey();
  const ha = createHmac("sha256", key).update(a).digest();
  const hb = createHmac("sha256", key).update(b).digest();
  return timingSafeEqual(ha, hb);
}

interface SessionPayload {
  role: UserRole;
  email: string;
  exp: number;
}

function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(value: string | undefined): SessionPayload | null {
  if (!value) return null;
  const [body, signature] = value.split(".");
  if (!body || !signature || !safeEqual(sign(body), signature)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now())
      return null;
    return payload;
  } catch {
    return null;
  }
}

function toCurrentUser(account: DevAccount): CurrentUser {
  return {
    id: `dev-account-${account.role.toLowerCase()}`,
    email: account.email,
    displayName: `${ROLE_LABEL[account.role]} test account`,
    role: account.role,
    themePreference: "SYSTEM",
  };
}

export function isDevAccount(user: CurrentUser): boolean {
  return user.id.startsWith("dev-account-");
}

export const devCredentialsAdapter: AuthAdapter = {
  name: "dev-credentials",

  async getCurrentUser() {
    const session = decodeSession((await cookies()).get(COOKIE)?.value);
    if (!session) return null;
    // The account must still exist in .env with the same email and role.
    const account = devAccounts().find(
      (candidate) =>
        candidate.role === session.role && candidate.email === session.email,
    );
    return account ? toCurrentUser(account) : null;
  },

  async signIn({ email, password }) {
    const normalized = normalizeEmail(email);
    // Compare against every account so timing does not reveal which matched.
    let match: DevAccount | undefined;
    for (const account of devAccounts()) {
      const emailOk = safeEqual(account.email, normalized);
      const passwordOk = safeEqual(account.password, password);
      if (emailOk && passwordOk) match = account;
    }
    if (!match) return { ok: false, code: "INVALID_CREDENTIALS" };

    (await cookies()).set(
      COOKIE,
      encodeSession({
        role: match.role,
        email: match.email,
        exp: Date.now() + MAX_AGE_SECONDS * 1000,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: MAX_AGE_SECONDS,
      },
    );
    return { ok: true, value: toCurrentUser(match) };
  },

  async signOut() {
    (await cookies()).delete(COOKIE);
  },

  async requestPasswordReset() {
    return { ok: false, code: "PROVIDER_NOT_CONFIGURED" };
  },

  async resetPassword() {
    return { ok: false, code: "PROVIDER_NOT_CONFIGURED" };
  },
};
