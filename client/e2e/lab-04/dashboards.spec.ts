import { test, expect } from "@playwright/test";

test.describe("Lab 4 E2E-03: Operational Dashboards & Interactive Drill-Down (AC-08, AC-09, AC-10, FR-10 to FR-13)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("E2E-03: Requester Dashboard and IT Staff Dashboard metric verification and drill-down navigation", async ({
    page,
  }) => {
    // -------------------------------------------------------------------------
    // 1. Requester Journey: Operational Dashboard & Drill-Down (FR-10, AC-08, AC-10)
    // -------------------------------------------------------------------------
    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    await signInBtn.waitFor({ state: "visible", timeout: 8000 });
    await signInBtn.click();

    await page.locator('[data-testid="login-email"]').fill("janderson@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    // Verify Requester Dashboard layout
    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="metric-card-open"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-inprogress"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-resolved"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-closed"]')).toBeVisible();

    // Test drill-down: My Open card -> My Tickets filtered to OpenGroup
    await page.locator('[data-testid="drilldown-open"]').click();
    await expect(page.locator("h2", { hasText: "My Tickets" })).toBeVisible({ timeout: 8000 });
    const reqStatusFilter = page.locator('[data-testid="status-filter"]');
    await expect(reqStatusFilter).toHaveValue("OpenGroup");

    // Click "My Tickets" from header -> filter resets to All
    await page.locator('[data-testid="nav-my-tickets"]').click();
    await expect(reqStatusFilter).toHaveValue("");

    // -------------------------------------------------------------------------
    // 2. Sign Out Requester & Sign In IT Staff (Michael Brown)
    // -------------------------------------------------------------------------
    await page.locator('[data-testid="header-sign-out-btn"]').click();
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible({ timeout: 8000 });

    await page.locator('[data-testid="login-email"]').fill("mbrown@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    // Navigate to Staff Dashboard
    await page.locator('[data-testid="nav-staff-dashboard"]').click();
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible({ timeout: 10000 });

    // Verify 5 metric cards (AC-09, FR-11)
    await expect(page.locator('[data-testid="metric-card-new"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-open"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-inprogress"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-waiting"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-card-my-assigned"]')).toBeVisible();

    // Test drill-down: Open card -> Queue filtered to OpenGroup
    await page.locator('[data-testid="drilldown-open"]').click();
    await expect(page.locator("h1", { hasText: "IT Staff Ticket Queue" })).toBeVisible({ timeout: 8000 });
    await expect(page.locator("#queue-status-filter")).toHaveValue("OpenGroup");

    // Test header navigation reset
    await page.locator('[data-testid="nav-staff-dashboard"]').click();
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();

    // Test drill-down: My Assigned card -> Queue filtered to user & Active
    await page.locator('[data-testid="drilldown-my-assigned"]').click();
    await expect(page.locator("h1", { hasText: "IT Staff Ticket Queue" })).toBeVisible({ timeout: 8000 });
    await expect(page.locator("#queue-status-filter")).toHaveValue("Active");

    // Click Ticket Queue in header -> filter resets
    await page.locator('[data-testid="nav-ticket-queue"]').click();
    await expect(page.locator("#queue-status-filter")).toHaveValue("All");
  });
});
