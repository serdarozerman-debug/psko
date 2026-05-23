/**
 * RED-phase tests for POST /api/educator/personas
 *
 * The route at src/app/api/educator/personas/route.ts does NOT exist yet.
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

import { POST } from '../route'

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

const mockPersonaCreate = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    persona: {
      create: (...args: unknown[]) => mockPersonaCreate(...args),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    session: {
      count: jest.fn(),
    },
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePOSTRequest(body: unknown): Request {
  return new Request('http://localhost/api/educator/personas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const EDUCATOR_USER = {
  id: 'educator-user-1',
  email: 'educator@example.com',
  role: 'EDUCATOR' as const,
}

/** Minimal valid PersonaData body that satisfies PersonaDataSchema. */
const VALID_PERSONA_BODY = {
  id: 'custom-1',
  name: 'Test Patient',
  age: 32,
  presentingProblem: 'Presenting with severe anxiety and panic attacks.',
  backstory: 'Has experienced chronic workplace stress for three years.',
  difficultyLevel: 'intermediate',
  conversationalStyle: 'reserved',
  recommendedApproaches: ['cbt'],
  cognitiveModel: {
    coreBeliefs: ['I am not good enough'],
    intermediateBeliefs: ['If I fail once, I am a failure'],
    automaticThoughts: ['Nobody cares what I think'],
    emotionalState: { primary: 'anxiety', intensity: 3 },
    triggers: ['performance evaluations'],
    defenses: ['intellectualization'],
    values: ['achievement'],
  },
  disorderProfile: ['Generalized Anxiety Disorder'],
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/educator/personas
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/educator/personas', () => {
  describe('test_POST_customPersona_withValidBody_returns201WithIsCustomTrue', () => {
    it('creates custom persona with isCustom=true and returns 201', async () => {
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)

      const createdPersona = {
        id: 'p1',
        ...VALID_PERSONA_BODY,
        isCustom: true,
        createdBy: EDUCATOR_USER.id,
        visibility: 'private',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockPersonaCreate.mockResolvedValue(createdPersona)

      const res = await POST(makePOSTRequest(VALID_PERSONA_BODY))
      const body = await res.json()

      expect(res.status).toBe(201)
      expect(body.isCustom).toBe(true)
      expect(body.createdBy).toBe(EDUCATOR_USER.id)
    })
  })

  describe('test_POST_customPersona_withMissingRequiredFields_returns400WithValidationErrors', () => {
    it('returns 400 with validation errors for invalid Zod schema', async () => {
      mockRequireEducator.mockResolvedValue(EDUCATOR_USER)

      // Missing all required fields except name — does not satisfy PersonaDataSchema
      const res = await POST(makePOSTRequest({ name: 'X' }))
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toBeDefined()
    })
  })

  describe('test_POST_customPersona_asStudent_returns403', () => {
    it('returns 403 when requireEducator throws Forbidden error', async () => {
      mockRequireEducator.mockRejectedValue(
        new Error('Forbidden: EDUCATOR role required')
      )

      const res = await POST(makePOSTRequest(VALID_PERSONA_BODY))
      const body = await res.json()

      expect(res.status).toBe(403)
      expect(body.error).toBeDefined()
    })
  })
})
