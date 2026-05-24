import { defineConfig, devices } from '@playwright/test'
import path from 'path'

/**
 * Playwright config for PSKO E2E suite.
 *
 * Run locally:   pnpm test:e2e
 * In CI:         BASE_URL=https://staging.psko.app pnpm test:e2e
 *
 * Auth setup:
 *   The `auth-setup` project runs first and saves authenticated browser state
 *   to tests/e2e/.auth/student.json (gitignored).  All other projects depend on
 *   it and receive that storageState so every test starts pre-authenticated.
 *
 *   Requires E2E_USER_EMAIL + E2E_USER_PASSWORD to be set; otherwise the
 *   auth-setup step will fail gracefully and dependent specs will be skipped.
 */

const STUDENT_AUTH_FILE = path.join(__dirname, 'tests/e2e/.auth/student.json')

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'tr-TR',
  },
  projects: [
    // ── 1. Auth setup ───────────────────────────────────────────────────────
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
    },

    // ── 2. Authenticated browser projects ───────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STUDENT_AUTH_FILE,
      },
      dependencies: ['auth-setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: STUDENT_AUTH_FILE,
      },
      dependencies: ['auth-setup'],
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
