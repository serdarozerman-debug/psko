/**
 * Assignment & Grade Service (AGS) passback (FR-6, AC-14).
 *
 * Called by the psko-app `/api/session/end` route after a session's
 * competency feedback is generated. The lti-service owns the LMS access
 * token (via ltijs platform credentials), so the score POST happens here.
 *
 * Request body:
 *   { ltiLineItemUrl: string, userId: string, score: number (0..100), scoreMaximum?: number }
 *
 * Normalises score to [0,1] before sending to the LMS.
 */
import { Router, type RequestHandler } from 'express';

export interface AgsScorePoster {
  /**
   * POST a score result to the AGS lineitem.
   * Implementation can use ltijs.Grade.scorePublish() — abstracted here so
   * tests can stub the LMS call.
   */
  postScore(input: {
    lineItemUrl: string;
    userId: string;
    scoreGiven: number; // 0..1
    scoreMaximum: number; // typically 1
    activityProgress: 'Completed';
    gradingProgress: 'FullyGraded';
  }): Promise<void>;
}

export function createAgsRouter(poster: AgsScorePoster, internalSecret: string): Router {
  const router = Router();

  const handler: RequestHandler = async (req, res) => {
    // Cheap shared-secret check between psko-app and lti-service.
    if ((req.header('x-internal-secret') ?? '') !== internalSecret) {
      res.status(401).json({ error: 'unauthorised' });
      return;
    }
    const b = req.body ?? {};
    if (typeof b.ltiLineItemUrl !== 'string' || typeof b.userId !== 'string' || typeof b.score !== 'number') {
      res.status(400).json({ error: 'invalid payload' });
      return;
    }
    if (b.score < 0 || b.score > 100 || Number.isNaN(b.score)) {
      res.status(400).json({ error: 'score must be 0..100' });
      return;
    }
    const max = typeof b.scoreMaximum === 'number' ? b.scoreMaximum : 100;
    const normalised = b.score / max;
    try {
      await poster.postScore({
        lineItemUrl: b.ltiLineItemUrl,
        userId: b.userId,
        scoreGiven: normalised,
        scoreMaximum: 1,
        activityProgress: 'Completed',
        gradingProgress: 'FullyGraded',
      });
      res.json({ ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(502).json({ error: 'ags_post_failed', detail: msg });
    }
  };

  router.post('/score', handler);
  return router;
}
