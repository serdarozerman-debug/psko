/**
 * API route tests for POST /api/session/end — score persistence extension.
 *
 * Tests run with Jest (*.route.test.ts).
 *
 * RED phase rationale:
 *   The route EXISTS at src/app/api/session/end/route.ts but it does NOT yet:
 *     - call sessionFeedbackScore.createMany
 *     - persist overallScore on the session row
 *   All three new tests below FAIL in RED because the production code lacks
 *   those behaviours. The `sessionFeedbackScore` mock namespace also does not
 *   appear in the existing code path, so createMany is never called.
 *
 * Mocking strategy:
 *   - @/lib/supabase/server  → fake auth (avoids Next.js cookies() + Supabase network)
 *   - @/lib/db/prisma        → fake PrismaClient (avoids DB connection)
 *   - @/lib/personas         → stub getPersonaById (avoids FS read in tests)
 *   - @/lib/claude/supervisor-agent → stub generateFeedback (avoids Claude API call)
 *
 * Only the new score-persistence behaviours are tested here.
 * Existing session-end logic (auth, 404, already-ended) is exercised by
 * manual testing; these tests focus only on what enforcer-4 must gate.
 */

import { POST } from '../route'

// ── Supabase mock ─────────────────────────────────────────────────────────────

const mockGetUser = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    }),
  ),
}))

// ── Prisma mock ───────────────────────────────────────────────────────────────
// sessionFeedbackScore.createMany is explicitly mocked to detect calls.
// The route does NOT currently call it → tests are RED.

const mockSessionFindFirst = jest.fn()
const mockSessionUpdate = jest.fn()
const mockSessionFeedbackScoreCreateMany = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    session: {
      findFirst: (...args: unknown[]) => mockSessionFindFirst(...args),
      update: (...args: unknown[]) => mockSessionUpdate(...args),
    },
    sessionFeedbackScore: {
      createMany: (...args: unknown[]) => mockSessionFeedbackScoreCreateMany(...args),
    },
  },
}))

// ── Persona mock ──────────────────────────────────────────────────────────────

jest.mock('@/lib/personas', () => ({
  getPersonaById: jest.fn(() => ({
    id: 'persona-1',
    name: 'Test Persona',
    age: 30,
    presentingProblem: 'Anxiety',
    backstory: 'Some backstory',
    difficultyLevel: 'beginner',
    conversationalStyle: 'reserved',
    recommendedApproaches: ['cbt'],
    cognitiveModel: {},
    disorderProfile: [],
  })),
}))

// ── Claude supervisor mock ────────────────────────────────────────────────────
// Returns a feedback blob that includes competency_scores.

const MOCK_FEEDBACK_WITH_SCORES = {
  overall_score: 4,
  summary: 'Good session.',
  competency_scores: [
    { domain: 'Agenda Setting', score: 4 },
    { domain: 'Feedback', score: 5 },
    { domain: 'Collaborative Empiricism', score: 3 },
  ],
}

const mockGenerateFeedback = jest.fn()

jest.mock('@/lib/claude/supervisor-agent', () => ({
  generateFeedback: (...args: unknown[]) => mockGenerateFeedback(...args),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePOSTRequest(body: unknown): Request {
  return new Request('http://localhost/api/session/end', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function authenticatedUser() {
  return { data: { user: { id: 'user-abc' } } }
}

const BASE_SESSION = {
  id: 'sess-test',
  userId: 'user-abc',
  personaId: 'persona-1',
  therapeuticApproach: 'cbt',
  roleMode: 'THERAPIST',
  endedAt: null,
  messages: [
    {
      id: 'msg-1',
      sessionId: 'sess-test',
      role: 'student',
      content: 'Hello',
      createdAt: new Date(),
    },
  ],
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()

  mockGetUser.mockResolvedValue(authenticatedUser())
  mockSessionFindFirst.mockResolvedValue({ ...BASE_SESSION })
  mockSessionUpdate.mockResolvedValue({
    ...BASE_SESSION,
    endedAt: new Date(),
    feedback: MOCK_FEEDBACK_WITH_SCORES,
    overallScore: 4,
  })
  mockGenerateFeedback.mockResolvedValue(MOCK_FEEDBACK_WITH_SCORES)
  mockSessionFeedbackScoreCreateMany.mockResolvedValue({ count: 3 })
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/session/end — score persistence
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST session end — persists competency scores to SessionFeedbackScore table', () => {
  /**
   * RED: route does not call sessionFeedbackScore.createMany today.
   * After smith-4 implements it, this test turns GREEN.
   */
  it('calls sessionFeedbackScore.createMany with one row per competency_score entry', async () => {
    // Arrange: feedback has 3 competency_scores entries
    mockGenerateFeedback.mockResolvedValue(MOCK_FEEDBACK_WITH_SCORES)

    // Act
    const res = await POST(makePOSTRequest({ sessionId: 'sess-test' }))
    await res.json()

    // Assert: HTTP response succeeds
    expect(res.status).toBe(200)

    // Assert: createMany was called exactly once
    expect(mockSessionFeedbackScoreCreateMany).toHaveBeenCalledTimes(1)

    // Assert: data contains a row per domain with correct sessionId and assessor
    const callArgs = mockSessionFeedbackScoreCreateMany.mock.calls[0][0]
    expect(callArgs).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({
          sessionId: 'sess-test',
          domain: 'Agenda Setting',
          score: 4,
          assessor: 'ai',
        }),
        expect.objectContaining({
          sessionId: 'sess-test',
          domain: 'Feedback',
          score: 5,
          assessor: 'ai',
        }),
        expect.objectContaining({
          sessionId: 'sess-test',
          domain: 'Collaborative Empiricism',
          score: 3,
          assessor: 'ai',
        }),
      ]),
    })
    expect(callArgs.data).toHaveLength(3)
  })
})

describe('POST session end — does NOT fail if feedback has no competency_scores', () => {
  /**
   * Graceful degradation: malformed / missing competency_scores must not
   * cause a 500. The route should complete successfully (200) even if no
   * score rows are written.
   *
   * RED: route currently always proceeds without trying createMany, but the
   * upcoming implementation must guard the missing-field path explicitly.
   * This test is RED because after smith-4 adds createMany, a naive
   * implementation might throw on `undefined.forEach`. The test proves the
   * guard path is correct.
   */
  it('returns 200 even when feedback.competency_scores is absent', async () => {
    // Arrange: feedback without competency_scores
    const feedbackWithoutScores = {
      overall_score: 3,
      summary: 'Needs work.',
      // competency_scores intentionally omitted
    }
    mockGenerateFeedback.mockResolvedValue(feedbackWithoutScores)

    // Act
    const res = await POST(makePOSTRequest({ sessionId: 'sess-test' }))

    // Assert: graceful — no 500
    expect(res.status).toBe(200)
  })
})

describe('POST session end — sets overallScore on session', () => {
  /**
   * RED: session.update is called today but without overallScore.
   * After smith-4, the route must also persist overallScore derived from
   * feedback.overall_score.
   */
  it('calls session.update with overallScore derived from feedback.overall_score', async () => {
    // Arrange: feedback contains overall_score = 4
    mockGenerateFeedback.mockResolvedValue(MOCK_FEEDBACK_WITH_SCORES)

    // Act
    const res = await POST(makePOSTRequest({ sessionId: 'sess-test' }))

    // Assert: HTTP succeeds
    expect(res.status).toBe(200)

    // Assert: session.update was called with overallScore
    expect(mockSessionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sess-test' },
        data: expect.objectContaining({
          overallScore: 4,
        }),
      }),
    )
  })
})
