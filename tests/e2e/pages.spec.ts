import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("an admin can create, publish, and view a page; a draft page 404s publicly", async ({ page, request }) => {
  const slug = `e2e-test-page-${Date.now()}`;

  await login(page);
  await page.goto("/admin/pages");
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();

  await page.goto("/admin/pages/new");
  await page.getByLabel("Title").fill("E2E Test Page");
  await page.getByLabel("Slug").fill(slug);

  // Draft: not yet public.
  const draftCheck = await request.get(`/${slug}`);
  expect(draftCheck.status()).toBe(404);

  await page.getByRole("button", { name: /create page/i }).click();
  await expect(page).toHaveURL(/\/admin\/pages\/[a-z0-9]+$/);
  // The SEO tab only renders once the edit page has mounted with a real
  // page prop (not the "new" form) — wait for it so the status <select>
  // interaction below can't race the client-side navigation.
  await expect(page.getByRole("tab", { name: "SEO" })).toBeVisible();

  // Publish it.
  await page.getByLabel("Status").selectOption("PUBLISHED");
  await page.getByRole("button", { name: /save changes/i }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  const publicRes = await page.request.get(`/${slug}`);
  expect(publicRes.status()).toBe(200);
  const html = await publicRes.text();
  // No custom SEO title was set, so the resolver falls back to the global
  // title template ("{title} {sep} {siteName}") rather than the bare title.
  expect(html).toMatch(/<title>E2E Test Page.*<\/title>/);
  expect(html).toContain('"@type":"WebPage"');
  expect(html).toContain('"@type":"BreadcrumbList"');

  // Clean up via the delete flow (a custom confirm dialog, not window.confirm).
  await page.getByRole("button", { name: /delete page/i }).click();
  await page.getByRole("button", { name: /delete permanently/i }).click();
  await expect(page).toHaveURL(/\/admin\/pages$/);

  const afterDelete = await request.get(`/${slug}`);
  expect(afterDelete.status()).toBe(404);
});
