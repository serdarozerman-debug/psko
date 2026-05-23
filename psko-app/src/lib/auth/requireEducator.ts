import type { SupabaseClient } from '@supabase/supabase-js'
import type { PrismaClient } from '@prisma/client'

/**
 * Server-side guard requiring an authenticated user whose DB role is EDUCATOR.
 *
 * The Prisma `user.role` column is the authoritative source of truth (FR-1.4).
 * `user_metadata` is ignored — only the DB row is consulted.
 *
 * Throws on unauthenticated session or non-educator role.
 */
export async function requireEducator(
  supabase: Pick<SupabaseClient, 'auth'>,
  prisma: Pick<PrismaClient, 'user'>,
) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Unauthenticated')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, email: true },
  })

  if (!dbUser || dbUser.role !== 'EDUCATOR') {
    throw new Error('Forbidden: EDUCATOR role required')
  }

  return dbUser
}
