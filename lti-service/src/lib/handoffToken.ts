/**
 * 5-minute handoff JWT (FR-4).
 *
 * Issued by lti-service after a successful LTI launch; consumed by the
 * Next.js `/lti/callback` route which exchanges it for a Supabase session.
 *
 * Signed with HS256 + DEEPLINK_JWT_SECRET (shared with psko-app).
 * Each token carries a `jti` so the callback route can mark it single-use.
 */
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

export interface HandoffPayload {
  userId: string;
  role: 'educator' | 'student';
  ltiContext: Record<string, unknown>;
  ltiLineItemUrl?: string;
}

export interface HandoffPayloadDecoded extends HandoffPayload {
  jti: string;
  iat: number;
  exp: number;
}

export interface MintOptions {
  /** Expiry in seconds. Negative values produce already-expired tokens (used in tests). Default: 300 (5 min). */
  expiresInSec?: number;
}

const DEFAULT_EXPIRES_IN_SEC = 5 * 60;

export async function mintHandoffToken(
  payload: HandoffPayload,
  secret: string,
  options: MintOptions = {},
): Promise<string> {
  const expiresInSec = options.expiresInSec ?? DEFAULT_EXPIRES_IN_SEC;
  const now = Math.floor(Date.now() / 1000);
  const body: Record<string, unknown> = {
    jti: randomUUID(),
    userId: payload.userId,
    role: payload.role,
    ltiContext: payload.ltiContext,
    iat: now,
    exp: now + expiresInSec,
  };
  if (payload.ltiLineItemUrl) body.ltiLineItemUrl = payload.ltiLineItemUrl;
  const signOpts: SignOptions = { algorithm: 'HS256', noTimestamp: true };
  return jwt.sign(body, secret, signOpts);
}

export async function verifyHandoffToken(
  token: string,
  secret: string,
): Promise<HandoffPayloadDecoded | null> {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (typeof decoded !== 'object' || decoded === null) return null;
    const d = decoded as Record<string, unknown>;
    if (
      typeof d.userId !== 'string' ||
      (d.role !== 'educator' && d.role !== 'student') ||
      typeof d.jti !== 'string' ||
      typeof d.iat !== 'number' ||
      typeof d.exp !== 'number'
    ) {
      return null;
    }
    return {
      userId: d.userId,
      role: d.role,
      ltiContext: (d.ltiContext as Record<string, unknown>) ?? {},
      ltiLineItemUrl: typeof d.ltiLineItemUrl === 'string' ? d.ltiLineItemUrl : undefined,
      jti: d.jti,
      iat: d.iat,
      exp: d.exp,
    };
  } catch {
    return null;
  }
}
