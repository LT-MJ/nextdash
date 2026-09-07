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

test("block editor, menus, reading settings, and header/footer chrome work end-to-end", async ({ page }) => {
  const unique = Date.now();
  const menuName = `E2E Nav ${unique}`;
  const pageSlug = `e2e-block-page-${unique}`;
  const pageTitle = `E2E Block Page ${unique}`;
  const headingText = `E2E Block Heading ${unique}`;
  const navLabel = `E2E Docs ${unique}`;

  await login(page);

  // --- Menu builder: create a menu with a custom link item ---
  await page.goto("/admin/menus");
  await page.getByRole("button", { name: /new menu/i }).click();
  await page.getByLabel("Name").fill(menuName);
  await page.getByRole("button", { name: /create menu/i }).click();
  await expect(page).toHaveURL(/\/admin\/menus\/[a-z0-9]+$/);

  await page.getByRole("button", { name: /add item/i }).click();
  const addItemDialog = page.getByRole("dialog");
  await addItemDialog.getByPlaceholder("https://… or /a-page").fill("https://example.com/docs");
  await addItemDialog.getByPlaceholder("Menu label").fill(navLabel);
  await addItemDialog.getByRole("button", { name: /^add item$/i }).click();
  await expect(page.getByText(navLabel)).toBeVisible();

  // --- Header & Footer: assign the new menu as the primary nav ---
  await page.goto("/admin/site/header-footer");
  await page.getByRole("combobox", { name: "Primary menu" }).click();
  await page.getByRole("option", { name: menuName }).click();
  await page.getByRole("button", { name: /save settings/i }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // --- Pages: create a page using the block editor, then publish it ---
  await page.goto("/admin/pages/new");
  await page.getByLabel("Title").fill(pageTitle);
  await page.getByLabel("Slug").fill(pageSlug);

  await page.getByRole("button", { name: /add block/i }).click();
  await page.getByRole("menuitem", { name: "Heading" }).click();
  await page.getByPlaceholder("Heading text").fill(headingText);

  await page.getByRole("button", { name: /create page/i }).click();
  await expect(page).toHaveURL(/\/admin\/pages\/[a-z0-9]+$/);
  await expect(page.getByRole("tab", { name: "SEO" })).toBeVisible();

  await page.getByLabel("Status").selectOption("PUBLISHED");
  await page.getByRole("button", { name: /save changes/i }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  const publicPageRes = await page.request.get(`/${pageSlug}`);
  expect(publicPageRes.status()).toBe(200);
  const publicPageHtml = await publicPageRes.text();
  expect(publicPageHtml).toContain(`<h2>${headingText}</h2>`);
  expect(publicPageHtml).toContain(`>${navLabel}<`);
  expect(publicPageHtml).toContain('href="https://example.com/docs"');

  // --- Reading Settings: assign the new page as the homepage ---
  await page.goto("/admin/site/reading");
  await page.getByRole("combobox", { name: "Homepage mode" }).click();
  await page.getByRole("option", { name: "A static page" }).click();
  await page.getByRole("combobox", { name: "Homepage page" }).click();
  await page.getByRole("option", { name: pageTitle }).click();
  await page.getByRole("button", { name: /save settings/i }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  const homepageRes = await page.request.get("/");
  expect(homepageRes.status()).toBe(200);
  const homepageHtml = await homepageRes.text();
  expect(homepageHtml).toContain(headingText);
  expect(homepageHtml).toContain(navLabel);

  // --- Cleanup: restore Reading Settings, then delete the page and menu ---
  await page.goto("/admin/site/reading");
  await page.getByRole("combobox", { name: "Homepage mode" }).click();
  await page.getByRole("option", { name: "A hero banner (default)" }).click();
  await page.getByRole("button", { name: /save settings/i }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  await page.goto("/admin/site/header-footer");
  await page.getByRole("combobox", { name: "Primary menu" }).click();
  await page.getByRole("option", { name: "None" }).click();
  await page.getByRole("button", { name: /save settings/i }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  await page.goto(`/admin/pages`);
  await page.getByRole("link", { name: pageTitle }).click();
  await page.getByRole("button", { name: /delete page/i }).click();
  await page.getByRole("button", { name: /delete permanently/i }).click();
  await expect(page).toHaveURL(/\/admin\/pages$/);

  const afterDelete = await page.request.get(`/${pageSlug}`);
  expect(afterDelete.status()).toBe(404);

  await page.goto("/admin/menus");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("row", { name: new RegExp(menuName) }).getByRole("button").click();
  await expect(page.getByText(menuName)).not.toBeVisible();
});
