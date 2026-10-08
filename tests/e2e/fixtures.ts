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

export type TestAccountRole = "teacher" | "student";

/** Development test account from .env, or undefined when not configured. */
export function testAccount(role: TestAccountRole) {
  const prefix = role === "teacher" ? "TEACHER" : "STUDENT";
  const email = process.env[`${prefix}_USERNAME`];
  const password = process.env[`${prefix}_PASSWORD`];
  return email && password ? { email, password } : undefined;
}

/** Signs in through the login form and waits for the role dashboard. */
export async function signIn(
  page: import("@playwright/test").Page,
  role: TestAccountRole,
) {
  const account = testAccount(role);
  if (!account) throw new Error(`No ${role} test account configured.`);
  // Wait for hydration so the click runs the form's action, not a plain POST.
  await page.goto("/login", { waitUntil: "networkidle" });
  await field(page, "Email").fill(account.email);
  await field(page, "Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // The first sign-in compiles the role area in dev, which can take a while.
  await expect(page).toHaveURL(new RegExp(`/${role}/dashboard$`), {
    timeout: 30_000,
  });
}
