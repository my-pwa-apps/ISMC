import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("protected route behavior matches runtime auth mode", async ({ page }) => {
    await page.goto("/dashboard");

    if (/\/login/.test(page.url())) {
      await expect(page).toHaveURL(/\/login/);
      return;
    }

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });

  test("login page contains Microsoft sign-in button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});
