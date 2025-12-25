import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * IMPORTANT: E2E tests run on port 5174, completely isolated from dev server (5173).
 * This ensures tests and development don't share localStorage or interfere with each other.
 *
 * Both frontend (Vite) and backend (Express) servers are started automatically
 * before tests run and stopped when tests complete.
 *
 * @see https://playwright.dev/docs/test-configuration
 */

// E2E tests use dedicated ports to avoid conflicts with dev servers
const E2E_FRONTEND_PORT = 5174;
const E2E_BACKEND_PORT = 3002;

export default defineConfig({
  testDir: './e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL - uses dedicated e2e port, isolated from dev server */
    baseURL: `http://localhost:${E2E_FRONTEND_PORT}`,

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* Uncomment to test on more browsers
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
    */
  ],

  /* Run both frontend and backend servers for tests */
  webServer: [
    {
      // Backend API server on dedicated e2e port (isolated from dev server on 3001)
      command: `PORT=${E2E_BACKEND_PORT} npm run dev:backend`,
      cwd: '..',
      url: `http://localhost:${E2E_BACKEND_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      // Frontend dev server on dedicated e2e port, proxying to e2e backend
      command: `VITE_BACKEND_PORT=${E2E_BACKEND_PORT} npx vite --port ${E2E_FRONTEND_PORT}`,
      url: `http://localhost:${E2E_FRONTEND_PORT}`,
      reuseExistingServer: false, // Always start fresh server for tests
      timeout: 120 * 1000,
    },
  ],
});
