import { expect, test } from "./fixtures";

test.describe("Landing page", () => {
  test("loads with its heading and navigation", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle("QuizFlow");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Quizzes that keep every answer.",
      }),
    ).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "QuizFlow", exact: true }),
    ).toBeVisible();
  });

  test("reaches sign-in with the keyboard alone", async ({ page }) => {
    await page.goto("/");
    const signIn = page.getByRole("link", { name: "Sign in to QuizFlow" });

    // Tab from the top of the document until the primary action has focus.
    for (let presses = 0; presses < 12; presses += 1) {
      await page.keyboard.press("Tab");
      if (await signIn.evaluate((node) => node === document.activeElement)) {
        break;
      }
    }
    await expect(signIn).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("offers a skip link to the main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
  });

  test("has no browser console errors", async ({ page, consoleErrors }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(consoleErrors).toEqual([]);
  });
});
