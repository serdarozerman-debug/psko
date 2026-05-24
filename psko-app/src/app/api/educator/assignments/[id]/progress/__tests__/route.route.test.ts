/**
 * RED-phase tests for GET /api/educator/assignments/[id]/progress
 *
 * The route at src/app/api/educator/assignments/[id]/progress/route.ts does NOT
 * exist yet. All tests must fail until that route is implemented.
 *
 * Mocking strategy:
 *   - @/lib/supabase/server  → avoids Next.js cookies() + Supabase network calls
 *   - @/lib/db/prisma        → avoids real database connection
 *   - @/lib/auth             → avoids real DB role lookup
 *
 * We test the route's real behavior: finding an assignment by id, computing
 * per-student progress from members and sessions, and returning the right shape.
 * Mocks only prevent side effects.
 */

import { GET } from '../route'

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

const mockAssignmentFindUnique = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    assignment: {
      findUnique: (...args: unknown[]) => mockAssignmentFindUnique(...args),
    },
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGETRequest(assignmentId: string): Request {
  return new Request(
    `http://localhost/api/educator/assignments/${assignmentId}/progress`,
    { method: 'GET' }
  )
}

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

const EDUCATOR_USER = {
  id: 'educator-user-1',
  email: 'educator@example.com',
  role: 'EDUCATOR' as const,
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/educator/assignments/[id]/progress
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/educator/assignments/[id]/progress', () => {
  describe('test_GET_perStudentProgressList_returns200WithStatusArray', () => {
    it('returns 200 with per-student progress including completed and not_started statuses', async () => {
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)

      // Assignment with 3 cohort members; 1 student completed, 2 not started
      mockAssignmentFindUnique.mockResolvedValue({
        id: 'assignment-1',
        personaId: 'p1',
        roleMode: 'THERAPIST',
        cohort: {
          members: [
            { userId: 'student-1', user: { id: 'student-1', email: 's1@test.com' } },
            { userId: 'student-2', user: { id: 'student-2', email: 's2@test.com' } },
            { userId: 'student-3', user: { id: 'student-3', email: 's3@test.com' } },
          ],
        },
        sessions: [
          {
            userId: 'student-1',
            endedAt: new Date().toISOString(),
            id: 'session-1',
          },
        ],
      })

      const res = await GET(makeGETRequest('assignment-1'), makeParams('assignment-1'))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(3)

      const completed = body.find(
        (entry: { userId: string; status: string }) => entry.userId === 'student-1'
      )
      const notStarted = body.filter(
        (entry: { userId: string; status: string }) => entry.status === 'not_started'
      )

      expect(completed).toBeDefined()
      expect(completed.status).toBe('completed')
      expect(notStarted).toHaveLength(2)
    })
  })

  describe('test_GET_assignmentNotFound_returns404', () => {
    it('returns 404 when assignment does not exist in the database', async () => {
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)
      mockAssignmentFindUnique.mockResolvedValue(null)

      const res = await GET(
        makeGETRequest('nonexistent-assignment'),
        makeParams('nonexistent-assignment')
      )
      const body = await res.json()

      expect(res.status).toBe(404)
      expect(body.error).toBeDefined()
    })
  })
})
