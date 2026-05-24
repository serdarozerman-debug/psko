/**
 * Handoff-token helpers for the /lti/callback route (FR-4).
 *
 * Three concerns:
 *  1. `isHandoffTokenUsed` / `markHandoffTokenUsed` — single-use ledger.
 *     Backed by Supabase table `lti.lti_used_tokens` (see migration 001).
 *  2. `signInAsUser` — issues a Supabase session for `userId` and writes the
 *     cookies onto the active request via `cookies()`.
 *
 * These are imported by `src/app/lti/callback/route.ts` and mocked in
 * `route.route.test.ts`.
 */
import { cookies } from 'next/headers'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) {
    throw new Error('Supabase admin env vars missing (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  }
  return createSupabaseAdmin(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'lti' },
  })
}

export async function isHandoffTokenUsed(jti: string): Promise<boolean> {
  const sb = admin()
  const { data, error } = await sb
    .from('lti_used_tokens')
    .select('jti')
    .eq('jti', jti)
    .maybeSingle()
  if (error) return false // fail-open on infra error so launches still work
  return !!data
}

export async function markHandoffTokenUsed(jti: string): Promise<void> {
  const sb = admin()
  // 10-minute future expiry — token itself is already 5 min, this is just GC headroom.
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()
  await sb.from('lti_used_tokens').insert({ jti, expires_at: expiresAt })
}

/**
 * Mint a Supabase session for `userId` and set the auth cookies on the
 * current request. Uses the admin generateLink+verifyOtp dance because the
 * service role can't directly mint a session token.
 */
export async function signInAsUser(userId: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) throw new Error('Supabase admin env vars missing')
  const sb = createSupabaseAdmin(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Lookup user to get email — required input for magiclink generation.
  const userRes = await sb.auth.admin.getUserById(userId)
  if (userRes.error || !userRes.data.user?.email) {
    throw new Error('user not found or has no email')
  }

  const linkRes = await sb.auth.admin.generateLink({
    type: 'magiclink',
    email: userRes.data.user.email,
  })
  if (linkRes.error || !linkRes.data.properties?.hashed_token) {
    throw new Error('failed to mint magiclink')
  }

  const otpRes = await sb.auth.verifyOtp({
    type: 'magiclink',
    token_hash: linkRes.data.properties.hashed_token,
  })
  if (otpRes.error || !otpRes.data.session) {
    throw new Error('failed to verify magiclink')
  }

  // Persist the new session cookies on the response — handled by writing
  // sb-{ref}-auth-token to the cookie jar in the same encoding @supabase/ssr expects.
  const session = otpRes.data.session
  const cookieJar = await cookies()
  const projectRef = new URL(url).host.split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`
  cookieJar.set(cookieName, JSON.stringify([session.access_token, session.refresh_token]), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: session.expires_in,
  })
}
