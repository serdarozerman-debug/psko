/**
 * Playwright global setup — authenticates the E2E test user and saves
 * browser storage state so individual specs start pre-authenticated.
 *
 * Runs as the "auth-setup" Playwright project (configured in playwright.config.ts).
 * Output is written to tests/e2e/.auth/student.json (gitignored).
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY   (for seed step — create user if missing)
 *   E2E_USER_EMAIL              (default: e2e-student@psko.local)
 *   E2E_USER_PASSWORD           (default: e2e-password-secure-1)
 *   E2E_BASE_URL                (default: http://localhost:3000)
 */

import { test as setup, expect } from '@playwright/test'
import path from 'path'
import { seedE2EFixtures, E2E_USER_EMAIL, E2E_USER_PASSWORD } from './helpers/seed'

export const STUDENT_AUTH_FILE = path.join(__dirname, '.auth/student.json')

setup('authenticate as E2E student', async ({ page }) => {
  // Only seed when we have a service role key (CI or local with full secrets).
  // Skip seeding when running against a pre-seeded staging env.
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[auth.setup] Seeding E2E fixtures...')
    await seedE2EFixtures()
    console.log('[auth.setup] Seed complete.')
  } else {
    console.log('[auth.setup] SUPABASE_SERVICE_ROLE_KEY not set — skipping seed, user must pre-exist.')
  }

  // Navigate to sign-in page and authenticate
  await page.goto('/auth/sign-in')
  await expect(page).toHaveURL(/sign-in/)

  await page.getByLabel(/e-?posta|email/i).fill(E2E_USER_EMAIL)
  await page.getByLabel(/şifre|parola|password/i).fill(E2E_USER_PASSWORD)
  await page.getByRole('button', { name: /giriş|oturum aç|sign in/i }).click()

  // Wait for redirect to dashboard or intake
  await expect(page).toHaveURL(/\/(intake|dashboard)/, { timeout: 15_000 })

  // Save auth state (cookies + localStorage with Supabase session)
  await page.context().storageState({ path: STUDENT_AUTH_FILE })
  console.log(`[auth.setup] Auth state saved to ${STUDENT_AUTH_FILE}`)
})
