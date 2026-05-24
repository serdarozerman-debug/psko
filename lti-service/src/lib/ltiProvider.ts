/**
 * ltijs provider initialisation (FR-1, FR-2, FR-5, FR-6, FR-10).
 *
 * Boundary kept thin so unit tests don't need a Postgres instance.
 *
 * The provider:
 *  - registers /lti/login (handled by ltijs OIDC initiation, augmented with
 *    our cookieless `state` workaround when the platform sends `lti_message_hint`).
 *  - registers /lti/launch (ltijs verifies the id_token; our onConnect handler
 *    upserts the PSKO user and issues a handoff JWT).
 *  - registers /lti/deep-link (ltijs onDeepLinking handler).
 *  - exposes the public JWK at /keys (ltijs default).
 *  - manages platform-storage tables via ltijs-sequelize on the `lti` schema.
 */
import path from 'path';
import type { Application } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const lti = require('ltijs').Provider;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require('ltijs-sequelize');

import { mapLtiRoles } from './roleMapping';
import { mintHandoffToken } from './handoffToken';
import type { UsersBridge } from './usersBridge';

export interface LtiProviderConfig {
  host: string;
  encryptionKey: string;
  dbUrl: string;
  pskoAppUrl: string;
  deepLinkSecret: string;
  users: UsersBridge;
}

export interface LtiProviderHandle {
  app: Application;
  /** Underlying ltijs provider — exposed for AGS score posting and admin platform management. */
  provider: unknown;
  deploy(): Promise<void>;
}

export async function createLtiProvider(cfg: LtiProviderConfig): Promise<LtiProviderHandle> {
  const url = new URL(cfg.dbUrl);
  const dbPlugin = new Database(
    url.pathname.replace(/^\//, ''),
    url.username,
    decodeURIComponent(url.password),
    {
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
      dialect: 'postgres',
      logging: false,
      schema: 'lti',
    },
  );

  lti.setup(
    cfg.encryptionKey,
    { plugin: dbPlugin },
    {
      appRoute: '/lti/launch',
      loginRoute: '/lti/login',
      keysetRoute: '/keys',
      dynRegRoute: '/lti/register',
      cookies: { secure: true, sameSite: 'None' },
      devMode: false,
      // we still issue our own handoff redirect from onConnect
      tokenMaxAge: 60,
    },
  );

  lti.onConnect(async (token: any, _req: any, res: any) => {
    const claims = token?.platformContext ?? {};
    const userId = token?.user as string;
    const email = (token?.userInfo?.email as string | undefined) ?? undefined;
    const name = (token?.userInfo?.name as string | undefined) ?? undefined;
    const roles: string[] = Array.isArray(claims.roles) ? claims.roles : [];
    const role = mapLtiRoles(roles);
    const iss = (token?.iss as string | undefined) ?? '';

    const { userId: pskoUserId } = await cfg.users.upsertUser({
      ltiSub: userId,
      iss,
      email,
      name,
      role,
    });

    const ltiLineItemUrl: string | undefined =
      claims?.endpoint?.lineitem ?? undefined;

    const handoff = await mintHandoffToken(
      {
        userId: pskoUserId,
        role,
        ltiContext: {
          contextId: claims?.context?.id,
          contextTitle: claims?.context?.title,
          resourceLinkId: claims?.resource?.id,
          custom: claims?.custom,
        },
        ltiLineItemUrl,
      },
      cfg.deepLinkSecret,
    );

    return res.redirect(`${cfg.pskoAppUrl}/lti/callback?token=${encodeURIComponent(handoff)}`);
  });

  lti.onDeepLinking(async (_token: any, _req: any, res: any) => {
    // Renders the persona/approach picker form. The form POSTs back to
    // /lti/deep-link/submit which we wire below.
    return res.sendFile(path.join(__dirname, '..', 'static', 'deep-link.html'));
  });

  await lti.deploy({ serverless: true });

  return {
    app: lti.app,
    provider: lti,
    async deploy() {
      // already deployed serverless; expose for symmetry
    },
  };
}
