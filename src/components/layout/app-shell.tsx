import type { ReactNode } from "react";

import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { ROLE_HOME, ROLE_LABEL, type UserRole } from "@/lib/permissions/roles";
import { APP_NAV } from "@/navigation/app-nav";

import { AppNav } from "./app-nav";
import { UserMenu } from "./user-menu";

/**
 * Signed-in frame shared by both roles: a glass header over the page
 * atmosphere, and an opaque content column for dense work.
 */
export function AppShell({
  role,
  displayName,
  isTestAccount,
  signOutAction,
  children,
}: {
  role: UserRole;
  displayName: string;
  isTestAccount: boolean;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}) {
  return (
    <div className="aura flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
        <div className="glass mx-auto flex h-14 max-w-6xl items-center gap-2 rounded-2xl px-2 sm:px-3">
          <AppNav items={APP_NAV[role]} />
          <span aria-hidden="true" className="hidden flex-1 md:block" />
          <Brand
            href={ROLE_HOME[role]}
            className="mr-auto px-1 md:order-first md:mr-4"
          />
          {isTestAccount && (
            <Badge
              variant="outline"
              className="hidden border-primary/40 text-primary sm:inline-flex"
            >
              Test account
            </Badge>
          )}
          <ThemeToggle />
          <UserMenu
            displayName={displayName}
            roleLabel={ROLE_LABEL[role]}
            signOutAction={signOutAction}
          />
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-16 outline-none sm:px-6"
      >
        {children}
      </main>
    </div>
  );
}
