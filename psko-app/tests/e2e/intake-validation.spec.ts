import { test, expect } from '@playwright/test'
import { checkA11y } from './helpers/a11y'

test.describe('Intake validation', () => {
  // Skipped: /intake UI page does not exist in the current build (only /api/intake exists).
  // Re-enable when a client-facing intake form page is implemented.
  test.skip('rejects empty submission and announces errors', async ({ page }) => {
    await page.goto('/intake')
    await page.getByRole('button', { name: /gönder|tamamla/i }).click()
    // Error region should appear and be focusable / announced
    const error = page.getByRole('alert')
    await expect(error).toBeVisible()
    await checkA11y(page, 'intake-error')
  })
})
