import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for CourseIntel frontend.
 *
 * Runs against the Next.js dev server (or production build).
 * CI: set PLAYWRIGHT_BASE_URL to the Vercel preview/production URL.
 * Local: `npm run test:e2e` starts the dev server automatically.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start the Next.js dev server before tests (local only)
  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
        },
      }),
});
