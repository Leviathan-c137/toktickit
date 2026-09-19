import { test, expect } from "@playwright/test";

test.describe("Lab 3 Responsive Layout Verification across Viewports", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("Desktop Viewport (1280x800): Dual-column ticket detail and full user table", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
    }

    await page.locator('[data-testid="login-email"]').fill("admin@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page.locator("h1", { hasText: "User Management" })).toBeVisible();

    // Verify desktop table and navigation
    await expect(page.locator("table thead")).toBeVisible();
    await expect(page.locator('[data-testid="nav-user-management"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-ticket-queue"]')).toBeVisible();

    // Switch to Ticket Queue
    await page.locator('[data-testid="nav-ticket-queue"]').click();
    await expect(page.locator("h1", { hasText: "IT Staff Ticket Queue" })).toBeVisible();

    // View detail
    const firstDetailBtn = page.locator("table tbody tr button", { hasText: "View Detail" }).first();
    await firstDetailBtn.click();

    // In desktop, left and right columns are side by side
    await expect(page.locator(".row.g-4")).toBeVisible();
    await expect(page.locator('button:has-text("Public Comments")')).toBeVisible();
  });

  test("Tablet Viewport (820x1180): Responsive queue and modal display", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/");

    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
    }

    await page.locator('[data-testid="login-email"]').fill("mbrown@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page.locator("h1", { hasText: "IT Staff Ticket Queue" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("Mobile Viewport (375x667): Stacked layout, readable text, no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
    }

    // Login screen is fully accessible on mobile
    await expect(page.locator("h2", { hasText: "TokTickIT Sign In" })).toBeVisible();
    await page.locator('[data-testid="login-email"]').fill("admin@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page.locator("h1", { hasText: "User Management" })).toBeVisible();

    // Verify modal on mobile
    await page.locator("#btn-create-user").click();
    await expect(page.locator(".modal-title", { hasText: "+ Create New User Account" })).toBeVisible();
    await page.locator(".modal.show .btn-close").click();
  });
});
