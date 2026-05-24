/**
 * Admin-auth tests (FR-12).
 *
 * /admin/* routes are protected by Authorization: Bearer <ADMIN_SECRET>.
 * Missing / wrong / malformed header → 401.
 * Correct header → 200 (we mount a trivial probe route to avoid pulling in
 * the full admin-platforms surface here).
 */
import express from 'express';
import request from 'supertest';
import { adminAuth } from '../middleware/adminAuth';

function makeApp(secret: string) {
  const app = express();
  app.use('/admin', adminAuth(secret));
  app.get('/admin/ping', (_req, res) => res.json({ ok: true }));
  return app;
}

describe('adminAuth middleware', () => {
  const SECRET = 'unit-admin-secret';

  it('rejects with 401 when Authorization header is missing', async () => {
    const res = await request(makeApp(SECRET)).get('/admin/ping');
    expect(res.status).toBe(401);
  });

  it('rejects with 401 when Bearer token is wrong', async () => {
    const res = await request(makeApp(SECRET))
      .get('/admin/ping')
      .set('Authorization', 'Bearer wrong');
    expect(res.status).toBe(401);
  });

  it('rejects with 401 when scheme is not Bearer', async () => {
    const res = await request(makeApp(SECRET))
      .get('/admin/ping')
      .set('Authorization', `Basic ${SECRET}`);
    expect(res.status).toBe(401);
  });

  it('accepts with 200 when Bearer token matches ADMIN_SECRET', async () => {
    const res = await request(makeApp(SECRET))
      .get('/admin/ping')
      .set('Authorization', `Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('rejects if configured secret is empty (safety)', async () => {
    const app = express();
    app.use('/admin', adminAuth(''));
    app.get('/admin/ping', (_req, res) => res.json({ ok: true }));
    const res = await request(app).get('/admin/ping').set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
  });
});
