import { Suspense, type ReactNode } from "react";

import { signOutAction } from "@/lib/auth/actions";
import { isDevAccount, requireRole } from "@/lib/auth";
import type { UserRole } from "@/lib/permissions/roles";

import { AppShell } from "./app-shell";
import { AppShellSkeleton } from "./app-shell-skeleton";

/**
 * Authorization boundary for a role's route group. The session is read at
 * request time inside <Suspense>; anyone without the role is redirected
 * before any child renders. Pages and route handlers still authorize the
 * specific class, quiz or attempt they load.
 */
export function RoleLayout({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <RoleGate role={role}>{children}</RoleGate>
    </Suspense>
  );
}

async function RoleGate({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const user = await requireRole([role]);
  return (
    <AppShell
      role={user.role}
      displayName={user.displayName}
      isTestAccount={isDevAccount(user)}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
