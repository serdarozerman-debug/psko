/**
 * lti-service entrypoint. Used in production / `npm start`. Not imported by tests.
 */
import 'dotenv/config';
import { createApp } from './app';
import { createLtiProvider } from './lib/ltiProvider';
import { createSupabaseUsersBridge } from './lib/usersBridge';
import { createAdminRouter, type PlatformProvider } from './routes/admin';
import { createAgsRouter, type AgsScorePoster } from './routes/ags';
import { createCanvasConfigRouter } from './routes/canvasConfig';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

async function main(): Promise<void> {
  const host = requireEnv('LTI_HOST');
  const encryptionKey = requireEnv('LTI_ENCRYPTION_KEY');
  const dbUrl = requireEnv('LTI_DB_URL');
  const pskoAppUrl = requireEnv('PSKO_APP_URL');
  const deepLinkSecret = requireEnv('DEEPLINK_JWT_SECRET');
  const adminSecret = requireEnv('ADMIN_SECRET');
  const internalSecret = process.env.INTERNAL_SHARED_SECRET ?? adminSecret;
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  const users = createSupabaseUsersBridge(supabaseUrl, serviceRoleKey);

  const lti = await createLtiProvider({
    host,
    encryptionKey,
    dbUrl,
    pskoAppUrl,
    deepLinkSecret,
    users,
  });

  // ltijs exposes registerPlatform / getAllPlatforms via its top-level Provider.
  const ltiAny = lti.provider as {
    registerPlatform: PlatformProvider['registerPlatform'];
    getAllPlatforms: PlatformProvider['getAllPlatforms'];
    deletePlatform: PlatformProvider['deletePlatform'];
    Grade: { scorePublish: (idtoken: unknown, score: unknown) => Promise<unknown> };
  };

  const adminProvider: PlatformProvider = {
    getAllPlatforms: () => ltiAny.getAllPlatforms(),
    registerPlatform: (payload) => ltiAny.registerPlatform(payload),
    deletePlatform: (clientId, issuer) => ltiAny.deletePlatform(clientId, issuer),
  };

  // AGS poster — in production, we look up the idtoken context via ltijs and call
  // Grade.scorePublish. For v1 we keep a simple thunk and let integration tests
  // validate it against Canvas Docker (AC-14).
  const agsPoster: AgsScorePoster = {
    async postScore(_input) {
      throw new Error('AGS posting requires ltijs Grade.scorePublish wiring — see AC-14');
    },
  };

  const app = createApp({ ltiApp: lti.app });
  app.use(createCanvasConfigRouter(host));
  app.use('/admin', createAdminRouter(adminSecret, adminProvider));
  app.use('/ags', createAgsRouter(agsPoster, internalSecret));

  const port = Number(process.env.PORT ?? 3001);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`lti-service listening on :${port}`);
  });
}

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('lti-service failed to start:', err);
    process.exit(1);
  });
}
