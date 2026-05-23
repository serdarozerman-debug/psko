---
spec: 2026-05-18-phase2-hardening
status: in_progress
domain: hardening

provides:
  - Server-authoritative phase transitions (illegal jumps rejected at API layer)
  - HybridFrameworkViewer for side-by-side comparison of 2-3 therapeutic approaches (read-only)
  - End-to-end Playwright test suite covering the full student session flow
  - Unit test coverage (>85%) for framework engine edge cases
  - WCAG 2.1 AA accessibility compliance on intake, session guidance, framework view
  - OpenAPI 3.1 spec with Swagger UI served at /api/docs
  - Versioned release notes + deployment runbook (Turkish + English)

requires:
  - spec: 2026-05-16-clinical-intelligence-engine
    needed: Phase engine, framework analyzer, session APIs, intake flow

affects:
  - src/app/api/session/phase/route.ts — add transition validator
  - src/lib/clinical/phase-engine/ — new validatePhaseTransition helper
  - src/components/session/ — new HybridFrameworkViewer component
  - tests/e2e/ — new Playwright suite
  - tests/unit/clinical/ — framework analyzer coverage
  - public/api-docs — Swagger UI bundle
  - docs/releases/ — version history (TR + EN)

patterns_established: []
key_files:
  - src/app/api/session/phase/route.ts
  - src/lib/clinical/phase-engine/detect-phase.ts
  - src/components/session/
  - prisma/schema.prisma

key_decisions:
  - Phase integrity enforced at API layer (no schema migration); turnCount + currentPhase are the source of truth, transitions validated against approach-specific phase order
  - HybridFrameworkViewer is read-only comparison (no new persistence, no student selection)
  - E2E tests run against Supabase test project with seeded personas; no production data
  - Accessibility audited with axe-core in CI + manual keyboard/screen-reader pass
  - OpenAPI generated from Zod schemas via zod-to-openapi (single source of truth)
  - No breaking changes: all existing API responses remain backward compatible
---

# Phase 2 Hardening

> Status: DRAFT

## Overview

Phase 2 (Clinical Intelligence Engine) shipped functional but deferred seven hardening tasks. This spec closes them in a single coordinated sweep: server-side integrity, comparison UX, test coverage, accessibility, documentation, and release process.

No new clinical features. No schema migrations. No breaking API changes.

## Problem Statement

After Phase 2 deployment, the following gaps remain:

1. **Phase integrity** — `/api/session/phase` trusts client-supplied turn counts implicitly; a tampered client could skip phases or replay completed ones. The endpoint also fires phase persistence as fire-and-forget, hiding write failures.
2. **Framework comparison** — Students see one recommended approach but cannot compare alternatives during review, blocking the pedagogical "why this approach?" reflection.
3. **Test coverage** — No E2E coverage; unit coverage on `framework-analyzer.ts` is < 60%. Regressions in the phase engine could ship undetected.
4. **Accessibility** — Intake form, session guidance panel, and framework view have not been audited. Keyboard traps and missing ARIA labels suspected.
5. **API docs** — External integrators (future LMS sync) have no contract reference.
6. **Release process** — Deployments are ad-hoc; no version history, no rollback runbook.

## Functional Requirements

### FR-1: Server-Authoritative Phase Updates
- `GET /api/session/phase` validates that the computed phase is a legal successor of `session.currentPhase` for the session's `therapeuticApproach`.
- New helper `validatePhaseTransition(approach, fromPhase, toPhase)` returns `{ valid, reason }`.
- Illegal transitions: log a warning, return the persisted `currentPhase` (do not advance), include `{ blocked: true, attempted: <phase> }` in response.
- Phase persistence is awaited; write failures return 500 with structured error.
- Add `POST /api/session/phase` endpoint for explicit transitions (admin/recovery use), gated by user role.

### FR-2: HybridFrameworkViewer
- React component rendering 2-3 framework cards side-by-side.
- Each card shows: approach name, phase timeline, key techniques, recommended-when criteria.
- Reads existing framework metadata from `src/lib/clinical/frameworks/`.
- Mounted on the post-session review page; receives `approaches: TherapeuticApproach[]` (length 2 or 3) as props.
- Responsive: stacks vertically below 768px.
- No state, no persistence, no selection callback.

### FR-3: E2E Test Suite (Playwright)
- Test scenarios:
  - Student signs in → completes intake → receives approach recommendation → starts session → exchanges 5 messages → ends session → views summary
  - Phase transitions advance correctly across turns
  - Intake validation rejects incomplete submissions
  - Session resumption after page reload preserves phase
- Run against ephemeral Supabase project (seeded via `prisma db seed`).
- Tag: `@e2e`, runs in GitHub Actions on PR.

### FR-4: Framework Analyzer Unit Tests
- Cover `framework-analyzer.ts`, `detect-phase.ts`, `recommend-approach.ts`.
- Edge cases: zero turns, turn count beyond final phase, unknown approach, malformed intake.
- Coverage threshold enforced in CI: lines > 85%, branches > 80%.

### FR-5: Accessibility (WCAG 2.1 AA)
- Audit scope: intake form, session guidance panel, HybridFrameworkViewer, persona selection.
- Automated: axe-core integrated into Playwright suite; zero serious/critical violations.
- Manual: keyboard-only navigation pass, NVDA + VoiceOver smoke test.
- Fixes: ARIA labels on icon buttons, `aria-live` regions for phase changes, focus management on modal open/close, color contrast ≥ 4.5:1 for body text.

### FR-6: API Documentation
- OpenAPI 3.1 spec generated from Zod schemas via `@asteasolutions/zod-to-openapi`.
- Swagger UI served at `/api/docs` (Next.js route).
- Covers all `/api/session/*`, `/api/intake/*`, `/api/personas/*` endpoints.
- Includes auth scheme (Supabase JWT), error response shapes, example payloads.

### FR-7: Release Notes & Deployment Guide
- `docs/releases/CHANGELOG.md` — semver-tagged entries from current state forward.
- `docs/releases/CHANGELOG.tr.md` — Turkish mirror.
- `docs/deployment.md` — Vercel deploy steps, env var checklist, Supabase migration command, rollback procedure.
- Initial entry: `v0.2.0 — Phase 2 Hardening`.

## Non-Functional Requirements

- **Performance**: phase validation adds < 5ms per request; no extra DB roundtrip (uses existing `session` row).
- **Compatibility**: every existing API response remains a strict superset of current contract.
- **Coverage**: combined unit + E2E line coverage > 85%.
- **a11y**: zero axe-core serious/critical findings in audited surfaces.
- **i18n**: all new user-facing strings keyed in both `tr` and `en` locale files.

## Technical Considerations

- `validatePhaseTransition` lives next to `detect-phase.ts`; pure function, easy to unit-test.
- Phase order per approach already encoded in `src/lib/clinical/frameworks/`; reuse, do not duplicate.
- HybridFrameworkViewer should consume the same framework registry — no parallel data source.
- Swagger UI: use static `swagger-ui-dist` assets to avoid runtime dependency bloat.
- Playwright: use `@playwright/test`; reuse existing Supabase client helpers from unit tests.
- CI: extend existing GitHub Actions workflow; do not create a new one.

## Acceptance Criteria

- [ ] Illegal phase transition request returns `{ blocked: true }` and does not mutate DB
- [ ] `validatePhaseTransition` has 100% branch coverage
- [ ] HybridFrameworkViewer renders 3 approaches side-by-side at ≥1024px and stacked at <768px
- [ ] Playwright E2E suite green in CI; covers all four FR-3 scenarios
- [ ] Coverage report shows > 85% lines on clinical engine modules
- [ ] axe-core scan reports zero serious/critical issues on audited routes
- [ ] `/api/docs` loads Swagger UI listing all endpoints with example responses
- [ ] `CHANGELOG.md` + `CHANGELOG.tr.md` + `docs/deployment.md` reviewed and merged
- [ ] No existing test fails; no existing API consumer breaks

## Open Questions & Assumptions

- **Assumption**: Student role does not need a UI to trigger `POST /api/session/phase` — admin/recovery only. Confirm if pedagogical "skip-ahead" is desired.
- **Assumption**: HybridFrameworkViewer surfaces 2-3 approaches; the selection of *which* approaches to compare is heuristic (recommended + one alternative from intake scoring). Out of scope to let students hand-pick.
- **Assumption**: Existing Supabase test project (`psko-test`) is available; if not, provisioning is a prerequisite task.
- **Open**: Should Swagger UI be public or auth-gated? Default to auth-gated (requires login) for v1.
- **Open**: Turkish release notes — written from scratch or translated post-merge by clinical lead? Default to author-translated with a TODO marker for review.

## Out of Scope

- Schema migrations (no new tables, no column additions)
- New therapeutic approaches or framework content
- Mobile-native (PWA-only)
- Real-time multi-user collaboration on review
