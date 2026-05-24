/**
 * API route tests for GET /api/educator/students/[studentId]/report
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
 *   - @/lib/auth/requireEducator → controllable guard (throw to simulate 403)
 *
 * The route is expected to:
 *   - Call requireEducator; throw → 403
 *   - Verify that the student belongs to a cohort managed by the educator
 *   - Query SessionFeedbackScore rows for the student
 *   - Return { scores: [...], cohortAverages: [...] }
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

const mockUserFindUnique = jest.fn()
const mockCohortFindFirst = jest.fn()
const mockSessionFeedbackScoreFindMany = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    cohort: {
      findFirst: (...args: unknown[]) => mockCohortFindFirst(...args),
    },
    sessionFeedbackScore: {
      findMany: (...args: unknown[]) => mockSessionFeedbackScoreFindMany(...args),
    },
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGETRequest(studentId = 'student-1'): [Request, { params: { studentId: string } }] {
  const req = new Request(
    `http://localhost/api/educator/students/${studentId}/report`,
  )
  return [req, { params: { studentId } }]
}

const MOCK_EDUCATOR = { id: 'educator-1', role: 'EDUCATOR', email: 'educator@test.com' }

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()

  mockGetUser.mockResolvedValue({ data: { user: { id: 'educator-1' } } })
  mockRequireEducator.mockResolvedValue(MOCK_EDUCATOR)

  // Student found within a cohort owned by educator
  mockUserFindUnique.mockResolvedValue({ id: 'student-1', email: 'student@test.com', role: 'STUDENT' })
  mockCohortFindFirst.mockResolvedValue({ id: 'cohort-1', instructorId: 'educator-1' })

  // Sample score rows for the student
  mockSessionFeedbackScoreFindMany.mockResolvedValue([
    {
      id: 'score-1',
      sessionId: 'sess-a',
      domain: 'Agenda Setting',
      score: 4,
      assessor: 'ai',
      createdAt: new Date('2026-05-01T10:00:00Z'),
      session: { endedAt: new Date('2026-05-01T10:00:00Z') },
    },
    {
      id: 'score-2',
      sessionId: 'sess-a',
      domain: 'Feedback',
      score: 5,
      assessor: 'ai',
      createdAt: new Date('2026-05-01T10:00:00Z'),
      session: { endedAt: new Date('2026-05-01T10:00:00Z') },
    },
    {
      id: 'score-3',
      sessionId: 'sess-b',
      domain: 'Agenda Setting',
      score: 5,
      assessor: 'ai',
      createdAt: new Date('2026-05-10T11:00:00Z'),
      session: { endedAt: new Date('2026-05-10T11:00:00Z') },
    },
  ])
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/educator/students/[studentId]/report
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET — returns student report with score trends', () => {
  /**
   * RED: route does not exist → MODULE_NOT_FOUND at import.
   */
  it('returns 200 with scores array and cohortAverages array', async () => {
    // Arrange: mocks set up in beforeEach

    // Act
    const [req, ctx] = makeGETRequest('student-1')
    const res = await GET(req, ctx)
    const body = await res.json()

    // Assert
    expect(res.status).toBe(200)

    // scores must be an array
    expect(Array.isArray(body.scores)).toBe(true)
    expect(body.scores.length).toBeGreaterThan(0)

    // Each score entry has sessionId, domain, score, date
    const firstScore = body.scores[0]
    expect(firstScore).toHaveProperty('domain')
    expect(firstScore).toHaveProperty('score')

    // cohortAverages must be an array
    expect(Array.isArray(body.cohortAverages)).toBe(true)
  })
})

describe('GET — returns 403 for STUDENT role accessing another student report', () => {
  /**
   * RED: route doesn't exist yet.
   * When requireEducator throws (simulating a STUDENT caller), the route
   * must catch and return 403.
   */
  it('returns 403 when requireEducator throws Forbidden', async () => {
    // Arrange: requireEducator throws — caller is STUDENT, not EDUCATOR
    mockRequireEducator.mockRejectedValue(new Error('Forbidden: EDUCATOR role required'))

    // Act
    const [req, ctx] = makeGETRequest('student-1')
    const res = await GET(req, ctx)
    const body = await res.json()

    // Assert
    expect(res.status).toBe(403)
    expect(body.error).toMatch(/forbidden/i)
  })
})

describe('GET — returns 404 if student not in any educator cohort', () => {
  /**
   * RED: route doesn't exist yet.
   * Educator is authenticated but the student belongs to no cohort the
   * educator manages → route must 404.
   */
  it('returns 404 when student is not in any cohort owned by this educator', async () => {
    // Arrange: no cohort found linking educator ↔ student
    mockCohortFindFirst.mockResolvedValue(null)

    // Act
    const [req, ctx] = makeGETRequest('student-999')
    const res = await GET(req, ctx)
    const body = await res.json()

    // Assert
    expect(res.status).toBe(404)
    expect(body.error).toMatch(/not found/i)
  })
})
