/**
 * Bearer-token middleware for /admin/* routes (FR-12).
 *
 * Compares Authorization header against the configured ADMIN_SECRET.
 * Empty configured secret is treated as a misconfiguration — always 401
 * so a forgotten env var can't accidentally open the platform-admin API.
 */
import type { RequestHandler } from 'express';

export function adminAuth(secret: string): RequestHandler {
  return (req, res, next) => {
    const header = req.header('authorization');
    if (!header || !secret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const [scheme, value] = header.split(' ', 2);
    if (scheme !== 'Bearer' || !value || value.trim() !== secret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  };
}
