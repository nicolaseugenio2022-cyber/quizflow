import { expect, field, test } from "./fixtures";

test.describe("Authentication navigation", () => {
  test("Sign in opens the login page", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Sign in" })
      .click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeVisible();
  });

  test("login form has accessible fields and a recovery link", async ({
    page,
  }) => {
    await page.goto("/login");

    const email = field(page, "Email");
    const password = field(page, "Password");
    await expect(email).toBeVisible();
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveAttribute("autocomplete", "username");
    await expect(password).toBeVisible();
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveAttribute("autocomplete", "current-password");

    const toggle = page.getByRole("button", { name: "Show password" });
    await toggle.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Forgot password?" }),
    ).toBeVisible();
  });

  test("empty login submission shows field errors", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter your email address.")).toBeVisible();
    await expect(page.getByText("Enter your password.")).toBeVisible();
    await expect(field(page, "Email")).toHaveAttribute("aria-invalid", "true");
  });

  test("Forgot password? opens the recovery form", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Reset your password" }),
    ).toBeVisible();

    const email = field(page, "Email");
    await expect(email).toBeVisible();
    await expect(email).toHaveAttribute("type", "email");
    await expect(
      page.getByRole("button", { name: "Send reset link" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to sign in" }),
    ).toBeVisible();
  });

  test("reset page without a token shows the invalid-link state", async ({
    page,
    consoleErrors,
  }) => {
    await page.goto("/reset-password");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "This reset link isn't valid",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Request a new link" }),
    ).toBeVisible();
    // No password fields are offered without a token.
    await expect(field(page, "New password")).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });

  test("reset page removes the token from the address bar", async ({
    page,
  }) => {
    await page.goto("/reset-password?token=example-token-value");
    await expect(
      page.getByRole("heading", { level: 1, name: "Choose a new password" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/reset-password$/);
    await expect(field(page, "New password")).toBeVisible();
    await expect(field(page, "Confirm new password")).toBeVisible();
  });

  test("signed-in areas redirect anonymous visitors to sign-in", async ({
    page,
  }) => {
    await page.goto("/teacher/dashboard");
    await expect(page).toHaveURL(/\/login\?returnTo=/);
    await page.goto("/student/dashboard");
    await expect(page).toHaveURL(/\/login\?returnTo=/);
  });
});

const teacher = {
  email: process.env.TEACHER_USERNAME,
  password: process.env.TEACHER_PASSWORD,
};
const student = {
  email: process.env.STUDENT_USERNAME,
  password: process.env.STUDENT_PASSWORD,
};

test.describe("Development test accounts", () => {
  test.skip(
    !teacher.email || !teacher.password || !student.email || !student.password,
    "Set TEACHER_* and STUDENT_* test accounts in .env to run sign-in checks.",
  );

  test("wrong password gets a generic error", async ({ page }) => {
    await page.goto("/login");
    await field(page, "Email").fill(teacher.email!);
    await field(page, "Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByText("That email and password combination didn't work."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("teacher signs in to the teacher dashboard and signs out", async ({
    page,
  }) => {
    await page.goto("/login");
    await field(page, "Email").fill(teacher.email!);
    await field(page, "Password").fill(teacher.password!);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/teacher\/dashboard$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeVisible();

    // Students cannot open teacher routes and vice versa.
    await page.goto("/student/dashboard");
    await expect(page).toHaveURL(/\/teacher\/dashboard$/);

    // The redirected page may still be hydrating; retry until the menu opens.
    const signOut = page.getByRole("menuitem", { name: "Sign out" });
    await expect(async () => {
      await page.getByRole("button", { name: /^Account:/ }).click();
      await expect(signOut).toBeVisible({ timeout: 1_000 });
    }).toPass();
    await signOut.click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/teacher/dashboard");
    await expect(page).toHaveURL(/\/login\?returnTo=/);
  });

  test("student signs in to the student dashboard", async ({ page }) => {
    await page.goto("/login");
    await field(page, "Email").fill(student.email!);
    await field(page, "Password").fill(student.password!);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/student\/dashboard$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeVisible();
    await expect(
      page.getByRole("note", { name: "Preview mode" }),
    ).toBeVisible();
  });
});
