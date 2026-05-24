# Spec: LTI 1.3 Integration

**Status:** APPROVED  
**Created:** 2026-05-24  
**Covers:** AC-11, AC-12, AC-13, AC-14 (deferred from educator-features spec)

---

## Problem

Psychology programs run PSKO sessions inside their LMS (Canvas or Moodle). Instructors want students to launch PSKO from within the LMS — no separate login, grades flow back automatically. Currently PSKO has no LTI protocol support; the only external integration is a signed deep-link URL (non-standard).

---

## Goal

A working LTI 1.3 Tool Provider that allows any Canvas or Moodle installation to:
1. Launch PSKO for a student with SSO (no separate login)
2. Deep-link a specific persona + approach as an assignment
3. Receive a competency score back after the session ends (AGS grade passback)

---

## Architecture Decision

**Separate Express microservice** (`lti-service/` in monorepo root) deployed to Railway.

Reasons:
- `ltijs` (the only mature LTI 1.3 Node library) is built for Express, not Next.js edge/serverless
- LTI protocol requires persistent HTTP state (OIDC cookies, JWKS cache) — incompatible with Vercel's stateless model
- Isolation: LTI service downtime doesn't affect direct-access students

```
Canvas/Moodle
    │ POST /lti/login   (OIDC initiation)
    │ POST /lti/launch  (JWT id_token)
    ▼
lti-service.up.railway.app  (Railway — Express + ltijs)
    │ Validates JWT, upserts user in Supabase
    │ Issues 5-min handoff JWT (DEEPLINK_JWT_SECRET)
    │ Redirects to app.psko.app/lti/callback?token=...
    ▼
psko-app.vercel.app  (Next.js)
    │ /lti/callback exchanges handoff token → Supabase session
    │ Redirects to /dashboard or /session/:id
```

---

## Functional Requirements

### FR-1 — OIDC Login Initiation
`POST /lti/login` — validates `iss`, `login_hint`, `target_link_uri`; stores state in Supabase (not cookies — see AC-13); redirects to LMS auth endpoint.

### FR-2 — LTI Launch
`POST /lti/launch` — verifies id_token JWT signature against platform public JWK (cached, refresh on 401); extracts `sub`, `email`, `name`, `roles`, `context`, `lis` claims; upserts PSKO user.

### FR-3 — Role Mapping
| LTI Role | PSKO Role |
|----------|-----------|
| `http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor` | `educator` |
| `http://purl.imsglobal.org/vocab/lis/v2/membership#Learner` | `student` |

### FR-4 — Session Handoff
After successful launch: issue a 5-min signed JWT (DEEPLINK_JWT_SECRET) containing `{userId, role, ltiContext, ltiLineItemUrl}` → redirect to `app.psko.app/lti/callback?token=<jwt>`. Next.js `/lti/callback` route exchanges it for a Supabase session (single-use, invalidated on exchange via Supabase KV flag).

### FR-5 — LTI Deep Linking 2.0
`GET /lti/deep-link` — shows assignment picker UI (persona + approach dropdowns); on submit POSTs `LtiDeepLinkingResponse` JWT back to platform's `deep_link_return_url`.

### FR-6 — AGS Grade Passback
When a session ends (`/api/session/end`), if the session has `ltiLineItemUrl`, the LTI service POSTs a score to the AGS endpoint. Score = competency score from AI supervisor feedback (0–100, normalized to 0.0–1.0).

### FR-7 — Canvas Config Endpoint
`GET /canvas-config.json` — returns the JSON developer key config blob (client_id, redirect_uris, scopes, public JWK URL) for Canvas administrator paste-in.

### FR-8 — Moodle Docs
Markdown documentation for Moodle "External Tool" manual configuration (tool URL, public JWK URL, redirect URI, scopes).

### FR-9 — State-Token Cookieless Mode (AC-13)
**ltijs built-in cookieless mode is not shipped.** Custom implementation:
- Generate a random `state` UUID on login initiation, store `{state, nonce, platformId, targetLinkUri}` in Supabase `lti_state` table with 10-min TTL
- Pass `state` as query param in the OIDC redirect (not cookie)
- Validate `state` on launch, delete row after use

### FR-10 — LTI Data Tables
`ltijs-sequelize` manages tables in a dedicated `lti` Supabase schema. Migration runs on service startup. Tables: `lti_platforms`, `lti_idtoken`, `lti_contexttoken`, `lti_accesstoken`.
Additional custom table: `lti_state` (state-token workaround).

### FR-11 — Health Endpoint
`GET /health` → `{"status":"ok","timestamp":"..."}`. Railway uses this for health checks.

### FR-12 — Platform Admin UI
`GET /admin/platforms` — lists registered LTI platforms (client_id, issuer, name). `POST /admin/platforms` — registers a new platform (name, issuer, client_id, auth endpoint, JWKS URL, token endpoint). `DELETE /admin/platforms/:id` — removes a platform. Protected by `ADMIN_SECRET` header (Bearer token). Simple HTML form UI backed by these endpoints.

---

## Technical Stack

| Component | Choice | Reason |
|-----------|--------|--------|
| LTI library | `ltijs` 5.9.9 | Only mature LTI 1.3 Node library |
| DB adapter | `ltijs-sequelize` 2.4.0 | `ltijs-postgresql` is abandoned (5yr) |
| Runtime | Express 4 | ltijs requires Express |
| Deployment | Railway | Persistent Express, easy Postgres env wiring |
| DB | Supabase Postgres (shared) | Same DB, `lti` schema |
| Auth bridge | DEEPLINK_JWT_SECRET (already exists) | Reuses handoff token infrastructure |

---

## Acceptance Criteria

**AC-11 — LTI Launch from Canvas**
A student launched from a Canvas course can complete a PSKO session without ever seeing a sign-in form. Verified against `canvas-docker` local instance.

**AC-12 — Deep Linking**
An instructor in deep-link mode can select a persona + approach and save it as an assignment. Students launched from that assignment land on the correct session context.

**AC-13 — Safari / Chrome iframe compatibility**
Launch succeeds inside an LMS iframe in Safari 17+ and Chrome with Privacy Sandbox enabled. No third-party cookies required (state-token workaround).

**AC-14 — AGS Grade Passback**
After a student ends a session, a score (0–100) appears in the Canvas gradebook within 30 seconds. Verified against `canvas-docker`.

---

## Test Strategy

**Phase 1 — Unit tests (no LMS)**
- ltijs provider setup with mock platform
- JWT validation logic
- State-token generation/validation
- Handoff token exchange in Next.js `/lti/callback`

**Phase 2 — Integration (1EdTech RI)**
- Register tool at `lti-ri.imsglobal.org`
- Expose localhost via ngrok
- Verify OIDC + launch flow end-to-end

**Phase 3 — Canvas Docker (AC-11, AC-12, AC-14)**
```bash
docker run -t -i -p 3000:3000 lbjay/canvas-docker
```
Full developer key creation + LTI launch + AGS passback.

**Phase 4 — Moodle Docker (secondary)**
```bash
# moodlehq/moodle-docker
docker compose up
```
Verify manual External Tool configuration.

---

## Out of Scope

- NRPS (Names and Roles Provisioning Service) — not needed for current features
- LTI Advantage: Proctoring Service
- Automatic LTI service deployment pipeline (manual Railway deploy for v1)

---

## Environment Variables (new)

```env
# lti-service/
LTI_DB_URL=postgresql://...       # same Supabase DB, lti schema
LTI_ENCRYPTION_KEY=               # ltijs encryptionkey (32 char random)
LTI_HOST=https://lti-service.up.railway.app
PSKO_APP_URL=https://psko-app.vercel.app
DEEPLINK_JWT_SECRET=              # shared with Next.js app (already exists)
ADMIN_SECRET=                     # Bearer token for /admin/* routes

# psko-app/ (new)
LTI_SERVICE_URL=https://lti-service.up.railway.app  # for AGS passback calls
```

---

## Decisions

| Question | Decision |
|----------|----------|
| Deployment platform | Railway |
| Domain for v1 | Railway-generated URL (`lti-service.up.railway.app`) — custom domain upgrade later |
| Platform registration | Simple admin UI (FR-12) — `ADMIN_SECRET`-protected |
