/**
 * Canvas developer-key config JSON (FR-7).
 *
 * Admins paste the URL of this endpoint into Canvas → Developer Keys → LTI
 * Key → Configure → JSON URL.
 *
 * https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html
 */
import { Router, type RequestHandler } from 'express';

export function createCanvasConfigRouter(host: string): Router {
  const router = Router();
  const handler: RequestHandler = (_req, res) => {
    res.json({
      title: 'PSKO',
      description: 'AI-powered clinical psychology simulation trainer',
      oidc_initiation_url: `${host}/lti/login`,
      target_link_uri: `${host}/lti/launch`,
      public_jwk_url: `${host}/keys`,
      scopes: [
        'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
        'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly',
        'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly',
        'https://purl.imsglobal.org/spec/lti-ags/scope/score',
        'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
      ],
      extensions: [
        {
          platform: 'canvas.instructure.com',
          domain: new URL(host).host,
          tool_id: 'psko',
          privacy_level: 'public',
          settings: {
            text: 'PSKO',
            placements: [
              {
                placement: 'link_selection',
                message_type: 'LtiDeepLinkingRequest',
                target_link_uri: `${host}/lti/deep-link`,
              },
              {
                placement: 'assignment_selection',
                message_type: 'LtiDeepLinkingRequest',
                target_link_uri: `${host}/lti/deep-link`,
              },
              {
                placement: 'course_navigation',
                message_type: 'LtiResourceLinkRequest',
                target_link_uri: `${host}/lti/launch`,
                default: 'disabled',
              },
            ],
          },
        },
      ],
      custom_fields: {},
    });
  };
  router.get('/canvas-config.json', handler);
  return router;
}
