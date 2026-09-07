import { test, expect } from "@playwright/test";

test.describe("Public blog", () => {
  test("blog index renders published posts", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).toHaveTitle(/.+/);
  });

  test("a published post renders with JSON-LD and a title", async ({ page }) => {
    await page.goto("/blog/welcome-to-nextdash");
    await expect(page).toHaveTitle(/Nextdash/);
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = jsonLd.map((t) => JSON.parse(t)["@type"]);
    expect(types).toContain("BlogPosting");
    expect(types).toContain("BreadcrumbList");
  });
});

test.describe("Public storefront", () => {
  test("shop index renders active products", async ({ page }) => {
    await page.goto("/shop");
    await expect(page).toHaveTitle(/.+/);
  });

  test("a product page renders correct title, price, and Product JSON-LD", async ({ page }) => {
    const res = await page.goto("/shop/sample-product");
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/Sample Product/);
    await expect(page.getByText("$49.00")).toBeVisible();

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = jsonLd.map((t) => JSON.parse(t));
    const product = parsed.find((s) => s["@type"] === "Product");
    expect(product).toBeTruthy();
    expect(product.offers.price).toBe("49.00");

    const breadcrumb = parsed.find((s) => s["@type"] === "BreadcrumbList");
    expect(breadcrumb).toBeTruthy();
    for (const item of breadcrumb.itemListElement) {
      expect(item.name).toBeTruthy();
    }
  });

  test("cart page loads", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveTitle(/.+/);
  });
});
