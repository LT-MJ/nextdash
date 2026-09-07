import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

test("an admin can log in through the UI and reach the dashboard", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText(/welcome back/i)).toBeVisible();
});

test("an authenticated admin can reach the SEO, Blog, and Commerce dashboards", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/seo");
  await expect(page.getByRole("heading", { name: "SEO Dashboard" })).toBeVisible();

  await page.goto("/admin/blog");
  await expect(page).not.toHaveURL(/\/admin\/login/);

  await page.goto("/admin/ecommerce");
  await expect(page).not.toHaveURL(/\/admin\/login/);
});
