import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side guard requiring any authenticated user.
 * Throws on unauthenticated session.
 */
export async function requireUser(supabase: Pick<SupabaseClient, 'auth'>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Unauthenticated')
  }
  return user
}
