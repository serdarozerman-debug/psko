import { test, expect } from '@playwright/test'
import { checkA11y } from './helpers/a11y'

/**
 * Student happy-path E2E spec.
 *
 * Requires a live Supabase instance with a seeded E2E user plus the app server
 * running.  The `auth-setup` Playwright project runs first and saves session
 * state to tests/e2e/.auth/student.json; by the time this spec runs the browser
 * context is already authenticated.
 *
 * When E2E_USER_EMAIL is not set (e.g. pure unit-test CI runs) the test skips
 * itself rather than failing.
 */
test.describe('Student happy path', () => {
  test('signs in, completes intake, runs a session, sees summary', async ({ page }) => {
    test.skip(
      !process.env.E2E_USER_EMAIL,
      'E2E_USER_EMAIL not set — skipping authenticated E2E tests',
    )

    // Browser context is pre-authenticated via storageState (auth.setup.ts).
    // Navigate to the post-login landing point.
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/(intake|dashboard)/)
    await checkA11y(page, 'post-signin')

    // Intake (skip if user already onboarded)
    if (page.url().includes('/intake')) {
      await page.getByRole('button', { name: /başla|devam/i }).click()
      // Fill PHQ-9 / GAD-7 with neutral values; the test fixture seeds defaults
      const radios = await page.getByRole('radio').all()
      for (const r of radios.slice(0, 16)) {
        await r.check({ force: true }).catch(() => undefined)
      }
      await page.getByRole('button', { name: /gönder|tamamla/i }).click()
      await expect(page.getByText(/önerilen yaklaşım|recommendation/i)).toBeVisible()
    }

    // Start session
    await page.getByRole('button', { name: /seans başlat|start session/i }).click()
    await expect(page).toHaveURL(/\/session\//)
    await checkA11y(page, 'session')

    // Exchange 5 messages
    for (let i = 0; i < 5; i++) {
      const input = page.getByRole('textbox', { name: /mesaj|message/i })
      await input.fill(`Test mesajı ${i + 1}`)
      await page.getByRole('button', { name: /gönder|send/i }).click()
      // Wait for response render
      await expect(page.locator('[data-role="patient"]').nth(i)).toBeVisible({ timeout: 30_000 })
    }

    // End session
    await page.getByRole('button', { name: /seansı bitir|end session/i }).click()
    await expect(page).toHaveURL(/\/(summary|review)/)
    await checkA11y(page, 'summary')
  })
})
