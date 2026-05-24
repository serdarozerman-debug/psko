import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export interface DeepLinkPayload {
  assignmentId: string
  cohortId: string
}

function getSecret(): Uint8Array {
  const secret = process.env.DEEPLINK_JWT_SECRET ?? 'dev-secret-32-chars-minimum!!!!!'
  return new TextEncoder().encode(secret)
}

/**
 * Mint a signed deep-link JWT for an assignment.
 * Token expires in 7 days.
 */
export async function mintDeepLinkToken(payload: DeepLinkPayload): Promise<string> {
  return new SignJWT({ assignmentId: payload.assignmentId, cohortId: payload.cohortId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

/**
 * Verify and decode a deep-link JWT.
 * Returns null on any failure (expired, malformed, bad signature, or missing fields).
 */
export async function verifyDeepLinkToken(token: string): Promise<DeepLinkPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const { assignmentId, cohortId } = payload as JWTPayload & Partial<DeepLinkPayload>
    if (typeof assignmentId !== 'string' || typeof cohortId !== 'string') {
      return null
    }
    return { assignmentId, cohortId }
  } catch {
    return null
  }
}
