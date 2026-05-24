/**
 * Route tests for POST /api/join/[code]
 *
 * Runner: Jest (matched by *.route.test.ts)
 *
 * Mocking strategy:
 *   - @/lib/supabase/server  → fake auth client (student auth)
 *   - @/lib/db/prisma        → fake PrismaClient (cohort lookup + membership upsert)
 *   - @/lib/auth             → fake requireUser (student must be authenticated)
 *
 * RED phase: join/[code]/route.ts does not exist yet.
 * All tests fail with MODULE_NOT_FOUND until smith-2 creates the file.
 *
 * Behavior spec (FR-2.4, FR-2.5):
 *   - Valid active code  → upsert ACTIVE membership → 200
 *   - Disabled code      → 410 Gone
 *   - Unknown code       → 404 Not Found
 *   - Duplicate join     → 200 idempotently (upsert semantics)
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
const mockCohortFindFirst = jest.fn()
const mockMembershipUpsert = jest.fn()
const mockMembershipFindUnique = jest.fn()
const mockUserFindUnique = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    cohort: {
      findFirst: (...args: unknown[]) => mockCohortFindFirst(...args),
    },
    cohortMembership: {
      upsert: (...args: unknown[]) => mockMembershipUpsert(...args),
      findUnique: (...args: unknown[]) => mockMembershipFindUnique(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}))

// ── Auth mock ─────────────────────────────────────────────────────────────────
const mockRequireUser = jest.fn()

jest.mock('@/lib/auth', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextResponse } = require('next/server')
  return {
    requireUser: (...args: unknown[]) => mockRequireUser(...args),
    mapAuthError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      if (/forbidden/i.test(msg)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      if (/unauthenticated/i.test(msg)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return null
    },
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePOSTRequest(code: string): Request {
  return new Request(`http://localhost/api/join/${code}`, { method: 'POST' })
}

function makeParams(code: string) {
  return { params: { code } }
}

const STUDENT_USER = { id: 'student-1', role: 'STUDENT', email: 'student@example.com' }

const ACTIVE_COHORT = {
  id: 'c1',
  name: 'Test Cohort',
  instructorId: 'edu-1',
  joinCode: 'VALID1',
  joinCodeEnabled: true,
}

const DISABLED_COHORT = {
  ...ACTIVE_COHORT,
  joinCode: 'DISABL',
  joinCodeEnabled: false,
}

const ACTIVE_MEMBERSHIP = {
  id: 'm1',
  cohortId: 'c1',
  studentId: 'student-1',
  status: 'ACTIVE',
  joinedAt: new Date('2026-05-23T00:00:00Z'),
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'student-1' } } })
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/join/[code]
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/join/[code]', () => {
  describe('test_POST_join_valid_active_code_creates_ACTIVE_membership', () => {
    it('returns 200 with membership when code is valid and joinCodeEnabled is true', async () => {
      // Arrange — cohort found, join code active
      mockRequireUser.mockResolvedValue(STUDENT_USER)
      mockCohortFindFirst.mockResolvedValue(ACTIVE_COHORT)
      mockMembershipUpsert.mockResolvedValue(ACTIVE_MEMBERSHIP)

      // Act
      const res = await POST(makePOSTRequest('VALID1'), makeParams('VALID1'))
      const body = await res.json()

      // Assert
      expect(res.status).toBe(200)
      expect(body.status).toBe('ACTIVE')
      // Upsert must have been called, confirming a membership was created/confirmed
      expect(mockMembershipUpsert).toHaveBeenCalledTimes(1)
    })
  })

  describe('test_POST_join_disabled_code_returns_410_Gone', () => {
    it('returns 410 when cohort joinCodeEnabled is false', async () => {
      // Arrange — cohort exists but join code is disabled
      mockRequireUser.mockResolvedValue(STUDENT_USER)
      mockCohortFindFirst.mockResolvedValue(DISABLED_COHORT)

      // Act
      const res = await POST(makePOSTRequest('DISABL'), makeParams('DISABL'))
      const body = await res.json()

      // Assert
      expect(res.status).toBe(410)
      expect(body.error).toBeDefined()
      // Membership upsert must NOT have been called for a disabled code
      expect(mockMembershipUpsert).not.toHaveBeenCalled()
    })
  })

  describe('test_POST_join_invalid_code_returns_404', () => {
    it('returns 404 when no cohort matches the provided code', async () => {
      // Arrange — findFirst returns null (no cohort with this code)
      mockRequireUser.mockResolvedValue(STUDENT_USER)
      mockCohortFindFirst.mockResolvedValue(null)

      // Act
      const res = await POST(makePOSTRequest('BOGUS1'), makeParams('BOGUS1'))
      const body = await res.json()

      // Assert
      expect(res.status).toBe(404)
      expect(body.error).toMatch(/not found/i)
      // Membership upsert must NOT have been called for an unknown code
      expect(mockMembershipUpsert).not.toHaveBeenCalled()
    })
  })

  describe('test_POST_join_duplicate_membership_returns_200_idempotently', () => {
    it('returns 200 even when student is already a member (upsert is idempotent)', async () => {
      // Arrange — cohort active, student already has membership (upsert returns existing row)
      mockRequireUser.mockResolvedValue(STUDENT_USER)
      mockCohortFindFirst.mockResolvedValue(ACTIVE_COHORT)
      // Upsert returns the existing ACTIVE membership unchanged
      mockMembershipUpsert.mockResolvedValue(ACTIVE_MEMBERSHIP)

      // Act
      const res = await POST(makePOSTRequest('VALID1'), makeParams('VALID1'))
      const body = await res.json()

      // Assert
      expect(res.status).toBe(200)
      expect(body.status).toBe('ACTIVE')
      // A single upsert call handles both create and update paths
      expect(mockMembershipUpsert).toHaveBeenCalledTimes(1)
    })
  })
})
