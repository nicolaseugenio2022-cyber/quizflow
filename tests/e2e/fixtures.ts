import { expect, test as base, type ConsoleMessage } from "@playwright/test";

/**
 * Shared fixture that records browser console errors and uncaught page
 * errors. Tests assert on `consoleErrors` instead of ignoring them.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, provide) => {
    const errors: string[] = [];
    const onConsole = (message: ConsoleMessage) => {
      if (message.type() === "error") errors.push(message.text());
    };
    page.on("console", onConsole);
    page.on("pageerror", (error) => errors.push(error.message));
    await provide(errors);
    page.off("console", onConsole);
  },
});

export { expect };

/**
 * Visible form control by its exact label. Next.js keeps the previous route
 * mounted but hidden for back navigation, so hidden matches are excluded.
 */
export function field(page: import("@playwright/test").Page, label: string) {
  return page.getByLabel(label, { exact: true }).filter({ visible: true });
}

/** Opens the theme menu from the visible theme control. */
export async function chooseTheme(
  page: import("@playwright/test").Page,
  label: "Light" | "Dark" | "System",
) {
  await page.getByRole("button", { name: "Theme" }).click();
  await page.getByRole("menuitemradio", { name: label }).click();
}
