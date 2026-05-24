/**
 * GET /lti/callback — exchange a handoff JWT for a Supabase session (FR-4).
 *
 * Flow:
 *   1. Read `?token=…`, verify HS256 with DEEPLINK_JWT_SECRET.
 *   2. Reject if missing/expired/tampered → /auth/sign-in?error=lti_expired.
 *   3. Check single-use ledger (lti.lti_used_tokens). Used → reject.
 *   4. Sign the user in via Supabase admin, set cookies.
 *   5. Mark token used.
 *   6. Redirect to /session/:id if ltiContext.sessionId present, else /dashboard.
 */
import { jwtVerify } from 'jose'
import {
  isHandoffTokenUsed,
  markHandoffTokenUsed,
  signInAsUser,
} from '@/lib/lti/handoff'

function deny(): Response {
  return new Response(null, {
    status: 302,
    headers: { location: '/auth/sign-in?error=lti_expired' },
  })
}

function redirect(to: string): Response {
  return new Response(null, { status: 302, headers: { location: to } })
}

interface HandoffClaims {
  jti?: unknown
  userId?: unknown
  role?: unknown
  ltiContext?: unknown
  ltiLineItemUrl?: unknown
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token) return deny()

  const secret = process.env.DEEPLINK_JWT_SECRET ?? 'dev-secret-32-chars-minimum!!!!!'
  const key = new TextEncoder().encode(secret)

  let payload: HandoffClaims
  try {
    const { payload: p } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    payload = p as HandoffClaims
  } catch {
    return deny()
  }

  const jti = typeof payload.jti === 'string' ? payload.jti : null
  const userId = typeof payload.userId === 'string' ? payload.userId : null
  if (!jti || !userId) return deny()

  try {
    if (await isHandoffTokenUsed(jti)) return deny()
    await signInAsUser(userId)
    await markHandoffTokenUsed(jti)
  } catch {
    return deny()
  }

  const ctx = (payload.ltiContext ?? {}) as { sessionId?: unknown }
  if (typeof ctx.sessionId === 'string' && ctx.sessionId.length > 0) {
    return redirect(`/session/${ctx.sessionId}`)
  }
  return redirect('/dashboard')
}
