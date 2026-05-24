/**
 * Route tests for GET + PATCH /api/educator/cohorts/[id]
 *
 * Runner: Jest (matched by *.route.test.ts)
 *
 * Mocking strategy:
 *   - @/lib/supabase/server  → fake auth client
 *   - @/lib/db/prisma        → fake PrismaClient
 *   - @/lib/auth             → fake requireEducator
 *
 * RED phase: [id]/route.ts does not exist yet.
 * All tests fail with MODULE_NOT_FOUND until smith-2 creates the file.
 */

// ── Module under test ─────────────────────────────────────────────────────────
import { GET, PATCH } from '../route'

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
const mockCohortFindUnique = jest.fn()
const mockCohortUpdate = jest.fn()
const mockUserFindUnique = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    cohort: {
      findUnique: (...args: unknown[]) => mockCohortFindUnique(...args),
      update: (...args: unknown[]) => mockCohortUpdate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGETRequest(cohortId: string): Request {
  return new Request(`http://localhost/api/educator/cohorts/${cohortId}`, {
    method: 'GET',
  })
}

function makePATCHRequest(cohortId: string, body: unknown): Request {
  return new Request(`http://localhost/api/educator/cohorts/${cohortId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Next.js dynamic route params shape
function makeParams(id: string) {
  return { params: { id } }
}

const EDUCATOR_USER = { id: 'edu-1', role: 'EDUCATOR', email: 'educator@example.com' }

const COHORT_WITH_MEMBERS = {
  id: 'c1',
  name: 'Test Cohort',
  instructorId: 'edu-1',
  joinCode: 'XYZ789',
  joinCodeEnabled: true,
  createdAt: new Date('2026-05-23T00:00:00Z'),
  updatedAt: new Date('2026-05-23T00:00:00Z'),
  memberships: [
    {
      id: 'm1',
      studentId: 's1',
      status: 'ACTIVE',
      joinedAt: new Date('2026-05-23T00:00:00Z'),
      student: { id: 's1', email: 'student1@example.com' },
    },
    {
      id: 'm2',
      studentId: 's2',
      status: 'ACTIVE',
      joinedAt: new Date('2026-05-23T00:00:00Z'),
      student: { id: 's2', email: 'student2@example.com' },
    },
  ],
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'edu-1' } } })
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/educator/cohorts/[id]
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/educator/cohorts/[id]', () => {
  describe('test_GET_cohort_returns_404_if_not_found_or_not_owned_by_educator', () => {
    it('returns 404 when cohort does not exist', async () => {
      // Arrange — cohort not found in DB (could be wrong id or wrong educator)
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)
      mockCohortFindUnique.mockResolvedValue(null)

      // Act
      const res = await GET(makeGETRequest('nonexistent'), makeParams('nonexistent'))
      const body = await res.json()

      // Assert
      expect(res.status).toBe(404)
      expect(body.error).toMatch(/not found/i)
    })

    it('returns 404 when cohort exists but belongs to a different educator', async () => {
      // Arrange — cohort.instructorId does not match authenticated educator
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)
      // findUnique returns null for queries that include the ownership filter
      mockCohortFindUnique.mockResolvedValue(null)

      // Act
      const res = await GET(makeGETRequest('c-other'), makeParams('c-other'))
      await res.json()

      // Assert
      expect(res.status).toBe(404)
    })
  })

  describe('test_GET_cohort_returns_cohort_with_memberships', () => {
    it('returns 200 with cohort data including members array', async () => {
      // Arrange
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)
      mockCohortFindUnique.mockResolvedValue(COHORT_WITH_MEMBERS)

      // Act
      const res = await GET(makeGETRequest('c1'), makeParams('c1'))
      const body = await res.json()

      // Assert
      expect(res.status).toBe(200)
      expect(body.id).toBe('c1')
      expect(body.name).toBe('Test Cohort')
      expect(Array.isArray(body.memberships)).toBe(true)
      expect(body.memberships).toHaveLength(2)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/educator/cohorts/[id]
// ═══════════════════════════════════════════════════════════════════════════════

describe('PATCH /api/educator/cohorts/[id]', () => {
  describe('test_PATCH_cohort_toggles_joinCodeEnabled', () => {
    it('returns 200 with updated cohort after toggling joinCodeEnabled to false', async () => {
      // Arrange
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)
      // Ownership check passes — cohort found
      mockCohortFindUnique.mockResolvedValue({
        id: 'c1',
        instructorId: 'edu-1',
        joinCodeEnabled: true,
      })
      mockCohortUpdate.mockResolvedValue({
        id: 'c1',
        name: 'Test Cohort',
        instructorId: 'edu-1',
        joinCode: 'XYZ789',
        joinCodeEnabled: false,
        createdAt: new Date('2026-05-23T00:00:00Z'),
        updatedAt: new Date('2026-05-23T00:00:00Z'),
      })

      // Act
      const res = await PATCH(makePATCHRequest('c1', { joinCodeEnabled: false }), makeParams('c1'))
      const body = await res.json()

      // Assert
      expect(res.status).toBe(200)
      expect(body.joinCodeEnabled).toBe(false)
      expect(mockCohortUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c1' },
          data: expect.objectContaining({ joinCodeEnabled: false }),
        })
      )
    })
  })
})
