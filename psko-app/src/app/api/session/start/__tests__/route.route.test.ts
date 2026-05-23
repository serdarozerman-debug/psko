/**
 * Regression tests for POST /api/session/start
 *
 * This file guards against regressions introduced when getPersonaById is
 * refactored from synchronous to async. The route currently calls getPersonaById
 * synchronously; after refactoring it must await the call.
 *
 * These tests are regression tests:
 *   1. Write test → Run (current behavior: PASS for test 1 if mock resolves, but
 *      the route uses the sync version so test 1 may already pass).
 *   2. The tests become truly meaningful once the route is updated to `await
 *      getPersonaById(...)`. Use Red-Green Verification: revert the await change
 *      and confirm the tests still fail.
 *
 * Mocking strategy:
 *   - @/lib/personas          → mockResolvedValue confirms route awaits the call
 *   - @/lib/supabase/server   → avoids real Supabase auth
 *   - @/lib/db/prisma         → avoids real DB
 *   - @/lib/claude/patient-agent → avoids real Claude API call
 *   - @/lib/clinical/intake/formulation → avoids real Claude API call
 *
 * We test the route's real behavior (auth, persona lookup, session creation,
 * 404 on missing persona). Mocks isolate external I/O only.
 */

import { POST } from '../route'

// ── Personas mock ─────────────────────────────────────────────────────────────

const mockGetPersonaById = jest.fn()

jest.mock('@/lib/personas', () => ({
  getPersonaById: (...args: unknown[]) => mockGetPersonaById(...args),
  personaLibrary: [],
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

const mockUserUpsert = jest.fn()
const mockSessionCreate = jest.fn()
const mockMessageCreate = jest.fn()
const mockIntakeResponseCreate = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      upsert: (...args: unknown[]) => mockUserUpsert(...args),
    },
    session: {
      create: (...args: unknown[]) => mockSessionCreate(...args),
    },
    message: {
      create: (...args: unknown[]) => mockMessageCreate(...args),
    },
    intakeResponse: {
      create: (...args: unknown[]) => mockIntakeResponseCreate(...args),
    },
  },
}))

// ── Claude / clinical mocks ───────────────────────────────────────────────────

jest.mock('@/lib/claude/patient-agent', () => ({
  getOpeningStatement: jest.fn().mockResolvedValue('Hello, I am the patient.'),
}))

jest.mock('@/lib/clinical/intake/formulation', () => ({
  buildCaseFormulation: jest.fn().mockResolvedValue(null),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePOSTRequest(body: unknown): Request {
  return new Request('http://localhost/api/session/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function authenticatedUser() {
  return {
    data: {
      user: {
        id: 'user-abc',
        email: 'student@test.com',
      },
    },
  }
}

const VALID_PERSONA = {
  id: 'p1',
  name: 'Test Persona',
  age: 30,
  presentingProblem: 'Test problem',
  backstory: 'Test backstory',
  difficultyLevel: 'beginner' as const,
  conversationalStyle: 'verbose' as const,
  recommendedApproaches: ['cbt'] as const,
  disorderProfile: ['Test Disorder'],
  cognitiveModel: {
    coreBeliefs: [],
    intermediateBeliefs: [],
    automaticThoughts: [],
    emotionalState: { primary: 'anxious', intensity: 3, secondary: 'sad' },
    triggers: [],
    defenses: [],
    values: [],
    scid5: {
      onsetAge: 28,
      durationMonths: 6,
      functionalImpairment: { social: 3, occupational: 3, other: 2 },
      priorTreatment: false,
      traumaFlags: [],
    },
  },
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUserUpsert.mockResolvedValue({})
  mockIntakeResponseCreate.mockResolvedValue({})
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/session/start — async persona lookup regression
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/session/start — async getPersonaById regression', () => {
  describe('test_POST_validPersonaId_startsSessionSuccessfully_asyncPersonaLookup', () => {
    it('starts session successfully when getPersonaById resolves (async persona lookup)', async () => {
      mockGetUser.mockResolvedValue(authenticatedUser())

      // mockResolvedValue verifies the route correctly awaits the async call
      mockGetPersonaById.mockResolvedValue(VALID_PERSONA)

      const SESSION_ID = 'session-xyz'
      const MESSAGE = {
        id: 'msg-1',
        sessionId: SESSION_ID,
        role: 'patient',
        content: 'Hello, I am the patient.',
      }
      mockSessionCreate.mockResolvedValue({ id: SESSION_ID })
      mockMessageCreate.mockResolvedValue(MESSAGE)

      const res = await POST(
        makePOSTRequest({
          personaId: 'p1',
          therapeuticApproach: 'cbt',
          roleMode: 'THERAPIST',
        })
      )
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.sessionId).toBe(SESSION_ID)
      expect(body.openingMessage).toBeDefined()
    })
  })

  describe('test_POST_unknownPersonaId_returns404', () => {
    it('returns 404 when getPersonaById resolves to undefined for unknown personaId', async () => {
      mockGetUser.mockResolvedValue(authenticatedUser())

      // Route must await getPersonaById and check for undefined
      mockGetPersonaById.mockResolvedValue(undefined)

      const res = await POST(
        makePOSTRequest({
          personaId: 'unknown-persona',
          therapeuticApproach: 'cbt',
          roleMode: 'THERAPIST',
        })
      )
      const body = await res.json()

      expect(res.status).toBe(404)
      expect(body.error).toMatch(/persona/i)
    })
  })
})
