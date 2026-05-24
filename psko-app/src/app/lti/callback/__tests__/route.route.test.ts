/**
 * GET /lti/callback route tests (FR-4).
 *
 * Flow:
 *   - Incoming `?token=<handoff jwt>` (5-min, signed with DEEPLINK_JWT_SECRET).
 *   - Token payload: { userId, role, ltiContext, ltiLineItemUrl? }.
 *   - Route:
 *       1. verifies JWT
 *       2. checks single-use flag via lti_used_tokens table
 *       3. signs the user in via Supabase admin (service role)
 *       4. marks token used
 *       5. redirects to /session/:id if ltiContext.sessionId, else /dashboard
 *   - Invalid/expired/used token → 302 to /auth/sign-in?error=lti_expired
 *
 * Tests run under Jest (*.route.test.ts).
 */
import { SignJWT } from 'jose'
import { GET } from '../route'

const SECRET = 'test-secret-32-chars-minimum!!!!'
process.env.DEEPLINK_JWT_SECRET = SECRET

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockMarkUsed = jest.fn()
const mockIsUsed = jest.fn()
const mockSignInAsUser = jest.fn()

jest.mock('@/lib/lti/handoff', () => ({
  isHandoffTokenUsed: (...args: unknown[]) => mockIsUsed(...args),
  markHandoffTokenUsed: (...args: unknown[]) => mockMarkUsed(...args),
  signInAsUser: (...args: unknown[]) => mockSignInAsUser(...args),
}))

async function mintToken(payload: object, opts: { expSec?: number } = {}) {
  const secret = new TextEncoder().encode(SECRET)
  const jwt = new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
  if (opts.expSec !== undefined) {
    jwt.setExpirationTime(Math.floor(Date.now() / 1000) + opts.expSec)
  } else {
    jwt.setExpirationTime('5m')
  }
  return jwt.sign(secret)
}

function makeRequest(token: string | null): Request {
  const url = token
    ? `http://localhost/lti/callback?token=${encodeURIComponent(token)}`
    : 'http://localhost/lti/callback'
  return new Request(url, { method: 'GET' })
}

describe('GET /lti/callback', () => {
  beforeEach(() => {
    mockIsUsed.mockReset()
    mockMarkUsed.mockReset()
    mockSignInAsUser.mockReset()
    mockIsUsed.mockResolvedValue(false)
    mockMarkUsed.mockResolvedValue(undefined)
    mockSignInAsUser.mockResolvedValue(undefined)
  })

  it('valid token → signs user in, marks token used, redirects to /dashboard', async () => {
    const token = await mintToken({
      jti: 'tok-1',
      userId: 'user-1',
      role: 'student',
      ltiContext: {},
    })
    const res = await GET(makeRequest(token))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/dashboard')
    expect(mockSignInAsUser).toHaveBeenCalledWith('user-1')
    expect(mockMarkUsed).toHaveBeenCalledWith('tok-1')
  })

  it('valid token with sessionId → redirects to /session/:id', async () => {
    const token = await mintToken({
      jti: 'tok-2',
      userId: 'user-2',
      role: 'student',
      ltiContext: { sessionId: 'sess-99' },
    })
    const res = await GET(makeRequest(token))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/session/sess-99')
  })

  it('expired token → 302 to /auth/sign-in?error=lti_expired', async () => {
    const token = await mintToken(
      { jti: 'tok-3', userId: 'user-3', role: 'student', ltiContext: {} },
      { expSec: -10 },
    )
    const res = await GET(makeRequest(token))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/auth/sign-in?error=lti_expired')
    expect(mockSignInAsUser).not.toHaveBeenCalled()
  })

  it('already-used token → 302 to /auth/sign-in?error=lti_expired', async () => {
    mockIsUsed.mockResolvedValue(true)
    const token = await mintToken({
      jti: 'tok-4',
      userId: 'user-4',
      role: 'student',
      ltiContext: {},
    })
    const res = await GET(makeRequest(token))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/auth/sign-in?error=lti_expired')
    expect(mockSignInAsUser).not.toHaveBeenCalled()
  })

  it('missing token → 302 to /auth/sign-in?error=lti_expired', async () => {
    const res = await GET(makeRequest(null))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/auth/sign-in?error=lti_expired')
  })

  it('tampered signature → 302 to /auth/sign-in?error=lti_expired', async () => {
    const token = await mintToken({
      jti: 'tok-5',
      userId: 'user-5',
      role: 'student',
      ltiContext: {},
    })
    // flip a char in the signature
    const tampered = token.slice(0, -3) + (token.slice(-3) === 'aaa' ? 'bbb' : 'aaa')
    const res = await GET(makeRequest(tampered))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/auth/sign-in?error=lti_expired')
  })
})
