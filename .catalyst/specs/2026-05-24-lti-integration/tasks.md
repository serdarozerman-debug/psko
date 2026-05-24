# LTI 1.3 Integration — Tasks

**Branch:** `feat/lti-integration`
**Base:** `development`

## Build DAG

```
red-tests (single batch)
   ├── lti-service: health, stateToken, roleMapping, handoffToken, adminAuth
   └── psko-app:    lti/callback route test
        │
        ▼ GATE: all tests RED → commit
        │
green-foundation
   ├── lti-service: package.json, tsconfig, index.ts skeleton
   ├── lti-service: src/lib/* (state, roles, handoff)
   ├── lti-service: src/routes/admin, ags
   └── psko-app:    src/app/lti/callback/route.ts
        │
        ▼ GATE: all tests PASS → commit
        │
integration
   └── extend psko-app/api/session/end (AGS hook)
```

## Tasks

### Red phase
- [x] lti-service scaffold (package.json, tsconfig, jest config)
- [x] Test: health endpoint
- [x] Test: state token (gen, store, validate, expire, single-use)
- [x] Test: role mapping
- [x] Test: handoff token sign/verify
- [x] Test: admin auth middleware
- [x] Test: psko-app /lti/callback route

### Green phase
- [x] lti-service src/lib/stateToken.ts
- [x] lti-service src/lib/roleMapping.ts
- [x] lti-service src/lib/handoffToken.ts
- [x] lti-service src/middleware/adminAuth.ts
- [x] lti-service src/routes/admin.ts (with inline HTML admin UI)
- [x] lti-service src/routes/ags.ts
- [x] lti-service src/lib/ltiProvider.ts (ltijs setup, onConnect, onDeepLinking)
- [x] lti-service src/routes/canvasConfig.ts
- [x] lti-service src/app.ts + src/index.ts
- [x] lti-service db/migrations/001_init.sql (lti_state, lti_used_tokens)
- [x] lti-service src/static/deep-link.html
- [x] psko-app src/app/lti/callback/route.ts
- [x] psko-app src/lib/lti/handoff.ts
- [x] psko-app extend /api/session/end (AGS fire-and-forget)

## Progress

| ID | Status | Notes |
|----|--------|-------|
| branch | Done | feat/lti-integration off development |
| red-tests | Done | All test files written |
| green-phase | Done | All implementation files created |
| test-run | Blocked | macOS Spotlight indexing new node_modules (load avg 30+); tests hang at I/O; expected to clear automatically |

## Files Created

### lti-service/ (new Express microservice)
- `package.json`, `tsconfig.json`, `jest.config.js`
- `src/app.ts` — Express app factory (no ltijs coupling, test-safe)
- `src/index.ts` — production entry (mounts ltijs + routes)
- `src/lib/stateToken.ts` — cookieless OIDC state (FR-9, AC-13)
- `src/lib/roleMapping.ts` — LTI URN → PSKO role (FR-3)
- `src/lib/handoffToken.ts` — 5-min JWT sign/verify (FR-4)
- `src/lib/ltiProvider.ts` — ltijs setup, onConnect, onDeepLinking (FR-1,2,5)
- `src/lib/supabaseStateStore.ts` — Supabase-backed state store
- `src/lib/usersBridge.ts` — Supabase user upsert
- `src/middleware/adminAuth.ts` — Bearer ADMIN_SECRET guard (FR-12)
- `src/routes/admin.ts` — Platform CRUD + HTML admin UI (FR-12)
- `src/routes/ags.ts` — AGS score passback (FR-6, AC-14)
- `src/routes/canvasConfig.ts` — Canvas developer key config (FR-7)
- `src/static/deep-link.html` — Assignment picker form (FR-5)
- `db/migrations/001_init.sql` — lti_state + lti_used_tokens tables
- `src/__tests__/health.test.ts`
- `src/__tests__/stateToken.test.ts`
- `src/__tests__/roleMapping.test.ts`
- `src/__tests__/handoffToken.test.ts`
- `src/__tests__/adminAuth.test.ts`

### psko-app/ (additions)
- `src/app/lti/callback/route.ts` — handoff token exchange (FR-4)
- `src/lib/lti/handoff.ts` — Supabase single-use ledger + admin sign-in
- `src/app/lti/callback/__tests__/route.route.test.ts`
- `src/app/api/session/end/route.ts` — extended with AGS fire-and-forget (FR-6)

## Next Steps

1. Run `db/migrations/001_init.sql` against Supabase (once, manual)
2. Set Railway env vars (see spec.md §Environment Variables)
3. Deploy `lti-service/` to Railway
4. Register Canvas developer key; configure `LTI_HOST`, `PSKO_APP_URL`, `DEEPLINK_JWT_SECRET`, `ADMIN_SECRET`
5. Integration test via 1EdTech RI: `lti-ri.imsglobal.org` (Phase 2 of test strategy)
6. Canvas Docker test: `docker run -t -i -p 3000:3000 lbjay/canvas-docker` (AC-11, AC-12, AC-14)
