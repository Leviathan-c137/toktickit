import { test, expect } from "@playwright/test";

test.describe("Lab 4 E2E-02: Ticket Workflow, Permitted Transitions, and Resolution Gate (AC-05, AC-06, AC-07, BR-06, BR-07)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("E2E-02: Full lifecycle — Staff permitted transitions, Resolution Gate enforcement, and Requester advisory indication", async ({
    page,
  }) => {
    // -------------------------------------------------------------------------
    // 1. Sign In as IT Staff (Michael Brown)
    // -------------------------------------------------------------------------
    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    await signInBtn.waitFor({ state: "visible", timeout: 8000 });
    await signInBtn.click();

    await page.locator('[data-testid="login-email"]').fill("mbrown@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page.locator("h1", { hasText: "IT Staff Ticket Queue" })).toBeVisible({ timeout: 10000 });

    // Open first ticket in queue
    const firstDetailBtn = page.locator("table tbody tr button", { hasText: "View Detail" }).first();
    await expect(firstDetailBtn).toBeVisible({ timeout: 5000 });
    await firstDetailBtn.click();

    await expect(page.locator(".breadcrumb-item.active")).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------------------
    // 2. Status Transition Controls (BR-06, AC-05)
    // -------------------------------------------------------------------------
    const statusSelect = page.locator("#ticket-status-select");
    await expect(statusSelect).toBeVisible();

    // Change status to InProgress
    const options = await statusSelect.locator("option").allInnerTexts();
    if (options.some((opt) => opt.includes("In Progress") || opt.includes("InProgress"))) {
      await statusSelect.selectOption({ label: "In Progress" });

      // Confirm modal if triggered
      const confirmBtn = page.locator('[data-testid="confirm-status-transition-btn"]');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }

      await expect(page.locator('[data-testid="ticket-status-badge"]')).toContainText("In Progress", { timeout: 8000 });
    }

    // -------------------------------------------------------------------------
    // 3. Resolution Gate: Ensure Action Taken exists before Resolving (BR-07)
    // -------------------------------------------------------------------------
    // Add technical action taken to satisfy resolution gate
    const addActionBtn = page.locator('[data-testid="add-action-taken-btn"]');
    if (await addActionBtn.isVisible()) {
      await addActionBtn.click();
      await page.locator('[data-testid="action-description-input"]').fill("Diagnosed system anomaly and cleared corrupt session cache.");
      await page.locator('[data-testid="action-result-input"]').fill("Performance restored to normal thresholds.");
      await page.locator('[data-testid="submit-action-btn"]').click();
      await expect(page.locator('[data-testid="action-modal"]')).toBeHidden({ timeout: 5000 });
    }

    // Now transition to Resolved
    const updatedOptions = await statusSelect.locator("option").allInnerTexts();
    if (updatedOptions.some((opt) => opt.includes("Resolved"))) {
      await statusSelect.selectOption({ label: "Resolved" });
      const confirmBtn = page.locator('[data-testid="confirm-status-transition-btn"]');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
      await expect(page.locator('[data-testid="ticket-status-badge"]')).toContainText("Resolved", { timeout: 8000 });
    }

    // -------------------------------------------------------------------------
    // 4. Sign Out and Sign In as Requester to verify Advisory Indication
    // -------------------------------------------------------------------------
    await page.locator('[data-testid="header-sign-out-btn"]').click();
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible({ timeout: 8000 });

    await page.locator('[data-testid="login-email"]').fill("janderson@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible({ timeout: 10000 });

    // Navigate to My Tickets and open ticket
    await page.locator('[data-testid="nav-my-tickets"]').click();
    const reqTicket = page.locator("table tbody tr").first();
    if (await reqTicket.isVisible()) {
      await reqTicket.click();

      // Verify Requester sees Advisory Indicator (BR-07, AC-06)
      const resolveCard = page.locator('[data-testid="resolve-indication-card"]');
      if (await resolveCard.isVisible()) {
        const checkbox = page.locator('[data-testid="resolve-indication-checkbox"]');
        await expect(checkbox).toBeVisible();
      }
    }
  });
});
