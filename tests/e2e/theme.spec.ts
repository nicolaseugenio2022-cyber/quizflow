import { chooseTheme, expect, test } from "./fixtures";

const html = (page: import("@playwright/test").Page) => page.locator("html");

test.describe("Theme", () => {
  test("loads without theme-related runtime errors", async ({
    page,
    consoleErrors,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Theme" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(
      consoleErrors.filter((message) => /theme|hydrat/i.test(message)),
    ).toEqual([]);
  });

  test("follows the system preference on first visit", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(html(page)).toHaveClass(/\bdark\b/);

    await page.emulateMedia({ colorScheme: "light" });
    await expect(html(page)).not.toHaveClass(/\bdark\b/);
  });

  test("theme control works from the keyboard", async ({ page }) => {
    await page.goto("/login");
    const trigger = page.getByRole("button", { name: "Theme" });
    await trigger.focus();
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Enter");
    const dark = page.getByRole("menuitemradio", { name: "Dark" });
    await expect(dark).toBeVisible();
    await dark.focus();
    await page.keyboard.press("Enter");

    await expect(html(page)).toHaveClass(/\bdark\b/);
    await expect(trigger).toBeFocused();
  });

  test("light and dark can be selected and persist after reload", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");

    await chooseTheme(page, "Dark");
    await expect(html(page)).toHaveClass(/\bdark\b/);
    await page.reload();
    await expect(html(page)).toHaveClass(/\bdark\b/);

    await chooseTheme(page, "Light");
    await expect(html(page)).not.toHaveClass(/\bdark\b/);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    // An explicit choice wins over the system preference.
    await expect(html(page)).not.toHaveClass(/\bdark\b/);

    await page.getByRole("button", { name: "Theme" }).click();
    await expect(
      page.getByRole("menuitemradio", { name: "Light" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  test("reduced motion shows the headline without animation", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const heading = page.getByRole("heading", {
      level: 1,
      name: "Quizzes that keep every answer.",
    });
    await expect(heading).toBeVisible();
    // With reduced motion the headline is plain text, not animated spans.
    await expect(heading).toHaveText("Quizzes that keep every answer.");
    await expect(heading.locator("span")).toHaveCount(0);
    await expect(heading).toHaveCSS("opacity", "1");
  });
});
