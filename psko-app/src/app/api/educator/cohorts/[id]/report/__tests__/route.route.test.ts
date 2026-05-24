/**
 * API route tests for GET /api/educator/cohorts/[id]/report
 *
 * Tests run with Jest (*.route.test.ts).
 *
 * RED phase rationale:
 *   The route file does NOT exist yet.
 *   Import at line 1 will fail with MODULE_NOT_FOUND → all tests are RED
 *   for the right reason (missing implementation, not a test error).
 *
 * Mocking strategy:
 *   - @/lib/supabase/server  → fake auth client
 *   - @/lib/db/prisma        → fake PrismaClient
 *   - @/lib/auth/requireEducator → controllable guard
 *
 * The route is expected to:
 *   - Call requireEducator; throw → 403
 *   - Verify cohort belongs to calling educator
 *   - Aggregate SessionFeedbackScore rows across all cohort members
 *   - Return { studentScores: [...], domainAverages: [...] }
 */

import { GET } from '../route'

// ── Supabase mock ─────────────────────────────────────────────────────────────

const mockGetUser = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    }),
  ),
}))

// ── Auth mock ─────────────────────────────────────────────────────────────────

const mockRequireEducator = jest.fn()

jest.mock('@/lib/auth', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextResponse } = require('next/server')
  return {
    requireEducator: (...args: unknown[]) => mockRequireEducator(...args),
    mapAuthError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      if (/forbidden/i.test(msg)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      if (/unauthenticated/i.test(msg)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return null
    },
  }
})

// ── Prisma mock ───────────────────────────────────────────────────────────────

const mockCohortFindUnique = jest.fn()
const mockSessionFeedbackScoreFindMany = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    cohort: {
      findUnique: (...args: unknown[]) => mockCohortFindUnique(...args),
    },
    sessionFeedbackScore: {
      findMany: (...args: unknown[]) => mockSessionFeedbackScoreFindMany(...args),
    },
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGETRequest(cohortId = 'cohort-1'): [Request, { params: { id: string } }] {
  const req = new Request(
    `http://localhost/api/educator/cohorts/${cohortId}/report`,
  )
  return [req, { params: { id: cohortId } }]
}

const MOCK_EDUCATOR = { id: 'educator-1', role: 'EDUCATOR', email: 'educator@test.com' }

// Cohort fixture with two active members
const MOCK_COHORT = {
  id: 'cohort-1',
  name: 'Spring 2026',
  instructorId: 'educator-1',
  memberships: [
    {
      studentId: 'student-a',
      status: 'ACTIVE',
      student: { id: 'student-a', email: 'alice@test.com' },
    },
    {
      studentId: 'student-b',
      status: 'ACTIVE',
      student: { id: 'student-b', email: 'bob@test.com' },
    },
  ],
}

// Score rows for the two members
const MOCK_SCORES = [
  {
    id: 'score-1',
    sessionId: 'sess-a1',
    domain: 'Agenda Setting',
    score: 4,
    assessor: 'ai',
    createdAt: new Date('2026-05-01T10:00:00Z'),
    session: { userId: 'student-a', endedAt: new Date('2026-05-01T10:00:00Z') },
  },
  {
    id: 'score-2',
    sessionId: 'sess-a1',
    domain: 'Feedback',
    score: 5,
    assessor: 'ai',
    createdAt: new Date('2026-05-01T10:00:00Z'),
    session: { userId: 'student-a', endedAt: new Date('2026-05-01T10:00:00Z') },
  },
  {
    id: 'score-3',
    sessionId: 'sess-b1',
    domain: 'Agenda Setting',
    score: 3,
    assessor: 'ai',
    createdAt: new Date('2026-05-02T10:00:00Z'),
    session: { userId: 'student-b', endedAt: new Date('2026-05-02T10:00:00Z') },
  },
]

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()

  mockGetUser.mockResolvedValue({ data: { user: { id: 'educator-1' } } })
  mockRequireEducator.mockResolvedValue(MOCK_EDUCATOR)
  mockCohortFindUnique.mockResolvedValue({ ...MOCK_COHORT })
  mockSessionFeedbackScoreFindMany.mockResolvedValue(MOCK_SCORES)
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/educator/cohorts/[id]/report
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET — returns cohort aggregate report', () => {
  /**
   * RED: route does not exist → MODULE_NOT_FOUND at import.
   */
  it('returns 200 with studentScores and domainAverages arrays', async () => {
    // Arrange: mocks set up in beforeEach

    // Act
    const [req, ctx] = makeGETRequest('cohort-1')
    const res = await GET(req, ctx)
    const body = await res.json()

    // Assert: HTTP success
    expect(res.status).toBe(200)

    // studentScores must be an array with at least one entry per member
    expect(Array.isArray(body.studentScores)).toBe(true)
    expect(body.studentScores.length).toBeGreaterThan(0)

    // domainAverages aggregates across all members
    expect(Array.isArray(body.domainAverages)).toBe(true)
    expect(body.domainAverages.length).toBeGreaterThan(0)

    // Each domainAverage entry has domain and average
    const firstAvg = body.domainAverages[0]
    expect(firstAvg).toHaveProperty('domain')
    expect(firstAvg).toHaveProperty('average')
    expect(typeof firstAvg.average).toBe('number')
  })
})

describe('GET — returns 403 if not educator', () => {
  /**
   * RED: route doesn't exist yet.
   */
  it('returns 403 when requireEducator throws', async () => {
    // Arrange: non-educator caller
    mockRequireEducator.mockRejectedValue(new Error('Forbidden: EDUCATOR role required'))

    // Act
    const [req, ctx] = makeGETRequest('cohort-1')
    const res = await GET(req, ctx)
    const body = await res.json()

    // Assert
    expect(res.status).toBe(403)
    expect(body.error).toMatch(/forbidden/i)
  })
})

describe('GET — returns empty arrays for cohort with no sessions', () => {
  /**
   * RED: route doesn't exist yet.
   * A cohort with members but zero completed sessions must return 200
   * with empty studentScores (not a 404 or 500).
   */
  it('returns 200 with empty studentScores when no score rows exist', async () => {
    // Arrange: cohort exists with members but no feedback scores
    mockSessionFeedbackScoreFindMany.mockResolvedValue([])

    // Act
    const [req, ctx] = makeGETRequest('cohort-1')
    const res = await GET(req, ctx)
    const body = await res.json()

    // Assert: graceful empty state
    expect(res.status).toBe(200)
    expect(body.studentScores).toEqual([])
    expect(Array.isArray(body.domainAverages)).toBe(true)
  })
})
