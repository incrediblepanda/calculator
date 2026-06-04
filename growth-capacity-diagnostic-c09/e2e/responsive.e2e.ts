import { test, expect, type Page } from "@playwright/test";

/**
 * Responsive design harness. The viewport for each run is supplied by the
 * Playwright "project" (see playwright.config.ts), so each test below executes
 * once per breakpoint.
 */

const ROUTES = [
  { path: "/", name: "index" },
  { path: "/embed", name: "embed" },
] as const;

async function gotoAndSettle(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: "networkidle" });
  // Wait for web fonts (Montserrat via @fontsource) so screenshots are stable.
  await page.evaluate(() => document.fonts.ready);
}

for (const route of ROUTES) {
  test.describe(route.name, () => {
    test("renders without horizontal overflow", async ({ page }) => {
      await gotoAndSettle(page, route.path);

      await expect(page.locator("body")).toBeVisible();

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      // Allow 1px of sub-pixel rounding slack.
      expect(
        scrollWidth,
        `Horizontal overflow detected: content is ${scrollWidth}px wide but the viewport is ${clientWidth}px`,
      ).toBeLessThanOrEqual(clientWidth + 1);
    });

    test("matches visual baseline", async ({ page }, testInfo) => {
      await gotoAndSettle(page, route.path);

      await expect(page).toHaveScreenshot(
        `${route.name}-${testInfo.project.name}.png`,
        { fullPage: true },
      );
    });
  });
}
