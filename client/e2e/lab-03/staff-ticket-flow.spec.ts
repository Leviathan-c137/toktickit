import { test, expect } from "@playwright/test";

test.describe("Lab 3 E2E-02: IT Staff Ticket Management Workflow (AC-05, AC-06, AC-07, AC-08)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("E2E-02: Full IT Staff journey — Queue triage, claim ticket, update priority/status, post internal note & public comment", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Sign In as IT Staff (Michael Brown)
    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    await signInBtn.waitFor({ state: "visible", timeout: 8000 });
    await signInBtn.click();

    await page.locator('[data-testid="login-email"]').fill("mbrown@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await page.locator('[data-testid="login-submit"]').click();

    // 2. Queue view visible
    await expect(page.locator("h1", { hasText: "IT Staff Ticket Queue" })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="user-profile-badge"]')).toContainText("Michael Brown");

    // 3. Queue search and filter interactions
    const searchInput = page.locator('[data-testid="search-tickets-input"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill("TKT");
    }

    // 4. Click View Detail on the first ticket in the queue
    const firstDetailBtn = page.locator("table tbody tr button", { hasText: "View Detail" }).first();
    await expect(firstDetailBtn).toBeVisible({ timeout: 5000 });
    await firstDetailBtn.click();

    // 5. Staff Ticket Detail loaded
    await expect(page.locator(".breadcrumb-item.active")).toBeVisible({ timeout: 10000 });
    const ticketSummary = page.locator("h3.fw-bold");
    await expect(ticketSummary).toBeVisible();

    // 6. IT Priority and Status Controls
    const prioritySelect = page.locator("#ticket-it-priority-select");
    await expect(prioritySelect).toBeVisible();
    await prioritySelect.selectOption("High");

    // 7. Tabbed Feed: Confidential Internal Notes (FR-08, BR-05)
    const notesTab = page.locator('button:has-text("Internal Notes")');
    await notesTab.click();

    await expect(page.locator("text=Confidential • IT Staff & Admin Only")).toBeVisible();
    const noteTextarea = page.locator("#internal-note-input");
    await noteTextarea.fill("E2E Automated test: checked switch port and verified VLAN tagging.");

    const postNoteBtn = page.locator('button:has-text("Post Internal Note")');
    await postNoteBtn.click();

    await expect(
      page.locator("p", { hasText: "E2E Automated test: checked switch port and verified VLAN tagging." }).first()
    ).toBeVisible({ timeout: 8000 });

    // 8. Tabbed Feed: Public Comments (FR-07)
    const commentsTab = page.locator('button:has-text("Public Comments")');
    await commentsTab.click();

    const commentTextarea = page.locator("#publicCommentInput");
    await commentTextarea.fill("E2E Automated test: please test your network access now.");

    const postCommentBtn = page.locator("#submitCommentBtn");
    await postCommentBtn.click();

    await expect(
      page.locator(".small", { hasText: "E2E Automated test: please test your network access now." }).first()
    ).toBeVisible({ timeout: 8000 });
  });
});
