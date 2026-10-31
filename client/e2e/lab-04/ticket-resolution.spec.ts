import { test, expect } from "@playwright/test";
import { createIsolatedTicket, TestTicket } from "./test-helpers.js";

test.describe("Lab 4 E2E-02: Ticket Workflow, Permitted Transitions, and Resolution Gate (AC-05, AC-06, AC-07, BR-06, BR-07)", () => {
  let ticket: TestTicket;

  test.beforeAll(async ({ request }) => {
    // Create an isolated ticket set to InProgress without any actions taken
    ticket = await createIsolatedTicket(request, {
      summary: `E2E-02 Resolution Gate Core Uplink Failure ${Date.now()}`,
      description: "Intermittent packet loss on fiber uplink between building A and datacenter.",
      status: "InProgress",
    });
  });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("E2E-02: Full lifecycle — Requester advisory indication, Resolution Gate rejection without action, action logging, and resolution", async ({
    page,
  }) => {
    // -------------------------------------------------------------------------
    // 1. Requester Advisory Indication (BR-07, AC-06)
    // -------------------------------------------------------------------------
    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    await signInBtn.waitFor({ state: "visible", timeout: 8000 });
    await signInBtn.click();

    await page.locator('[data-testid="login-email"]').fill("janderson@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page.locator('[data-testid="user-profile-badge"]')).toContainText("Jennifer Anderson", { timeout: 10000 });

    // Open My Tickets and locate isolated ticket
    await page.locator('[data-testid="nav-my-tickets"]').click();
    const reqTicketRow = page.locator(`[data-testid="ticket-row-${ticket.id}"]`);
    await expect(reqTicketRow).toBeVisible({ timeout: 8000 });
    await reqTicketRow.click();

    // Verify Advisory Indication Card is rendered for InProgress ticket
    const resolveCard = page.locator('[data-testid="resolve-indication-card"]');
    await expect(resolveCard).toBeVisible({ timeout: 8000 });

    // Click Problem Appears Resolved button and accept confirmation dialog
    const resolveBtn = page.locator('[data-testid="problem-resolved-btn"]');
    await expect(resolveBtn).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await resolveBtn.click();

    // Verify advisory notice confirms submission without mutating ticket status
    await expect(
      page.locator("text=Your indication has been recorded. IT Staff will review and update the ticket.")
    ).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="ticket-status-badge"]')).toContainText("InProgress");

    // Sign out as Requester
    await page.locator('[data-testid="logout-btn"]').click();
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible({ timeout: 8000 });

    // -------------------------------------------------------------------------
    // 2. Staff Sign In & Resolution Gate Enforcement (BR-07, AC-01, AC-06)
    // -------------------------------------------------------------------------
    await page.locator('[data-testid="login-email"]').fill("mbrown@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    await expect(page.locator("h1", { hasText: "IT Staff Ticket Queue" })).toBeVisible({ timeout: 10000 });

    // Search and open ticket in Staff View
    await page.locator('[data-testid="search-tickets-input"]').fill(ticket.ticketNumber);
    const staffTicketRow = page.locator(`[data-testid="ticket-row-${ticket.id}"]`);
    await expect(staffTicketRow).toBeVisible({ timeout: 8000 });
    await staffTicketRow.locator("button", { hasText: "View Detail" }).click();

    await expect(page.locator(".breadcrumb-item.active")).toContainText(ticket.ticketNumber, { timeout: 8000 });

    const statusSelect = page.locator("#ticket-status-select");
    await expect(statusSelect).toBeVisible();

    // ATTEMPT TO RESOLVE WITHOUT AN ACTION TAKEN -> Must be rejected by Resolution Gate
    await statusSelect.selectOption("Resolved");
    const errorAlert = page.locator('[data-testid="ticket-detail-error"]');
    await expect(errorAlert).toBeVisible({ timeout: 8000 });
    await expect(errorAlert).toContainText("Cannot resolve ticket without at least one Action Taken recorded");

    // -------------------------------------------------------------------------
    // 3. Satisfy Resolution Gate by Logging Technical Action Taken
    // -------------------------------------------------------------------------
    const addActionBtn = page.locator('[data-testid="add-action-taken-btn"]');
    await expect(addActionBtn).toBeVisible();
    await addActionBtn.click();

    await expect(page.locator('[data-testid="action-modal"]')).toBeVisible();
    await page
      .locator('[data-testid="action-description-input"]')
      .fill("Replaced failing SFP optical transceiver module on datacenter switch port.");
    await page.locator('[data-testid="action-result-input"]').fill("Link restored at full 10 Gbps with 0 bit errors.");
    await page.locator('[data-testid="submit-action-btn"]').click();

    await expect(page.locator('[data-testid="action-modal"]')).toBeHidden({ timeout: 5000 });
    await expect(page.locator('[data-testid="actions-taken-list"]')).toContainText(
      "Replaced failing SFP optical transceiver module"
    );

    // -------------------------------------------------------------------------
    // 4. Transition to Resolved (Now permitted because Action Taken exists)
    // -------------------------------------------------------------------------
    await statusSelect.selectOption("Resolved");
    await expect(page.locator(".alert-success", { hasText: "Ticket status updated to Resolved" })).toBeVisible({
      timeout: 8000,
    });
    await expect(statusSelect).toHaveValue("Resolved");

    // -------------------------------------------------------------------------
    // 5. Terminal State Warning Modal (Closed)
    // -------------------------------------------------------------------------
    await statusSelect.selectOption("Closed");
    const confirmModal = page.locator('[data-testid="status-confirm-modal"]');
    await expect(confirmModal).toBeVisible({ timeout: 5000 });

    const confirmBtn = page.locator('[data-testid="confirm-status-transition-btn"]');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    await expect(confirmModal).toBeHidden({ timeout: 5000 });
    await expect(page.locator(".alert-success", { hasText: "Ticket status updated to Closed" })).toBeVisible({
      timeout: 8000,
    });
    await expect(statusSelect).toHaveValue("Closed");
  });
});
