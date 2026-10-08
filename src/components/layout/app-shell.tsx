import type { ReactNode } from "react";

import { Brand } from "@/components/layout/brand";
import { PreviewNotice } from "@/components/preview/preview-notice";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { ROLE_HOME, ROLE_LABEL, type UserRole } from "@/lib/permissions/roles";
import { APP_NAV } from "@/navigation/app-nav";

import { AppNav } from "./app-nav";
import { UserMenu } from "./user-menu";

/**
 * Signed-in frame shared by both roles: a glass header (account row over the
 * role navigation), the preview notice, then the page content.
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
    <div data-app-shell className="aura flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
        <div className="glass mx-auto max-w-6xl rounded-2xl">
          <div className="flex h-14 items-center gap-2 px-2 sm:px-3">
            <Brand href={ROLE_HOME[role]} className="mr-auto px-1" />
            {isTestAccount && (
              <Badge
                variant="outline"
                className="hidden border-primary/40 text-primary min-[400px]:inline-flex"
              >
                Test account
              </Badge>
            )}
            <ThemeToggle />
            <UserMenu
              displayName={displayName}
              roleLabel={ROLE_LABEL[role]}
              isTestAccount={isTestAccount}
              signOutAction={signOutAction}
            />
          </div>
          <div className="border-t border-foreground/8 px-1.5 py-1.5 sm:px-2.5">
            <AppNav
              items={APP_NAV[role]}
              workspaceLabel={`${ROLE_LABEL[role]} workspace`}
            />
          </div>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-8 px-4 pt-5 pb-16 outline-none sm:px-6"
      >
        <PreviewNotice />
        <div>{children}</div>
      </main>
    </div>
  );
}
