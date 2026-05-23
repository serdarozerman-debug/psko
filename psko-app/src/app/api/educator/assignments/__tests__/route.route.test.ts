/**
 * RED-phase tests for POST/GET /api/educator/assignments
 *
 * The route at src/app/api/educator/assignments/route.ts does NOT exist yet.
 * All tests in this file must fail until that route is implemented.
 *
 * Mocking strategy:
 *   - @/lib/supabase/server  → avoids Next.js cookies() + Supabase network calls
 *   - @/lib/db/prisma        → avoids real database connection
 *   - @/lib/auth             → avoids real DB role lookup; lets us control auth outcome
 *
 * We are NOT testing mock behavior — each test exercises the route's real
 * validation logic, authorization gate, and response shape. Mocks only prevent
 * network/DB side effects.
 */

import { POST, GET } from '../route'

// ── Auth mock ─────────────────────────────────────────────────────────────────

const mockRequireEducator = jest.fn()

jest.mock('@/lib/auth', () => ({
  requireEducator: (...args: unknown[]) => mockRequireEducator(...args),
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

const mockAssignmentCreate = jest.fn()
const mockAssignmentFindMany = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    assignment: {
      create: (...args: unknown[]) => mockAssignmentCreate(...args),
      findMany: (...args: unknown[]) => mockAssignmentFindMany(...args),
    },
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePOSTRequest(body: unknown): Request {
  return new Request('http://localhost/api/educator/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGETRequest(): Request {
  return new Request('http://localhost/api/educator/assignments', {
    method: 'GET',
  })
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
// POST /api/educator/assignments
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/educator/assignments', () => {
  describe('test_POST_createAssignment_withAllRequiredFields_returns201', () => {
    it('creates assignment with all required fields and returns 201', async () => {
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)

      const createdAssignment = {
        id: 'assignment-1',
        cohortId: 'c1',
        personaId: 'p1',
        roleMode: 'THERAPIST',
        createdAt: new Date().toISOString(),
        educatorId: EDUCATOR_USER.id,
      }
      mockAssignmentCreate.mockResolvedValue(createdAssignment)

      const res = await POST(
        makePOSTRequest({ cohortId: 'c1', personaId: 'p1', roleMode: 'THERAPIST' })
      )
      const body = await res.json()

      expect(res.status).toBe(201)
      expect(body.id).toBe('assignment-1')
      expect(body.cohortId).toBe('c1')
      expect(body.personaId).toBe('p1')
    })
  })

  describe('test_POST_studentRole_returns403', () => {
    it('returns 403 when requireEducator throws Forbidden error', async () => {
      mockRequireEducator.mockRejectedValue(
        new Error('Forbidden: EDUCATOR role required')
      )

      const res = await POST(
        makePOSTRequest({ cohortId: 'c1', personaId: 'p1', roleMode: 'THERAPIST' })
      )
      const body = await res.json()

      expect(res.status).toBe(403)
      expect(body.error).toBeDefined()
    })
  })

  describe('test_POST_missingCohortId_returns400', () => {
    it('returns 400 when cohortId is missing from the request body', async () => {
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)

      const res = await POST(
        makePOSTRequest({ personaId: 'p1' })
      )
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toBeDefined()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/educator/assignments
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/educator/assignments', () => {
  describe('test_GET_assignmentsForEducatorCohorts_returns200WithArray', () => {
    it("returns 200 with array of assignments for the educator's cohorts", async () => {
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)

      const assignments = [
        {
          id: 'assignment-1',
          cohortId: 'c1',
          personaId: 'p1',
          roleMode: 'THERAPIST',
          educatorId: EDUCATOR_USER.id,
        },
        {
          id: 'assignment-2',
          cohortId: 'c1',
          personaId: 'p2',
          roleMode: 'CLIENT',
          educatorId: EDUCATOR_USER.id,
        },
      ]
      mockAssignmentFindMany.mockResolvedValue(assignments)

      const res = await GET(makeGETRequest())
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(2)
      expect(body[0].cohortId).toBe('c1')
    })
  })
})
