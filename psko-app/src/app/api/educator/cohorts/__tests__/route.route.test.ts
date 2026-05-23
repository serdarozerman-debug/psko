/**
 * Route tests for GET + POST /api/educator/cohorts
 *
 * Runner: Jest (matched by *.route.test.ts)
 *
 * Mocking strategy:
 *   - @/lib/supabase/server  → fake auth client (avoids Next.js cookies() + Supabase network)
 *   - @/lib/db/prisma        → fake PrismaClient (avoids database connection)
 *   - @/lib/auth             → fake requireEducator (controls educator vs non-educator scenarios)
 *   - @/lib/cohorts/joinCode → stub generateJoinCode for predictable codes in assertions
 *
 * RED phase: route.ts does not exist yet.
 * All tests will fail with MODULE_NOT_FOUND until smith-2 creates the file.
 */

// ── Module under test ─────────────────────────────────────────────────────────
import { GET, POST } from '../route'

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
const mockCohortCreate = jest.fn()
const mockCohortFindMany = jest.fn()
const mockUserFindUnique = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    cohort: {
      create: (...args: unknown[]) => mockCohortCreate(...args),
      findMany: (...args: unknown[]) => mockCohortFindMany(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}))

// ── Auth mock ─────────────────────────────────────────────────────────────────
const mockRequireEducator = jest.fn()

jest.mock('@/lib/auth', () => ({
  requireEducator: (...args: unknown[]) => mockRequireEducator(...args),
}))

// ── Join code mock ────────────────────────────────────────────────────────────
const mockGenerateJoinCode = jest.fn()

jest.mock('@/lib/cohorts/joinCode', () => ({
  generateJoinCode: () => mockGenerateJoinCode(),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(
  method: 'GET' | 'POST',
  body?: unknown,
): Request {
  const url = 'http://localhost/api/educator/cohorts'
  if (method === 'GET') {
    return new Request(url, { method: 'GET' })
  }
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const EDUCATOR_USER = { id: 'edu-1', role: 'EDUCATOR', email: 'educator@example.com' }

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'edu-1' } } })
  mockGenerateJoinCode.mockReturnValue('ABC123')
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/educator/cohorts
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/educator/cohorts', () => {
  describe('test_POST_cohorts_returns_403_when_user_is_STUDENT_role', () => {
    it('returns 403 when requireEducator throws Forbidden', async () => {
      // Arrange — requireEducator rejects non-educators with a Forbidden error
      mockRequireEducator.mockRejectedValue(new Error('Forbidden: EDUCATOR role required'))

      // Act
      const res = await POST(makeRequest('POST', { name: 'Test Cohort' }))
      const body = await res.json()

      // Assert
      expect(res.status).toBe(403)
      expect(body.error).toMatch(/forbidden/i)
    })
  })

  describe('test_POST_cohorts_creates_cohort_with_auto_generated_join_code', () => {
    it('returns 201 with cohort including auto-generated joinCode', async () => {
      // Arrange
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)
      mockCohortCreate.mockResolvedValue({
        id: 'c1',
        name: 'Test Cohort',
        instructorId: 'edu-1',
        joinCode: 'ABC123',
        joinCodeEnabled: true,
        createdAt: new Date('2026-05-23T00:00:00Z'),
        updatedAt: new Date('2026-05-23T00:00:00Z'),
      })

      // Act
      const res = await POST(makeRequest('POST', { name: 'Test Cohort' }))
      const body = await res.json()

      // Assert
      expect(res.status).toBe(201)
      expect(body.joinCode).toBe('ABC123')
      expect(body.name).toBe('Test Cohort')
      // generateJoinCode must have been called to produce the join code
      expect(mockGenerateJoinCode).toHaveBeenCalledTimes(1)
      // prisma.cohort.create must have received the generated code
      expect(mockCohortCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ joinCode: 'ABC123' }),
        })
      )
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/educator/cohorts
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/educator/cohorts', () => {
  describe('test_GET_cohorts_returns_only_cohorts_owned_by_educator', () => {
    it('returns 200 with array of cohorts belonging to the authenticated educator', async () => {
      // Arrange
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)
      mockCohortFindMany.mockResolvedValue([
        { id: 'c1', name: 'Cohort A', instructorId: 'edu-1', joinCode: 'AAA111', joinCodeEnabled: true },
        { id: 'c2', name: 'Cohort B', instructorId: 'edu-1', joinCode: 'BBB222', joinCodeEnabled: false },
      ])

      // Act
      const res = await GET(makeRequest('GET'))
      const body = await res.json()

      // Assert
      expect(res.status).toBe(200)
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(2)
      // Query must scope to the educator's own cohorts
      expect(mockCohortFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ instructorId: 'edu-1' }),
        })
      )
    })
  })
})
