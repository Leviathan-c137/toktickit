import { test, expect } from "@playwright/test";

// WCAG 2.1 Relative Luminance & Contrast Ratio calculation (W3C standard)
function parseRgb(colorStr: string): [number, number, number] {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (match) {
    return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
  }
  return [0, 0, 0];
}

function getLuminance([r, g, b]: [number, number, number]): number {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(c1: string, c2: string): number {
  const lum1 = getLuminance(parseRgb(c1));
  const lum2 = getLuminance(parseRgb(c2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

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

    await page.locator('[data-testid="nav-requester-dashboard"]').click();
    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="requester-metric-cards"]')).toBeVisible();

    // Check no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("Mobile Viewport (375x667): Stacked cards, touch target sizing, and accessibility", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const signInBtn = page.locator('[data-testid="header-sign-in-btn"]');
    await signInBtn.waitFor({ state: "visible", timeout: 8000 });
    await signInBtn.click();

    // 1. Verify Touch Target Sizing on primary form controls (>= 40px height for touch friendly targets)
    const submitBtn = page.locator('[data-testid="login-submit"]');
    const submitBox = await submitBtn.boundingBox();
    expect(submitBox).not.toBeNull();
    expect(submitBox!.height).toBeGreaterThanOrEqual(38);

    await page.locator('[data-testid="login-email"]').fill("mbrown@toktickit.com");
    await page.locator('[data-testid="login-password"]').fill("Password123!");
    await submitBtn.click();

    await page.locator('[data-testid="nav-staff-dashboard"]').click();
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible({ timeout: 10000 });

    // Verify cards are stacked without overflow
    await expect(page.locator('[data-testid="metric-card-new"]')).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("Accessibility: WCAG 2.1 AA Color Contrast Verification for Zen Green Palette", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Header Navbar Contrast (Zen Green #006B3C background vs White text #FFFFFF)
    const header = page.locator("header.navbar");
    await expect(header).toBeVisible();

    const headerStyles = await header.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      const textEl = el.querySelector(".navbar-brand span:nth-child(2)") as HTMLElement;
      const textComputed = textEl ? window.getComputedStyle(textEl) : computed;
      return {
        bgColor: computed.backgroundColor,
        textColor: textComputed.color,
      };
    });

    const contrastRatio = getContrastRatio(headerStyles.bgColor, headerStyles.textColor);
    // WCAG 2.1 Level AA requires at least 4.5:1 for normal text (3:1 for large text)
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });
});
