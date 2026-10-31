import { test, expect } from "@playwright/test";
import { createIsolatedTicket, TestTicket } from "./test-helpers.js";

test.describe("Lab 4 E2E-01: Actions Taken Sub-Record Workflow (AC-01, AC-02, AC-03, AC-04, FR-01 to FR-06)", () => {
  let ticket: TestTicket;

  test.beforeAll(async ({ request }) => {
    ticket = await createIsolatedTicket(request, {
      summary: `E2E-01 Patch cord replacement on rack 4B ${Date.now()}`,
      description: "Port 24 is flapping every 30 seconds affecting core lab connectivity.",
      status: "Open",
    });
  });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("E2E-01: IT Staff logs actions, enforces follow-up note, edits record, and Requester views read-only history", async ({
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

    // Verify Staff navigation and queue loaded
    await expect(page.locator("h1", { hasText: "IT Staff Ticket Queue" })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="user-profile-badge"]')).toContainText("Michael Brown");

    // -------------------------------------------------------------------------
    // 2. Open Specific Isolated Ticket in Queue
    // -------------------------------------------------------------------------
    const searchInput = page.locator('[data-testid="search-tickets-input"]');
    await searchInput.fill(ticket.ticketNumber);

    const ticketRow = page.locator(`[data-testid="ticket-row-${ticket.id}"]`);
    await expect(ticketRow).toBeVisible({ timeout: 10000 });

    const detailBtn = ticketRow.locator("button", { hasText: "View Detail" });
    await expect(detailBtn).toBeVisible();
    await detailBtn.click();

    // Verify Ticket Detail loaded with Actions Taken card
    await expect(page.locator(".breadcrumb-item.active")).toContainText(ticket.ticketNumber, { timeout: 10000 });
    await expect(page.locator('[data-testid="actions-taken-card"]')).toBeVisible();

    const addActionBtn = page.locator('[data-testid="add-action-taken-btn"]');
    await expect(addActionBtn).toBeVisible();

    // -------------------------------------------------------------------------
    // 3. Test Form Validation: Follow-up required note enforcement (AC-02, BR-04)
    // -------------------------------------------------------------------------
    await addActionBtn.click();
    await expect(page.locator('[data-testid="action-modal"]')).toBeVisible();

    // Fill valid description & result
    await page.locator('[data-testid="action-description-input"]').fill("Replaced damaged patch cord on rack 4B.");
    await page.locator('[data-testid="action-result-input"]').fill("Link restored at 1 Gbps duplex.");

    // Toggle follow-up ON without filling note
    await page.locator('[data-testid="follow-up-toggle"]').check();
    await expect(page.locator('[data-testid="follow-up-note-input"]')).toBeVisible();

    // Attempt submission with empty follow-up note
    await page.locator('[data-testid="submit-action-btn"]').click();
    await expect(page.locator('[data-testid="follow-up-note-error"]')).toBeVisible();

    // Fill follow-up note and submit
    await page.locator('[data-testid="follow-up-note-input"]').fill("Schedule cable management audit next Wednesday.");
    await page.locator('[data-testid="action-attachment-notes-input"]').fill("Fluke network test report attached.");
    await page.locator('[data-testid="submit-action-btn"]').click();

    // Verify modal closes and action appears in list
    await expect(page.locator('[data-testid="action-modal"]')).toBeHidden();
    await expect(page.locator('[data-testid="actions-taken-list"]')).toContainText("Replaced damaged patch cord on rack 4B.");
    await expect(page.locator('[data-testid="actions-taken-list"]')).toContainText("Link restored at 1 Gbps duplex.");
    await expect(page.locator('[data-testid="actions-taken-list"]')).toContainText("Follow-Up Required");
    await expect(page.locator('[data-testid="actions-taken-list"]')).toContainText("Schedule cable management audit next Wednesday.");

    // -------------------------------------------------------------------------
    // 4. Edit the Created Action Taken (AC-01, FR-02)
    // -------------------------------------------------------------------------
    const editBtn = page.locator('[data-testid^="edit-action-btn-"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await expect(page.locator('[data-testid="action-modal"]')).toBeVisible();

    await page.locator('[data-testid="action-description-input"]').fill("Replaced damaged patch cord on rack 4B and tested latency.");
    await page.locator('[data-testid="submit-action-btn"]').click();
    await expect(page.locator('[data-testid="action-modal"]')).toBeHidden();
    await expect(page.locator('[data-testid="actions-taken-list"]')).toContainText("Replaced damaged patch cord on rack 4B and tested latency.");

    // -------------------------------------------------------------------------
    // 5. Sign Out using correct logout-btn
    // -------------------------------------------------------------------------
    const signOutBtn = page.locator('[data-testid="logout-btn"]');
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible({ timeout: 8000 });

    // -------------------------------------------------------------------------
    // 6. Sign In as Requester (Jennifer Anderson)
    // -------------------------------------------------------------------------
    await page.locator('[data-testid="login-email"]').fill("janderson@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    // Verify Requester Dashboard or Nav loaded
    await expect(page.locator('[data-testid="user-profile-badge"]')).toContainText("Jennifer Anderson", { timeout: 10000 });

    // Navigate to My Tickets
    await page.locator('[data-testid="nav-my-tickets"]').click();
    await expect(page.locator("h1", { hasText: "My Tickets" })).toBeVisible({ timeout: 8000 });

    // Open the exact ticket edited by staff
    const reqTicketRow = page.locator(`[data-testid="ticket-row-${ticket.id}"]`);
    await expect(reqTicketRow).toBeVisible({ timeout: 8000 });
    await reqTicketRow.click();

    // Verify Actions Taken is in Read-Only Mode (AC-03, FR-05, FR-06)
    await expect(page.locator('[data-testid="actions-taken-card"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="requester-readonly-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-action-taken-btn"]')).toBeHidden();
    await expect(page.locator('[data-testid^="edit-action-btn-"]')).toBeHidden();
    await expect(page.locator('[data-testid="actions-taken-list"]')).toContainText("Replaced damaged patch cord on rack 4B and tested latency.");
  });
});
