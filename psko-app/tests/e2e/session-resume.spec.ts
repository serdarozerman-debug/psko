import { test, expect } from '@playwright/test'

test.describe('Session resume', () => {
  test.skip(!process.env.E2E_SESSION_ID, 'E2E_SESSION_ID not provided — skipping')

  test('preserves phase + turn count across reload', async ({ page }) => {
    const sessionId = process.env.E2E_SESSION_ID!
    await page.goto(`/session/${sessionId}`)
    const phaseBefore = await page.getByTestId('current-phase').textContent()
    const turnBefore = await page.getByTestId('turn-count').textContent()

    await page.reload()

    await expect(page.getByTestId('current-phase')).toHaveText(phaseBefore ?? '')
    await expect(page.getByTestId('turn-count')).toHaveText(turnBefore ?? '')
  })
})
