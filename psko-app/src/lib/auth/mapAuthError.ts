import { NextResponse } from 'next/server'

/**
 * Maps auth-related thrown errors from requireEducator / requireUser to
 * the correct HTTP response. Returns null for non-auth errors so callers
 * can re-throw them.
 */
export function mapAuthError(err: unknown): NextResponse | null {
  const msg = err instanceof Error ? err.message : String(err)
  if (/forbidden/i.test(msg)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (/unauthenticated/i.test(msg)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}
