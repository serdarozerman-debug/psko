# PSKO LTI 1.3 Service

Express microservice implementing LTI 1.3 Tool Provider for PSKO.
Deployed standalone on Railway; bridges Canvas/Moodle launches to the Next.js app via a 5-minute handoff JWT.

See `.catalyst/specs/2026-05-24-lti-integration/spec.md`.

## Scripts

- `npm test` — Jest unit tests
- `npm run dev` — local dev server (nodemon + ts-node)
- `npm run build` && `npm start` — production
