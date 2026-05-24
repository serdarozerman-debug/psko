/**
 * RED-phase tests for GET /api/personas (merged library + DB personas)
 *
 * The existing route at src/app/api/personas/route.ts ONLY serves library
 * personas — it does not merge DB custom personas. These tests define the
 * expected merged behavior, so they must fail against the current implementation.
 *
 * Mocking strategy:
 *   - @/lib/personas         → controls library persona list without filesystem I/O
 *   - @/lib/supabase/server  → avoids Next.js cookies() + Supabase network calls
 *   - @/lib/db/prisma        → avoids real database connection
 *
 * We are NOT testing mock behavior — each test exercises the route's real
 * merge logic, role-based filtering, and response shape. Mocks only prevent
 * filesystem/network/DB side effects.
 */

import { GET } from '../route'

// ── Personas library mock ─────────────────────────────────────────────────────

jest.mock('@/lib/personas', () => ({
  personaLibrary: [
    { id: 'lib-1', isCustom: false },
    { id: 'lib-2', isCustom: false },
  ],
  getPersonaLibrary: jest.fn().mockReturnValue([
    { id: 'lib-1', isCustom: false },
    { id: 'lib-2', isCustom: false },
  ]),
}))

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

const mockPersonaFindMany = jest.fn()
const mockCohortMembershipFindMany = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    persona: {
      findMany: (...args: unknown[]) => mockPersonaFindMany(...args),
    },
    cohortMembership: {
      findMany: (...args: unknown[]) => mockCohortMembershipFindMany(...args),
    },
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGETRequest(): Request {
  return new Request('http://localhost/api/personas', { method: 'GET' })
}

function authenticatedUser(id: string, role = 'STUDENT') {
  return {
    data: {
      user: {
        id,
        email: `${role.toLowerCase()}@example.com`,
        app_metadata: { role },
      },
    },
  }
}

const CUSTOM_PERSONA = {
  id: 'custom-1',
  name: 'Custom Patient',
  isCustom: true,
  createdBy: 'educator-1',
  visibility: 'private',
}

const CUSTOM_PERSONA_ASSIGNED = {
  id: 'custom-assigned-1',
  name: 'Assigned Custom Patient',
  isCustom: true,
  createdBy: 'educator-1',
  visibility: 'private',
}

const CUSTOM_PERSONA_UNASSIGNED = {
  id: 'custom-unassigned-1',
  name: 'Unassigned Custom Patient',
  isCustom: true,
  createdBy: 'educator-1',
  visibility: 'private',
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/personas — EDUCATOR role
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/personas as EDUCATOR', () => {
  describe('test_GET_personasAsEducator_returnsLibraryPlusCustomPersonas', () => {
    it('returns combined array of library personas and own custom personas', async () => {
      mockGetUser.mockResolvedValue(authenticatedUser('educator-1', 'EDUCATOR'))

      // Educator owns one custom persona in the DB
      mockPersonaFindMany.mockResolvedValue([CUSTOM_PERSONA])

      const res = await GET(makeGETRequest())
      const body = await res.json()

      // 2 library + 1 custom = 3 total
      const personas = body.personas ?? body
      expect(res.status).toBe(200)
      expect(Array.isArray(personas)).toBe(true)
      expect(personas).toHaveLength(3)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/personas — STUDENT role
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/personas as STUDENT', () => {
  describe('test_GET_personasAsStudent_returnsLibraryPlusAssignedCustomsOnly', () => {
    it('includes assigned custom personas but excludes unassigned custom personas', async () => {
      mockGetUser.mockResolvedValue(authenticatedUser('student-1', 'STUDENT'))

      // Student is in cohort-1 which has one assignment referencing CUSTOM_PERSONA_ASSIGNED
      mockCohortMembershipFindMany.mockResolvedValue([
        { cohortId: 'cohort-1', studentId: 'student-1' },
      ])

      // DB returns custom persona that is assigned to student's cohort
      mockPersonaFindMany.mockResolvedValue([CUSTOM_PERSONA_ASSIGNED])

      const res = await GET(makeGETRequest())
      const body = await res.json()

      const personas = body.personas ?? body
      expect(res.status).toBe(200)
      expect(Array.isArray(personas)).toBe(true)

      const ids = personas.map((p: { id: string }) => p.id)
      // Assigned custom persona must be present
      expect(ids).toContain(CUSTOM_PERSONA_ASSIGNED.id)
      // Unassigned custom persona must NOT be present
      expect(ids).not.toContain(CUSTOM_PERSONA_UNASSIGNED.id)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/personas — library personas always visible
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/personas — library visibility', () => {
  describe('test_GET_libraryPersonas_alwaysVisibleToAllAuthenticatedUsers', () => {
    it('always includes all library personas regardless of role', async () => {
      mockGetUser.mockResolvedValue(authenticatedUser('student-no-cohort', 'STUDENT'))

      // Student has no cohort memberships
      mockCohortMembershipFindMany.mockResolvedValue([])
      // No custom personas accessible
      mockPersonaFindMany.mockResolvedValue([])

      const res = await GET(makeGETRequest())
      const body = await res.json()

      const personas = body.personas ?? body
      expect(res.status).toBe(200)
      expect(Array.isArray(personas)).toBe(true)

      const ids = personas.map((p: { id: string }) => p.id)
      // Both library personas must always be included
      expect(ids).toContain('lib-1')
      expect(ids).toContain('lib-2')
    })
  })
})
