"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Light, dark and system themes. next-themes injects a blocking script that
 * applies the stored choice before first paint, so there is no theme flash.
 * PROVIDER PENDING: once sign-in exists, sync the choice to
 * `User.themePreference` so it follows the user across devices.
 */
export function ThemeProvider(
  props: ComponentProps<typeof NextThemesProvider>,
) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="quizflow-theme"
      {...props}
    />
  );
}
