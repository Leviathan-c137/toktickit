import { test, expect } from "@playwright/test";

test.describe("Lab 2 Sprint 2: E2E Requester Ticket Lifecycle & Ownership Isolation", () => {
  let createdTicketNumber = "";

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to simulate fresh session
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("E2E-01: Complete Requester Ticketing lifecycle flow (AC-01 to AC-12)", async ({
    page,
  }) => {
    // Step 1: Requester Gate (AC-01, FR-01, BR-04)
    // When visiting the app with no stored requester, the selector must appear
    const requesterSelect = page.locator('[data-testid="requester-select"]');
    await expect(requesterSelect).toBeVisible({ timeout: 10000 });

    // Inactive requesters must be excluded (BR-05)
    const options = await requesterSelect.locator("option").allInnerTexts();
    expect(options.some((opt) => opt.includes("David Wilson"))).toBe(false);

    // Select active requester "Jennifer Anderson"
    await requesterSelect.selectOption("1");
    const selectBtn = page.locator('[data-testid="continue-btn"]');
    await expect(selectBtn).toBeEnabled();
    await selectBtn.click();

    // Step 2: Context Established & Header Identity (AC-02, FR-02)
    const userGreeting = page.locator("h2", { hasText: "Welcome, Jennifer Anderson" });
    await expect(userGreeting).toBeVisible();

    // Step 3: Ticket Creation (AC-03, FR-03, BR-01)
    const createTicketCta = page.locator('[data-testid="create-ticket-cta"]');
    await createTicketCta.click();

    // Fill form
    await page.locator('[data-testid="category-select"]').selectOption({ label: "Hardware" });
    await page.locator('[data-testid="system-select"]').selectOption({ label: "Corporate Laptop" });
    await page.locator('[data-testid="priority-select"]').selectOption("High");
    await page.locator('[data-testid="summary-input"]').fill("E2E Test: Laptop screen backlight flickering");
    await page.locator('[data-testid="description-input"]').fill(
      "The screen backlight flickers violently when running graphic-intensive applications."
    );

    // Attach valid test file
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles({
      name: "screen-flicker-sample.png",
      mimeType: "image/png",
      buffer: Buffer.from("dummy e2e png buffer"),
    });

    // Submit ticket
    const submitBtn = page.locator('[data-testid="submit-ticket-btn"]');
    await submitBtn.click();

    // Verify Success View & Ticket Number format (AC-03, BR-01, FR-04)
    const successTitle = page.locator("h2", { hasText: "Ticket Created Successfully" });
    await expect(successTitle).toBeVisible({ timeout: 10000 });

    const ticketNoEl = page.locator('[data-testid="created-ticket-number"]');
    await expect(ticketNoEl).toBeVisible();
    createdTicketNumber = (await ticketNoEl.innerText()).trim();
    expect(createdTicketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

    // Step 4: My Tickets Screen (AC-07, AC-08, FR-07)
    // Click button to return to tickets dashboard
    const backDashboardBtn = page.locator("button", { hasText: "Back to Dashboard" });
    await backDashboardBtn.click();

    // Verify newly created ticket appears in My Tickets table
    const table = page.locator('[data-testid="tickets-table"]');
    await expect(table).toBeVisible();
    const createdRow = table.locator("tr", { hasText: createdTicketNumber });
    await expect(createdRow).toBeVisible();
    await expect(createdRow).toContainText("E2E Test: Laptop screen backlight flickering");
    await expect(createdRow).toContainText("Hardware");
    await expect(createdRow).toContainText("High");
    await expect(createdRow).toContainText("New");

    // Step 5: Requester Ticket Detail Screen (AC-10, FR-10)
    await createdRow.click();

    // Verify detail view is rendered with read-only containers
    const detailTicketNo = page.locator('[data-testid="detail-ticket-number"]');
    await expect(detailTicketNo).toHaveText(createdTicketNumber);

    const detailSummary = page.locator('[data-testid="detail-summary"]');
    await expect(detailSummary).toHaveText("E2E Test: Laptop screen backlight flickering");

    const detailDesc = page.locator('[data-testid="detail-description"]');
    await expect(detailDesc).toContainText("The screen backlight flickers violently");

    // Verify active attachment is listed
    const activeAttList = page.locator('[data-testid="active-attachments-list"]');
    await expect(activeAttList).toContainText("screen-flicker-sample.png");

    // Step 6: Soft-Removal of Attachment (AC-12, BR-11)
    const removeBtn = activeAttList.locator("button", { hasText: "Remove" }).first();
    await removeBtn.click();

    // Modal opens
    const modal = page.locator('[data-testid="removal-modal"]');
    await expect(modal).toBeVisible();

    const reasonInput = page.locator('[data-testid="removal-reason-input"]');
    await reasonInput.fill("Uploaded duplicate diagnostic screenshot");

    const confirmRemovalBtn = page.locator('[data-testid="confirm-removal-btn"]');
    await expect(confirmRemovalBtn).toBeEnabled();
    await confirmRemovalBtn.click();

    // Verify attachment is moved to soft-removed list with "Removed" badge and reason
    const removedSection = page.locator('[data-testid="removed-attachments-section"]');
    await expect(removedSection).toBeVisible();
    await expect(removedSection.locator('[data-testid="removed-badge"]')).toHaveText("Removed");
    await expect(removedSection).toContainText("Uploaded duplicate diagnostic screenshot");

    // Download button must be disabled
    const disabledDownload = removedSection.locator("button", { hasText: "Download Disabled (410)" });
    await expect(disabledDownload).toBeDisabled();

    // Return to list
    const backBtn = page.locator('[data-testid="back-to-tickets-btn"]');
    await backBtn.click();
    await expect(table).toBeVisible();
  });

  test("E2E-02: Multi-requester ownership isolation (AC-07, AC-11, BR-12)", async ({
    page,
    request,
  }) => {
    // 1. Establish session as Jennifer Anderson (Requester 1)
    await page.goto("/");
    const requesterSelect = page.locator('[data-testid="requester-select"]');
    await requesterSelect.selectOption("1");
    await page.locator('[data-testid="continue-btn"]').click();
    await expect(page.locator("h2", { hasText: "Welcome, Jennifer Anderson" })).toBeVisible();

    // 2. Switch Requester to Michael Brown (Requester 2)
    const switchBtn = page.locator("button", { hasText: "Switch Requester" });
    await switchBtn.click();

    await expect(page.locator('[data-testid="requester-select"]')).toBeVisible();
    await page.locator('[data-testid="requester-select"]').selectOption("2");
    await page.locator('[data-testid="continue-btn"]').click();

    // Verify identity changed
    await expect(page.locator("h2", { hasText: "Welcome, Michael Brown" })).toBeVisible();

    // In My Tickets, Michael Brown should NOT see Jennifer Anderson's E2E ticket
    const table = page.locator('[data-testid="tickets-table"]');
    if (await table.isVisible()) {
      await expect(table).not.toContainText("E2E Test: Laptop screen backlight flickering");
    }

    // 3. Direct unauthorized API attempt: Michael Brown (id: 2) attempts to fetch tickets of Requester 1
    // or access Requester 1's ticket details
    const res = await request.get("http://localhost:3000/api/tickets", {
      headers: { "x-requester-id": "2" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const items = body.items || [];
    // Verify none of the items belong to Jennifer Anderson's E2E summary
    const leaked = items.some((item: any) =>
      item.summary.includes("E2E Test: Laptop screen backlight flickering")
    );
    expect(leaked).toBe(false);
  });

  test("AC-13: Responsive Layout Verification across Desktop and Mobile Viewports", async ({
    page,
  }) => {
    await page.goto("/");
    const requesterSelect = page.locator('[data-testid="requester-select"]');
    await requesterSelect.selectOption("1");
    await page.locator('[data-testid="continue-btn"]').click();

    // Desktop Viewport (>= 992px)
    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopTable = page.locator('[data-testid="tickets-table"]');
    const mobileCards = page.locator('[data-testid="tickets-card-list"]');

    // Either table or empty state is visible on desktop, but mobile cards container is hidden
    if (await desktopTable.count() > 0) {
      await expect(desktopTable).toBeVisible();
      await expect(mobileCards).toBeHidden();
    }

    // Mobile Viewport (< 768px)
    await page.setViewportSize({ width: 375, height: 667 });
    if (await mobileCards.count() > 0) {
      await expect(mobileCards).toBeVisible();
      await expect(desktopTable).toBeHidden();
    }
  });
});
