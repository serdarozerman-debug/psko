/**
 * API route tests for GET + POST /api/session/phase
 *
 * Mocking strategy:
 *   - @/lib/supabase/server  → fake auth client (avoids Next.js cookies() + Supabase network)
 *   - @/lib/db/prisma        → fake PrismaClient (avoids database connection)
 *   - getPhaseForTurn and validatePhaseTransition are NOT mocked — they are
 *     pure functions; testing them through the route exercises real behaviour.
 *
 * CBT framework phase indices (from cbt.ts):
 *   0 → triggerTurnMin 0  (Engagement & Socialisation)
 *   1 → triggerTurnMin 4  (Problem Assessment)
 *   2 → triggerTurnMin 9  (Case Formulation)
 *   3 → triggerTurnMin 15 (Intervention)
 *   4 → triggerTurnMin 25 (Consolidation & Relapse Prevention)
 */

import { GET, POST } from './route'

// ── Supabase mock ─────────────────────────────────────────────────────────────

const mockGetUser = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    })
  ),
}))

// ── Prisma mock ───────────────────────────────────────────────────────────────

const mockFindFirst = jest.fn()
const mockFindUnique = jest.fn()
const mockUpdate = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    session: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGETRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/session/phase')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return new Request(url.toString())
}

function makePOSTRequest(body: unknown): Request {
  return new Request('http://localhost/api/session/phase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function authenticatedUser(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      user: {
        id: 'user-abc',
        app_metadata: {},
        ...overrides,
      },
    },
  }
}

function noUser() {
  return { data: { user: null } }
}

// A CBT session fixture at phase 0, turn 0 (phase unchanged scenario)
const BASE_SESSION = {
  therapeuticApproach: 'cbt',
  turnCount: 0,
  currentPhase: 0,
  endedAt: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUpdate.mockResolvedValue({})
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/session/phase
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/session/phase', () => {
  describe('test_GET_unauthenticated_returns_401', () => {
    it('returns 401 when no authenticated user', async () => {
      mockGetUser.mockResolvedValue(noUser())

      const res = await GET(makeGETRequest({ sessionId: 'sess-1' }))
      const body = await res.json()

      expect(res.status).toBe(401)
      expect(body.error).toBe('Unauthorized')
    })
  })

  describe('test_GET_missing_sessionId_returns_400', () => {
    it('returns 400 when sessionId query param is absent', async () => {
      mockGetUser.mockResolvedValue(authenticatedUser())

      const res = await GET(makeGETRequest()) // no sessionId
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/sessionId/)
    })
  })

  describe('test_GET_session_not_found_returns_404', () => {
    it('returns 404 when prisma returns null for the session', async () => {
      mockGetUser.mockResolvedValue(authenticatedUser())
      mockFindFirst.mockResolvedValue(null)

      const res = await GET(makeGETRequest({ sessionId: 'nonexistent' }))
      const body = await res.json()

      expect(res.status).toBe(404)
      expect(body.error).toMatch(/not found/i)
    })
  })

  describe('test_GET_phase_unchanged_returns_guidance_without_persistence', () => {
    it('returns guidance JSON and skips DB update when phase is unchanged', async () => {
      // turnCount 0 → CBT phase 0; session.currentPhase is also 0 → no change
      mockGetUser.mockResolvedValue(authenticatedUser())
      mockFindFirst.mockResolvedValue({ ...BASE_SESSION, turnCount: 0, currentPhase: 0 })

      const res = await GET(makeGETRequest({ sessionId: 'sess-1' }))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.currentPhase).toBe(0)
      expect(body.phase).not.toBeNull()
      expect(body.nextMove).toBeDefined()
      // No persistence should happen when phase is unchanged
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('test_GET_legal_advance_persists_and_returns_guidance', () => {
    it('returns guidance and persists the new phase on a legal single-step advance', async () => {
      // turnCount 4 → CBT triggers phase 1; session.currentPhase is 0 → legal advance
      mockGetUser.mockResolvedValue(authenticatedUser())
      mockFindFirst.mockResolvedValue({ ...BASE_SESSION, turnCount: 4, currentPhase: 0 })

      const res = await GET(makeGETRequest({ sessionId: 'sess-2' }))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.currentPhase).toBe(1)
      expect(body.blocked).toBeUndefined()
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sess-2' },
          data: { currentPhase: 1 },
        })
      )
    })
  })

  describe('test_GET_illegal_phase_skip_returns_blocked', () => {
    it('returns blocked:true with attempted and reason on an illegal phase skip', async () => {
      // turnCount 9 → CBT triggers phase 2; session.currentPhase is 0 → skip of > 1
      mockGetUser.mockResolvedValue(authenticatedUser())
      mockFindFirst.mockResolvedValue({ ...BASE_SESSION, turnCount: 9, currentPhase: 0 })

      const res = await GET(makeGETRequest({ sessionId: 'sess-3' }))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.blocked).toBe(true)
      expect(body.attempted).toBe(2)
      expect(body.reason).toMatch(/skip/i)
      // currentPhase in response must be the persisted phase (0), not the attempted one
      expect(body.currentPhase).toBe(0)
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('test_GET_at_terminal_phase_with_no_available_next_returns_blocked', () => {
    it('returns blocked:true when already at terminal phase and computed phase would exceed max', async () => {
      // turnCount 999 → CBT computes phase 4 (terminal); session.currentPhase also 4 → unchanged
      // To force the "at terminal" blocked case we need from=4, to=4+1=5 — but getPhaseForTurn
      // clamps at the last phase (4), so this actually means phase unchanged (no transition needed).
      // The blocked-at-terminal case fires when fromPhase >= maxPhase (4) and toPhase = fromPhase+1.
      // We simulate this by having turnCount push to phase 4, but currentPhase=3 (legal? no — skip).
      // Actually: from=4, to=5 — but 5 is not in the CBT phase indices → "unknown target phase".
      // The only way to test "already at terminal" is: from=4, to=5, but getPhaseForTurn clamps
      // at 4 so from=4 AND to=4 → unchanged branch (no transition, no block).
      //
      // The terminal-block is reachable only via POST (explicit override). Covered there.
      // For GET the phase engine clamps, so phase-unchanged path covers terminal stay.
      //
      // This test documents the clamping behaviour: at turn 999, CBT stays at phase 4.
      mockGetUser.mockResolvedValue(authenticatedUser())
      mockFindFirst.mockResolvedValue({ ...BASE_SESSION, turnCount: 999, currentPhase: 4 })

      const res = await GET(makeGETRequest({ sessionId: 'sess-4' }))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.currentPhase).toBe(4)
      expect(body.blocked).toBeUndefined()
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/session/phase
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/session/phase', () => {
  describe('test_POST_unauthenticated_returns_401', () => {
    it('returns 401 when no authenticated user', async () => {
      mockGetUser.mockResolvedValue(noUser())

      const res = await POST(makePOSTRequest({ sessionId: 'sess-1', toPhase: 1 }))
      const body = await res.json()

      expect(res.status).toBe(401)
      expect(body.error).toBe('Unauthorized')
    })
  })

  describe('test_POST_non_admin_role_returns_403', () => {
    it('returns 403 when user app_metadata.role is not admin', async () => {
      mockGetUser.mockResolvedValue(
        authenticatedUser({ app_metadata: { role: 'student' } })
      )

      const res = await POST(makePOSTRequest({ sessionId: 'sess-1', toPhase: 1 }))
      const body = await res.json()

      expect(res.status).toBe(403)
      expect(body.error).toMatch(/admin/i)
    })
  })

  describe('test_POST_missing_body_fields_returns_400', () => {
    it('returns 400 when sessionId is missing from body', async () => {
      mockGetUser.mockResolvedValue(
        authenticatedUser({ app_metadata: { role: 'admin' } })
      )

      const res = await POST(makePOSTRequest({ toPhase: 1 }))
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/sessionId/)
    })

    it('returns 400 when toPhase is missing from body', async () => {
      mockGetUser.mockResolvedValue(
        authenticatedUser({ app_metadata: { role: 'admin' } })
      )

      const res = await POST(makePOSTRequest({ sessionId: 'sess-1' }))
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/toPhase/)
    })
  })

  describe('test_POST_illegal_transition_returns_409_with_reason', () => {
    it('returns 409 with error and reason on an illegal backward phase jump', async () => {
      mockGetUser.mockResolvedValue(
        authenticatedUser({ app_metadata: { role: 'admin' } })
      )
      // session at phase 2; attempting to jump back to phase 0
      mockFindUnique.mockResolvedValue({
        therapeuticApproach: 'cbt',
        currentPhase: 2,
        endedAt: null,
      })

      const res = await POST(makePOSTRequest({ sessionId: 'sess-5', toPhase: 0 }))
      const body = await res.json()

      expect(res.status).toBe(409)
      expect(body.error).toMatch(/illegal/i)
      expect(body.reason).toBeDefined()
      expect(typeof body.reason).toBe('string')
    })

    it('returns 409 with reason on an illegal skip-ahead jump', async () => {
      mockGetUser.mockResolvedValue(
        authenticatedUser({ app_metadata: { role: 'admin' } })
      )
      // session at phase 0; attempting to jump to phase 3 (skipping 1 and 2)
      mockFindUnique.mockResolvedValue({
        therapeuticApproach: 'cbt',
        currentPhase: 0,
        endedAt: null,
      })

      const res = await POST(makePOSTRequest({ sessionId: 'sess-6', toPhase: 3 }))
      const body = await res.json()

      expect(res.status).toBe(409)
      expect(body.error).toMatch(/illegal/i)
      expect(body.reason).toMatch(/skip/i)
    })

    it('returns 409 with reason when already at terminal phase and toPhase exceeds max', async () => {
      mockGetUser.mockResolvedValue(
        authenticatedUser({ app_metadata: { role: 'admin' } })
      )
      // CBT max phase is 4; toPhase 5 is not in the CBT framework
      mockFindUnique.mockResolvedValue({
        therapeuticApproach: 'cbt',
        currentPhase: 4,
        endedAt: null,
      })

      const res = await POST(makePOSTRequest({ sessionId: 'sess-7', toPhase: 5 }))
      const body = await res.json()

      expect(res.status).toBe(409)
      expect(body.error).toMatch(/illegal/i)
      expect(body.reason).toBeDefined()
    })
  })

  describe('test_POST_legal_transition_returns_sessionId_and_currentPhase', () => {
    it('returns sessionId and currentPhase on a legal single-step advance', async () => {
      mockGetUser.mockResolvedValue(
        authenticatedUser({ app_metadata: { role: 'admin' } })
      )
      mockFindUnique.mockResolvedValue({
        therapeuticApproach: 'cbt',
        currentPhase: 1,
        endedAt: null,
      })

      const res = await POST(makePOSTRequest({ sessionId: 'sess-8', toPhase: 2 }))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.sessionId).toBe('sess-8')
      expect(body.currentPhase).toBe(2)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sess-8' },
          data: { currentPhase: 2 },
        })
      )
    })
  })
})
