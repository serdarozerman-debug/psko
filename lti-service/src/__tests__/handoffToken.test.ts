/**
 * Handoff-token tests (FR-4).
 *
 * mintHandoffToken({userId, role, ltiContext, ltiLineItemUrl?}, secret)
 *   → signed JWT, 5-min exp, HS256.
 *
 * verifyHandoffToken(token, secret) → payload on success, null on tamper/expiry.
 *
 * Compatible with psko-app's @/lib/deeplink (HS256 + DEEPLINK_JWT_SECRET).
 */
import { mintHandoffToken, verifyHandoffToken } from '../lib/handoffToken';

const SECRET = 'test-secret-at-least-32-chars-!!!';

describe('handoffToken', () => {
  it('mints a token that verifyHandoffToken can decode', async () => {
    const payload = {
      userId: 'user-1',
      role: 'student' as const,
      ltiContext: { contextId: 'c1' },
      ltiLineItemUrl: 'https://lms.test/lineitem',
    };
    const token = await mintHandoffToken(payload, SECRET);
    expect(typeof token).toBe('string');

    const decoded = await verifyHandoffToken(token, SECRET);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('user-1');
    expect(decoded?.role).toBe('student');
    expect(decoded?.ltiLineItemUrl).toBe('https://lms.test/lineitem');
    expect(decoded?.ltiContext).toEqual({ contextId: 'c1' });
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await mintHandoffToken(
      { userId: 'u', role: 'student', ltiContext: {} },
      SECRET,
    );
    const decoded = await verifyHandoffToken(token, 'wrong-secret-also-32-chars!!!!!!');
    expect(decoded).toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await mintHandoffToken(
      { userId: 'u', role: 'student', ltiContext: {} },
      SECRET,
      { expiresInSec: -10 }, // already expired
    );
    const decoded = await verifyHandoffToken(token, SECRET);
    expect(decoded).toBeNull();
  });

  it('default expiry is 5 minutes', async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await mintHandoffToken(
      { userId: 'u', role: 'student', ltiContext: {} },
      SECRET,
    );
    // Decode without verification to read exp
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    expect(payload.exp - before).toBeGreaterThanOrEqual(295);
    expect(payload.exp - before).toBeLessThanOrEqual(305);
  });
});
