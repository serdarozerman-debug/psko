/**
 * Route tests for POST /api/educator/cohorts/[id]/regenerate-code
 *
 * Runner: Jest (matched by *.route.test.ts)
 *
 * Mocking strategy:
 *   - @/lib/supabase/server  → fake auth client
 *   - @/lib/db/prisma        → fake PrismaClient
 *   - @/lib/auth             → fake requireEducator
 *   - @/lib/cohorts/joinCode → stub generateJoinCode for deterministic new code
 *
 * RED phase: regenerate-code/route.ts does not exist yet.
 * All tests fail with MODULE_NOT_FOUND until smith-2 creates the file.
 */

// ── Module under test ─────────────────────────────────────────────────────────
import { POST } from '../route'

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

// ── Join code mock ────────────────────────────────────────────────────────────
const mockGenerateJoinCode = jest.fn()

jest.mock('@/lib/cohorts/joinCode', () => ({
  generateJoinCode: () => mockGenerateJoinCode(),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePOSTRequest(cohortId: string): Request {
  return new Request(
    `http://localhost/api/educator/cohorts/${cohortId}/regenerate-code`,
    { method: 'POST' }
  )
}

function makeParams(id: string) {
  return { params: { id } }
}

const EDUCATOR_USER = { id: 'edu-1', role: 'EDUCATOR', email: 'educator@example.com' }

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'edu-1' } } })
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/educator/cohorts/[id]/regenerate-code
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/educator/cohorts/[id]/regenerate-code', () => {
  describe('test_POST_regenerate_code_generates_new_join_code_returns_200_with_new_code', () => {
    it('returns 200 with new joinCode after updating the cohort', async () => {
      // Arrange
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)
      mockCohortFindUnique.mockResolvedValue({
        id: 'c1',
        instructorId: 'edu-1',
        joinCode: 'OLDCOD',
        joinCodeEnabled: true,
      })
      mockGenerateJoinCode.mockReturnValue('NEWCOD')
      mockCohortUpdate.mockResolvedValue({
        id: 'c1',
        name: 'Test Cohort',
        instructorId: 'edu-1',
        joinCode: 'NEWCOD',
        joinCodeEnabled: true,
        createdAt: new Date('2026-05-23T00:00:00Z'),
        updatedAt: new Date('2026-05-23T00:00:00Z'),
      })

      // Act
      const res = await POST(makePOSTRequest('c1'), makeParams('c1'))
      const body = await res.json()

      // Assert
      expect(res.status).toBe(200)
      expect(body.joinCode).toBe('NEWCOD')
      // A new code must have been generated
      expect(mockGenerateJoinCode).toHaveBeenCalledTimes(1)
      // The cohort row must have been updated with the new code
      expect(mockCohortUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c1' },
          data: expect.objectContaining({ joinCode: 'NEWCOD' }),
        })
      )
    })
  })

  describe('test_POST_regenerate_code_returns_403_for_non_educator', () => {
    it('returns 403 when requireEducator throws Forbidden', async () => {
      // Arrange — caller does not have EDUCATOR role
      mockRequireEducator.mockRejectedValue(new Error('Forbidden: EDUCATOR role required'))

      // Act
      const res = await POST(makePOSTRequest('c1'), makeParams('c1'))
      const body = await res.json()

      // Assert
      expect(res.status).toBe(403)
      expect(body.error).toMatch(/forbidden/i)
    })
  })
})
