import { test, expect } from '@playwright/test'
import { checkA11y } from './helpers/a11y'

test.describe('Intake validation', () => {
  test('rejects empty submission and announces errors', async ({ page }) => {
    await page.goto('/intake')
    await page.getByRole('button', { name: /gönder|tamamla/i }).click()
    // Error region should appear and be focusable / announced
    const error = page.getByRole('alert')
    await expect(error).toBeVisible()
    await checkA11y(page, 'intake-error')
  })
})
