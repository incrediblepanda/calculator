import { defineConfig, devices } from "@playwright/test";

/**
 * Local-only responsive design harness.
 *
 * Each "project" is a common breakpoint. Tests run against the Vite dev server
 * (auto-started below) and assert responsive sanity (no horizontal overflow)
 * plus visual-regression screenshots compared to committed baselines.
 *
 * Not wired into CI/CD - run on demand with `pnpm test:e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  retries: 0,
  reporter: "html",
  expect: {
    toHaveScreenshot: {
      // Absorb minor anti-aliasing / sub-pixel noise between runs.
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-portrait",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 667 } },
    },
    {
      name: "mobile-large",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "laptop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "desktop-wide",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:8080",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
