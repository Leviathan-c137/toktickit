import { test, expect } from "@playwright/test";

test.describe("Lab 3 E2E-01: Authentication & Password Lifecycle (AC-01, AC-02, BR-01, BR-02)", () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies & storage to simulate clean unauthenticated session
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("E2E-01.1: Valid administrator login and role navigation", async ({ page }) => {
    await page.goto("/");

    // Click Sign In from header or navigate to login
    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
    }

    await expect(page.locator("h2", { hasText: "TokTickIT Sign In" })).toBeVisible();

    // Fill credentials for seeded Administrator
    await page.locator('[data-testid="login-email"]').fill("admin@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    // Verify navigation to User Management
    await expect(page.locator("h1", { hasText: "User Management" })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="user-profile-badge"]')).toContainText("System Administrator");
    await expect(page.locator('[data-testid="user-profile-badge"]')).toContainText("Admin");
  });

  test("E2E-01.2: Inactive account login rejection (BR-01)", async ({ page }) => {
    await page.goto("/");

    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
    }

    // Try logging in with inactive account
    await page.locator('[data-testid="login-email"]').fill("inactive.staff@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    // Verify error banner is shown
    const errorBanner = page.locator('[data-testid="login-error"]');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText("Invalid email or password");
  });

  test("E2E-01.3: Mandatory first-time password change workflow (AC-02, BR-02)", async ({ page }) => {
    // 1. Log in as Admin to provision a fresh user with initial password
    await page.goto("/");
    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
    }

    await page.locator('[data-testid="login-email"]').fill("admin@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page.locator("h1", { hasText: "User Management" })).toBeVisible({ timeout: 10000 });

    // Provision fresh test user
    const timestamp = Date.now();
    const freshUserEmail = `fresh.req.${timestamp}@toktickit.com`;
    const initialTempPassword = "InitialTempPass!2026";

    await page.locator("#btn-create-user").click();
    await expect(page.locator(".modal-title", { hasText: "+ Create New User Account" })).toBeVisible();

    await page.locator("#create-user-fullname").fill("Fresh Requester");
    await page.locator("#create-user-email").fill(freshUserEmail);
    await page.locator("#create-user-role").selectOption("Requester");
    await page.locator("#create-user-password").fill(initialTempPassword);
    await page.locator("#submit-create-user-btn").click();
    await expect(page.locator(".modal.show")).toHaveCount(0, { timeout: 8000 });

    // Sign out Admin
    await page.locator('[data-testid="logout-btn"]').click();
    await expect(page.locator("h2", { hasText: "TokTickIT Sign In" })).toBeVisible();

    // 2. Log in as newly provisioned user with initial temporary password
    await page.locator('[data-testid="login-email"]').fill(freshUserEmail);
    await page.locator('[data-testid="login-password"]').fill(initialTempPassword);
    await page.locator('[data-testid="login-submit"]').click();

    // 3. Must be prompted with Mandatory Password Change (AC-02, BR-02)
    await expect(page.locator("h2", { hasText: "Mandatory Password Change" })).toBeVisible({ timeout: 10000 });

    const newPass = "NewStrongPass!2026";
    await page.locator('[data-testid="new-password"]').fill(newPass);
    await page.locator('[data-testid="confirm-new-password"]').fill(newPass);

    const submitBtn = page.locator('[data-testid="change-password-submit"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 4. Successfully transitioned into dashboard
    await expect(page.locator("h1", { hasText: /My Tickets/i })).toBeVisible({ timeout: 10000 });
  });

  test("E2E-01.4: Sign out clears session and returns to login", async ({ page }) => {
    await page.goto("/");

    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
    }

    await page.locator('[data-testid="login-email"]').fill("admin@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page.locator("h1", { hasText: "User Management" })).toBeVisible({ timeout: 10000 });

    // Click Sign Out
    const logoutBtn = page.locator('[data-testid="logout-btn"]');
    await logoutBtn.click();

    // Verify user profile badge is gone and Sign In view is visible
    await expect(page.locator("h2", { hasText: "TokTickIT Sign In" })).toBeVisible();
    await expect(page.locator('[data-testid="user-profile-badge"]')).toHaveCount(0);
  });
});
