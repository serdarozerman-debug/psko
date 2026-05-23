import type { UserRole } from '@prisma/client'

type JwtPayload = Record<string, unknown> | null | undefined

/**
 * Extract the user role from a JWT payload.
 *
 * SECURITY: Only `app_metadata.role` is trusted. `user_metadata` is
 * user-controlled and MUST NEVER be used for authorization decisions.
 * Anything that isn't an explicit `EDUCATOR` claim falls back to `STUDENT`.
 */
export function getRoleFromJwt(payload: JwtPayload): UserRole {
  if (!payload || typeof payload !== 'object') return 'STUDENT'

  const appMeta = (payload as Record<string, unknown>).app_metadata
  if (appMeta && typeof appMeta === 'object' && 'role' in appMeta) {
    const role = (appMeta as Record<string, unknown>).role
    if (role === 'EDUCATOR') return 'EDUCATOR'
  }
  return 'STUDENT'
}
