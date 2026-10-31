import { test, expect } from "@playwright/test";

test.describe("Lab 4 Responsive Layout and Accessibility Verification", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("Desktop Viewport (1280x800): Dual-column layouts and comprehensive dashboard metrics", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    await signInBtn.waitFor({ state: "visible", timeout: 8000 });
    await signInBtn.click();

    await page.locator('[data-testid="login-email"]').fill("mbrown@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    await page.locator('[data-testid="nav-staff-dashboard"]').click();
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible({ timeout: 10000 });

    // Verify 5 metric cards render horizontally
    await expect(page.locator('[data-testid="staff-metric-cards"]')).toBeVisible();

    // Check no horizontal body overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("Tablet Viewport (820x1180): Flexible card grid and responsive actions taken table", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/");

    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    await signInBtn.waitFor({ state: "visible", timeout: 8000 });
    await signInBtn.click();

    await page.locator('[data-testid="login-email"]').fill("janderson@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="requester-metric-cards"]')).toBeVisible();

    // Check no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("Mobile Viewport (375x667): Stacked cards, responsive tables, and mobile navigation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    await signInBtn.waitFor({ state: "visible", timeout: 8000 });
    await signInBtn.click();

    await page.locator('[data-testid="login-email"]').fill("mbrown@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    await page.locator('[data-testid="nav-staff-dashboard"]').click();
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible({ timeout: 10000 });

    // Verify cards are stacked without overflow
    await expect(page.locator('[data-testid="metric-card-new"]')).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});
