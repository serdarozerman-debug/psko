/**
 * axe-core helper for Playwright a11y assertions.
 * Asserts zero serious/critical violations on the current page.
 *
 * Usage:
 *   import { checkA11y } from './helpers/a11y'
 *   await checkA11y(page)
 */
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
// eslint-disable-next-line @typescript-eslint/no-var-requires
import AxeBuilder from '@axe-core/playwright'

export async function checkA11y(page: Page, name = 'page') {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const seriousOrCritical = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical'
  )

  if (seriousOrCritical.length > 0) {
    console.error(`[a11y:${name}] violations:`, JSON.stringify(seriousOrCritical, null, 2))
  }

  expect(seriousOrCritical, `axe-core serious/critical violations on ${name}`).toEqual([])
}
