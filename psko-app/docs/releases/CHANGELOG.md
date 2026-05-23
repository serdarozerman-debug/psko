# Changelog

All notable changes to PSKO are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-05-18 — Phase 2 Hardening

### Added
- **Server-authoritative phase transitions.** New `validatePhaseTransition(approach, fromPhase, toPhase)` helper rejects backward jumps, multi-phase skips, and transitions for unknown approaches.
- **`POST /api/session/phase`** for admin/recovery transitions, gated by `app_metadata.role === 'admin'`. Returns `409` on illegal jumps.
- **`HybridFrameworkViewer`** — read-only side-by-side comparison of 2–3 therapeutic frameworks on the post-session review page. Responsive (3/2/1 columns); Turkish UI strings.
- **Playwright E2E suite** scaffolded with four scenarios: student happy path, phase progression, intake validation, session resume. axe-core a11y check helper included.
- **OpenAPI 3.1 spec** generated to `public/openapi.json` via `scripts/generate-openapi.ts`. Swagger UI served at `/api/docs` (auth-gated).
- **Coverage thresholds** in `vitest.config.mjs`: lines > 85%, branches > 80%. Enforced via `npm run test:coverage`.
- Edge-case unit tests for `detect-phase.ts` (terminal clamp, unknown approach, negative turns).
- `docs/deployment.md` deployment runbook (TR mirror).

### Changed
- **`GET /api/session/phase`** now awaits phase persistence; returns `500` on write failure (previously fire-and-forget). Illegal transitions return `{ blocked: true, attempted, reason }` with `200` status and do not mutate the DB.

### Security
- Phase mutations are now validated server-side; a tampered client can no longer skip phases or replay completed ones.

### Notes
- No schema migrations.
- All existing API responses remain backward-compatible (new fields are additive).
- Turkish (`tr`) is the primary UI locale; all new strings authored in Turkish.

## [0.1.0] — 2026-05-16 — Clinical Intelligence Engine

Initial Phase 2 release: phase engine, framework registry, intake formulation,
session lifecycle endpoints.

[0.2.0]: ./CHANGELOG.md#020--2026-05-18--phase-2-hardening
[0.1.0]: ./CHANGELOG.md#010--2026-05-16--clinical-intelligence-engine
