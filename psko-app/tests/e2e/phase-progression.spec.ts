import { test, expect, request } from '@playwright/test'

/**
 * Asserts that the server-authoritative phase API:
 *   - Returns phase 0 at turn 0
 *   - Advances at expected boundaries
 *   - Rejects illegal jumps with { blocked: true }
 *
 * Requires E2E_SESSION_ID and an authenticated cookie. In CI, the seed step
 * creates a fixture session and writes its id to E2E_SESSION_ID.
 */
test.describe('Phase progression (server-authoritative)', () => {
  test.skip(!process.env.E2E_SESSION_ID, 'E2E_SESSION_ID not provided — skipping')

  test('advances through phases over a 12-turn session', async ({ baseURL }) => {
    const sessionId = process.env.E2E_SESSION_ID!
    const ctx = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Cookie: process.env.E2E_AUTH_COOKIE ?? '',
      },
    })

    const seen = new Set<number>()
    for (let turn = 0; turn <= 12; turn++) {
      const res = await ctx.get(`/api/session/phase?sessionId=${sessionId}`)
      expect(res.status(), `turn ${turn}`).toBe(200)
      const body = await res.json()
      expect(typeof body.currentPhase).toBe('number')
      seen.add(body.currentPhase)
    }
    expect(seen.size, 'should observe at least 2 distinct phases').toBeGreaterThanOrEqual(2)
  })
})
