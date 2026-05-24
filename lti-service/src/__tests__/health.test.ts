/**
 * Health endpoint test (FR-11).
 *
 * GET /health returns 200 with JSON: {status: 'ok', timestamp: <ISO string>}.
 * Railway uses this for service-level health checks.
 */
import request from 'supertest';
import { createApp } from '../app';

describe('GET /health', () => {
  it('returns 200 with status ok and an ISO timestamp', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
    // valid ISO date
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });
});
