import type { Page } from "@playwright/test";

import {
  chooseTheme,
  expect,
  signIn,
  test,
  testAccount,
  type TestAccountRole,
} from "./fixtures";

const TABS: Record<TestAccountRole, { label: string; path: string }[]> = {
  teacher: [
    { label: "Dashboard", path: "/teacher/dashboard" },
    { label: "Classes", path: "/teacher/classes" },
    { label: "Students", path: "/teacher/students" },
    { label: "Quizzes", path: "/teacher/quizzes" },
    { label: "Results", path: "/teacher/results" },
    { label: "Integrity", path: "/teacher/integrity" },
  ],
  student: [
    { label: "Dashboard", path: "/student/dashboard" },
    { label: "Classes", path: "/student/classes" },
    { label: "Quizzes", path: "/student/quizzes" },
    { label: "Results", path: "/student/results" },
  ],
};

// Each test signs in and visits every page of a role.
test.describe.configure({ timeout: 90_000 });

const OTHER: Record<TestAccountRole, TestAccountRole> = {
  teacher: "student",
  student: "teacher",
};

const escape = (path: string) => path.replace(/[/]/g, "\\/");

/** Opens the mobile page menu and returns the dialog listing destinations. */
async function openMobileMenu(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Go to a page" });
  // The page may still be hydrating; retry until the sheet opens.
  await expect(async () => {
    await page.getByRole("button", { name: /^Open navigation/ }).click();
    await expect(dialog).toBeVisible({ timeout: 1_000 });
  }).toPass();
  return dialog;
}

async function expectPreviewPage(page: Page, label: string) {
  await expect(
    page.getByRole("heading", { level: 1, name: label }),
  ).toBeVisible();
  const notice = page.getByRole("note", { name: "Preview mode" });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText(
    "QuizFlow’s interface and features are still being built.",
  );
  await expect(
    page.getByRole("heading", { level: 2, name: "UI preview" }),
  ).toBeVisible();
  await expect(
    page
      .getByText(
        "This screen isn’t finished yet. Its workflows and data will be connected in an upcoming milestone.",
      )
      .filter({ visible: true }),
  ).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function expectCurrentPage(page: Page, label: string, isMobile: boolean) {
  if (isMobile) {
    await expect(
      page.getByRole("button", {
        name: `Open navigation. Current page: ${label}`,
      }),
    ).toBeVisible();
    return;
  }
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: label })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
}

for (const role of ["teacher", "student"] as const) {
  const tabs = TABS[role];
  const otherTabs = TABS[OTHER[role]];

  test.describe(`${role} navigation preview`, () => {
    test.skip(
      !testAccount(role),
      "Set TEACHER_* and STUDENT_* test accounts in .env to run navigation checks.",
    );

    test.beforeEach(async ({ page }) => {
      await signIn(page, role);
    });

    test("shows only this role's tabs, in order", async ({
      page,
      isMobile,
    }) => {
      const links = isMobile
        ? (await openMobileMenu(page)).getByRole("link")
        : page.getByRole("navigation", { name: "Primary" }).getByRole("link");

      await expect(links).toHaveText(
        tabs.map((tab) => new RegExp(`^${tab.label}`)),
      );
      for (const tab of tabs) {
        await expect(
          links.filter({ hasText: tab.label }).first(),
        ).toHaveAttribute("href", tab.path);
      }
      for (const tab of otherTabs) {
        await expect(
          page.locator(`a[href="${tab.path}"]`).filter({ visible: true }),
        ).toHaveCount(0);
      }
    });

    test("every tab opens its page with the preview state", async ({
      page,
      isMobile,
      consoleErrors,
    }) => {
      for (const tab of tabs) {
        if (isMobile) {
          const dialog = await openMobileMenu(page);
          await dialog
            .getByRole("link", { name: new RegExp(`^${tab.label}`) })
            .click();
          await expect(dialog).toBeHidden();
        } else {
          await page
            .getByRole("navigation", { name: "Primary" })
            .getByRole("link", { name: tab.label })
            .click();
        }
        // A route's first visit compiles it on the dev server.
        await expect(page).toHaveURL(new RegExp(`${escape(tab.path)}$`), {
          timeout: 20_000,
        });
        await expectPreviewPage(page, tab.label);
        await expectCurrentPage(page, tab.label, isMobile);
      }
      expect(consoleErrors).toEqual([]);
    });

    test("direct loads and reloads keep the right tab active", async ({
      page,
      isMobile,
      consoleErrors,
    }) => {
      for (const tab of tabs) {
        await page.goto(tab.path);
        await expectPreviewPage(page, tab.label);
        await expectCurrentPage(page, tab.label, isMobile);
        await expectNoHorizontalOverflow(page);
      }
      await page.reload();
      const last = tabs.at(-1)!;
      await expectPreviewPage(page, last.label);
      await expectCurrentPage(page, last.label, isMobile);
      expect(consoleErrors).toEqual([]);
    });

    test("the other role's pages stay closed", async ({ page }) => {
      for (const tab of otherTabs) {
        await page.goto(tab.path);
        await expect(page).toHaveURL(new RegExp(`/${role}/dashboard$`));
      }
    });

    test("dark theme and reduced motion keep the layout intact", async ({
      page,
      isMobile,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await chooseTheme(page, "Dark");
      await expect(page.locator("html")).toHaveClass(/\bdark\b/);

      for (const tab of tabs) {
        await page.goto(tab.path);
        await expectPreviewPage(page, tab.label);
        await expectNoHorizontalOverflow(page);
      }
      if (isMobile) {
        const dialog = await openMobileMenu(page);
        await expect(dialog.getByRole("link")).toHaveCount(tabs.length);
      }
    });
  });

  test.describe(`${role} navigation keyboard access`, () => {
    test.skip(
      !testAccount(role),
      "Set TEACHER_* and STUDENT_* test accounts in .env to run navigation checks.",
    );

    test("Tab reaches every destination in order", async ({
      page,
      isMobile,
    }) => {
      await signIn(page, role);

      if (isMobile) {
        const trigger = page.getByRole("button", { name: /^Open navigation/ });
        await trigger.focus();
        await page.keyboard.press("Enter");
        const dialog = page.getByRole("dialog", { name: "Go to a page" });
        await expect(dialog).toBeVisible();
        // The sheet moves focus to the current page (Dashboard) when it opens.
        for (const [index, tab] of tabs.entries()) {
          if (index > 0) await page.keyboard.press("Tab");
          await expect(
            dialog.getByRole("link", { name: new RegExp(`^${tab.label}`) }),
          ).toBeFocused();
        }
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
        return;
      }

      const nav = page.getByRole("navigation", { name: "Primary" });
      await nav.getByRole("link", { name: tabs[0].label }).focus();
      for (const tab of tabs.slice(1)) {
        await page.keyboard.press("Tab");
        await expect(nav.getByRole("link", { name: tab.label })).toBeFocused();
      }
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`${escape(tabs.at(-1)!.path)}$`));
    });
  });
}
