import { defineConfig, devices } from '@playwright/test';

/**
 * These tests exercise the real backend services (Identity, Object, AI
 * Memory, Search) — they are not mocked. Start every Milestone 1 service
 * plus this app's dev server before running (see README's "Run locally"),
 * or point baseURL/service URLs at wherever they're already running.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.WEB_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Pre-installed Chromium in this environment — see the repo's
        // environment notes on PLAYWRIGHT_BROWSERS_PATH.
        launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
      },
    },
  ],
});
