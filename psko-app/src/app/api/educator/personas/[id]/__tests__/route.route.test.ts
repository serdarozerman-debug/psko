/**
 * RED-phase tests for PUT/DELETE /api/educator/personas/[id]
 *
 * The route at src/app/api/educator/personas/[id]/route.ts does NOT exist yet.
 * All tests in this file must fail until that route is implemented.
 *
 * Mocking strategy:
 *   - @/lib/supabase/server  → avoids Next.js cookies() + Supabase network calls
 *   - @/lib/db/prisma        → avoids real database connection
 *   - @/lib/auth             → avoids real DB role lookup; lets us control auth outcome
 *
 * We are NOT testing mock behavior — each test exercises the route's real
 * ownership check logic, session-reference guard, and response shape.
 * Mocks only prevent network/DB side effects.
 */

import { PUT, DELETE } from '../route'

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

const mockPersonaFindUnique = jest.fn()
const mockPersonaUpdate = jest.fn()
const mockPersonaDelete = jest.fn()
const mockSessionCount = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    persona: {
      create: jest.fn(),
      findUnique: (...args: unknown[]) => mockPersonaFindUnique(...args),
      update: (...args: unknown[]) => mockPersonaUpdate(...args),
      delete: (...args: unknown[]) => mockPersonaDelete(...args),
    },
    session: {
      count: (...args: unknown[]) => mockSessionCount(...args),
    },
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePUTRequest(id: string, body: unknown): Request {
  return new Request(`http://localhost/api/educator/personas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDELETERequest(id: string): Request {
  return new Request(`http://localhost/api/educator/personas/${id}`, {
    method: 'DELETE',
  })
}

const EDUCATOR_USER = {
  id: 'educator-user-1',
  email: 'educator@example.com',
  role: 'EDUCATOR' as const,
}

const OWNED_PERSONA = {
  id: 'persona-1',
  name: 'Custom Patient',
  isCustom: true,
  createdBy: EDUCATOR_USER.id,
  visibility: 'private',
}

const ROUTE_PARAMS = { params: Promise.resolve({ id: 'persona-1' }) }

beforeEach(() => {
  jest.clearAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/educator/personas/[id]
// ═══════════════════════════════════════════════════════════════════════════════

describe('PUT /api/educator/personas/[id]', () => {
  describe('test_PUT_customPersona_ownedByEducator_returns200', () => {
    it('updates custom persona owned by the authenticated educator and returns 200', async () => {
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)
      mockPersonaFindUnique.mockResolvedValue(OWNED_PERSONA)

      const updatedPersona = { ...OWNED_PERSONA, name: 'Updated Patient Name' }
      mockPersonaUpdate.mockResolvedValue(updatedPersona)

      const res = await PUT(
        makePUTRequest('persona-1', { name: 'Updated Patient Name' }),
        ROUTE_PARAMS
      )
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.name).toBe('Updated Patient Name')
    })
  })

  describe('test_PUT_customPersona_notOwnedByEducator_returns403', () => {
    it('returns 403 when persona createdBy a different educator', async () => {
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)

      // Persona belongs to a different educator
      const differentEducatorPersona = {
        ...OWNED_PERSONA,
        createdBy: 'different-educator-id',
      }
      mockPersonaFindUnique.mockResolvedValue(differentEducatorPersona)

      const res = await PUT(
        makePUTRequest('persona-1', { name: 'Attempt Rename' }),
        ROUTE_PARAMS
      )
      const body = await res.json()

      expect(res.status).toBe(403)
      expect(body.error).toBeDefined()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/educator/personas/[id]
// ═══════════════════════════════════════════════════════════════════════════════

describe('DELETE /api/educator/personas/[id]', () => {
  describe('test_DELETE_customPersona_withNoActiveSessions_returns204', () => {
    it('deletes persona and returns 204 when no sessions reference it', async () => {
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)
      mockPersonaFindUnique.mockResolvedValue(OWNED_PERSONA)
      mockSessionCount.mockResolvedValue(0)
      mockPersonaDelete.mockResolvedValue(OWNED_PERSONA)

      const res = await DELETE(
        makeDELETERequest('persona-1'),
        ROUTE_PARAMS
      )

      expect(res.status).toBe(204)
    })
  })

  describe('test_DELETE_customPersona_withActiveSessions_returns409', () => {
    it('returns 409 Conflict when active sessions reference the persona', async () => {
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)
      mockPersonaFindUnique.mockResolvedValue(OWNED_PERSONA)

      // Two sessions currently reference this persona
      mockSessionCount.mockResolvedValue(2)

      const res = await DELETE(
        makeDELETERequest('persona-1'),
        ROUTE_PARAMS
      )
      const body = await res.json()

      expect(res.status).toBe(409)
      expect(body.error).toBeDefined()
    })
  })
})
