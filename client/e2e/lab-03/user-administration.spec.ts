import { test, expect } from "@playwright/test";

test.describe("Lab 3 E2E-03: Administrator User Management & Safety Guardrails (AC-09, AC-10, AC-11, BR-10 to BR-14)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("E2E-03: Full Admin lifecycle — User provisioning, safety guardrails (self-deactivation block), and temporary password reset", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Sign in as Administrator
    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
    }

    await page.locator('[data-testid="login-email"]').fill("admin@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page.locator("h1", { hasText: "User Management" })).toBeVisible({ timeout: 10000 });

    // 2. Search & Filter
    const userSearchInput = page.locator("#search-user-input");
    await userSearchInput.fill("Michael");
    await expect(page.locator("table")).toContainText("Michael Brown");
    await userSearchInput.clear();

    // 3. Create New User Account (FR-14, AC-09)
    const createBtn = page.locator("#btn-create-user");
    await createBtn.click();

    await expect(page.locator(".modal-title", { hasText: "+ Create New User Account" })).toBeVisible();

    const timestamp = Date.now();
    const testEmail = `playwright.test.${timestamp}@toktickit.com`;

    await page.locator("#create-user-fullname").fill("Playwright Test Staff");
    await page.locator("#create-user-email").fill(testEmail);
    await page.locator("#create-user-role").selectOption("ITStaff");
    await page.locator("#create-user-department").fill("Cloud Infrastructure");
    await page.locator("#create-user-password").fill("TemporaryPass!123");

    const submitCreateBtn = page.locator("#submit-create-user-btn");
    await submitCreateBtn.click();

    // Verify modal closes and user is added
    await expect(page.locator(".modal.show")).toHaveCount(0, { timeout: 8000 });
    await expect(page.locator("table")).toContainText(testEmail);

    // 4. Verify Admin Self-Deactivation Guard (BR-12)
    // Find the row for System Administrator (admin@toktickit.com) via search
    await page.locator("#search-user-input").fill("admin@toktickit.com");
    const adminRow = page.locator("tr", { hasText: "admin@toktickit.com" });
    const adminEditBtn = adminRow.locator('button:has-text("Edit")');
    await adminEditBtn.click();

    await expect(page.locator(".modal-title", { hasText: /Edit User:/i })).toBeVisible();

    // Self-deactivation toggle must be disabled
    const activeSwitch = page.locator("#edit-user-active");
    await expect(activeSwitch).toBeDisabled();
    await expect(page.locator("text=You cannot deactivate your own account (BR-12).")).toBeVisible();

    // Close edit modal
    await page.locator(".modal.show .btn-close").click();

    // 5. Password Reset Flow (FR-16)
    // Filter by testEmail
    await page.locator("#search-user-input").fill(testEmail);
    const targetRow = page.locator("tr", { hasText: testEmail });
    const resetBtn = targetRow.locator('button:has-text("Reset Password")');
    await resetBtn.click();

    await expect(page.locator(".modal-title", { hasText: /Reset Password for/i })).toBeVisible();
    await page.locator("#reset-user-password").fill("NewResetPass!2026");

    const submitResetBtn = page.locator("#submit-reset-password-btn");
    await submitResetBtn.click();

    // Verify success notice appears
    await expect(page.locator(".alert-success")).toContainText("has been reset");
  });
});
