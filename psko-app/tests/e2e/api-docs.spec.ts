/**
 * Smoke tests for /api/docs (Swagger UI page).
 *
 * The page does:
 *   - redirect('/auth/sign-in?next=/api/docs') when unauthenticated
 *   - renders Swagger UI HTML when authenticated
 *
 * Note: The authenticated test is skipped here — it requires a login fixture
 * (session cookies / Supabase token injection) which is out of scope for this
 * smoke-test task. The unauthenticated redirect is fully testable without
 * credentials and is the primary security gate worth verifying here.
 */

import { test, expect } from '@playwright/test'

test.describe('/api/docs smoke tests', () => {
  test('test_api_docs_unauthenticated_redirects_to_sign_in', async ({ page }) => {
    // Navigate directly; no login fixture active
    await page.goto('/api/docs')

    // Next.js redirect() causes a full browser redirect, so the URL changes
    await expect(page).toHaveURL(/\/auth\/sign-in/)

    // The redirect must carry the ?next= parameter so the user returns to
    // /api/docs after successful login (browser may or may not encode the slash)
    const url = page.url()
    expect(
      url.includes('next=%2Fapi%2Fdocs') || url.includes('next=/api/docs'),
    ).toBe(true)
  })

  // Skipped: requires authenticated session fixture (Supabase cookie injection).
  // To enable: create a test fixture that sets a valid Supabase session token,
  // then assert page contains '#swagger-ui' and the swagger-ui-bundle.js script.
  test.skip('test_api_docs_authenticated_renders_swagger_ui', async ({ page }) => {
    // TODO: inject auth fixture
    await page.goto('/api/docs')

    // Verify Swagger UI container is present
    await expect(page.locator('#swagger-ui')).toBeVisible()
  })
})
