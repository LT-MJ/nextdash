import { test, expect } from "@playwright/test";

test.describe("Public technical SEO surfaces", () => {
  test("robots.txt is served with a Sitemap directive", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("User-agent");
    expect(body).toMatch(/Sitemap:/i);
  });

  test("sitemap.xml is a valid sitemap index", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");
    const body = await res.text();
    expect(body).toContain("<sitemapindex");
  });

  test("an unknown URL returns a 404 with a helpful page", async ({ page }) => {
    const res = await page.goto("/this-page-definitely-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("404")).toBeVisible();
  });

  test("the homepage renders with a title and Organization/WebSite JSON-LD", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
    const jsonLdCount = await page.locator('script[type="application/ld+json"]').count();
    expect(jsonLdCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Admin authentication", () => {
  test("unauthenticated visitors are redirected to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("the login page renders a working form", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});
