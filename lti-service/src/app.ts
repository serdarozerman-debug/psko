/**
 * createApp() — builds the Express app used both in production and in tests.
 *
 * Production mounts the ltijs provider's app (which adds /lti/login, /lti/launch,
 * /keys etc.). Tests use the bare app — they only exercise the routes added
 * here (e.g. /health). LTI-spec endpoints are exercised in integration runs.
 *
 * Keeping ltijs initialisation out of createApp() means unit tests don't need
 * a Postgres connection.
 */
import express, { type Express, type Application } from 'express';

export interface CreateAppOptions {
  ltiApp?: Application;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (options.ltiApp) {
    app.use(options.ltiApp);
  }

  return app;
}
