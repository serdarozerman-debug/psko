import { test, expect } from '@playwright/test'
import { checkA11y } from './helpers/a11y'

const E2E_EMAIL = process.env.E2E_USER_EMAIL ?? 'e2e-student@psko.local'
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'e2e-password'

test.describe('Student happy path', () => {
  test('signs in, completes intake, runs a session, sees summary', async ({ page }) => {
    await page.goto('/auth/sign-in')
    await checkA11y(page, 'sign-in')

    await page.getByLabel(/e-?posta/i).fill(E2E_EMAIL)
    await page.getByLabel(/şifre|parola/i).fill(E2E_PASSWORD)
    await page.getByRole('button', { name: /giriş|oturum aç/i }).click()

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
