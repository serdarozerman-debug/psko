# Tasks — Phase 2 Hardening

> Spec: 2026-05-18-phase2-hardening
> Status: DRAFT (awaiting `/forge-spec`)

Legend: `[P]` = parallelizable, `[S]` = serial dependency on prior, `[T]` = test, `[D]` = docs

---

## Track A — Phase Integrity (FR-1)

- [ ] **A1** [P] Create `src/lib/clinical/phase-engine/validate-transition.ts`
  - Pure function `validatePhaseTransition(approach, fromPhase, toPhase): { valid, reason }`
  - Reads phase order from existing framework registry
  - Allows: same phase, next phase, or stay if at terminal
  - Rejects: backward jumps, skipping > 1 phase, unknown phase

- [ ] **A2** [T] Unit tests for `validate-transition.ts`
  - 100% branch coverage, all four approaches, edge cases (null, unknown approach, terminal phase)

- [ ] **A3** [S→A1] Refactor `GET /api/session/phase`
  - Await the persistence write; return 500 on failure
  - Call `validatePhaseTransition`; on rejection return `{ blocked: true, attempted, currentPhase }` with 200 status
  - Structured logging on block events

- [ ] **A4** [S→A1] Add `POST /api/session/phase` for explicit transition
  - Body: `{ sessionId, toPhase }`; auth required; role check (admin only for v1)
  - Same validator; returns updated phase or 409 on illegal jump

- [ ] **A5** [T] API route tests for GET + POST phase
  - Mock Supabase auth; test legal advance, illegal skip, terminal stay, unauthorized

---

## Track B — HybridFrameworkViewer (FR-2)

- [ ] **B1** [P] Component scaffold `src/components/session/HybridFrameworkViewer.tsx`
  - Props: `approaches: TherapeuticApproach[]` (2-3)
  - Reads framework metadata from existing registry

- [ ] **B2** [S→B1] FrameworkCard subcomponent
  - Renders: name, phase timeline (horizontal pill list), key techniques, recommended-when bullets
  - Reuses existing design tokens

- [ ] **B3** [S→B2] Responsive layout
  - CSS grid: 3 cols ≥1024px, 2 cols 768-1023px, 1 col <768px
  - Tailwind utility classes

- [ ] **B4** [S→B3] Mount on post-session review page
  - Pass `[recommended, alternative1, alternative2?]` derived from intake scoring

- [ ] **B5** [T] Component tests (React Testing Library)
  - Renders all approaches; correct stack at narrow viewport

---

## Track C — E2E Test Suite (FR-3)

- [ ] **C1** [P] Install + configure Playwright
  - `playwright.config.ts`, base URL from env, projects: chromium + webkit

- [ ] **C2** [S→C1] Seed helper for test Supabase project
  - Reuse `prisma/seed.ts`; add E2E user fixture

- [ ] **C3** [S→C2] Scenario: full student happy path
  - Sign in → intake → recommendation → session → 5 messages → end → summary

- [ ] **C4** [S→C2] Scenario: phase progression
  - 12 turn session asserting phase advances at expected boundaries

- [ ] **C5** [S→C2] Scenario: intake validation
  - Missing required fields → error UI; partial submission rejected

- [ ] **C6** [S→C2] Scenario: session resume
  - Reload mid-session → currentPhase and turnCount preserved

- [ ] **C7** [S→C1..C6] GitHub Actions integration
  - New job `e2e` in existing workflow; runs on PR; uploads trace on failure

---

## Track D — Unit Coverage (FR-4)

- [ ] **D1** [P] Coverage audit of `src/lib/clinical/`
  - Run `vitest --coverage`; identify gaps in `framework-analyzer.ts`, `detect-phase.ts`, `recommend-approach.ts`

- [ ] **D2** [S→D1] Tests for `framework-analyzer.ts` edge cases
  - Zero turns, beyond-final phase, unknown approach, malformed intake

- [ ] **D3** [S→D1] Tests for `recommend-approach.ts`
  - PHQ-9 / GAD-7 score boundaries, tie-breaking, all-zero intake

- [ ] **D4** [S→D2,D3] Enforce coverage thresholds
  - `vitest.config.ts`: lines > 85, branches > 80, fails CI below threshold

---

## Track E — Accessibility (FR-5)

- [ ] **E1** [P] Integrate axe-core into Playwright
  - Helper `await checkA11y(page)`; called in each E2E scenario

- [ ] **E2** [S→E1] Intake form audit + fixes
  - Label associations, error announcements (`aria-live="polite"`), focus on first error

- [ ] **E3** [S→E1] Session guidance panel audit + fixes
  - `aria-live="polite"` on phase changes, icon button labels, contrast pass

- [ ] **E4** [S→B4,E1] HybridFrameworkViewer audit + fixes
  - Card landmarks, heading hierarchy, focusable cards

- [ ] **E5** [S→E2..E4] Manual keyboard pass
  - Document any residual issues; create follow-up tasks if non-blocking

- [ ] **E6** [S→E5] Manual screen-reader smoke test
  - NVDA on Windows, VoiceOver on macOS; flow through happy path

---

## Track F — API Documentation (FR-6)

- [ ] **F1** [P] Install `@asteasolutions/zod-to-openapi` + `swagger-ui-dist`

- [ ] **F2** [S→F1] Extract Zod schemas to `src/lib/api-schemas/`
  - One file per resource; export registry

- [ ] **F3** [S→F2] OpenAPI generator script `scripts/generate-openapi.ts`
  - Writes `public/openapi.json`; runs in `prebuild`

- [ ] **F4** [S→F3] Swagger UI route `src/app/api/docs/page.tsx`
  - Auth-gated (Supabase session required); loads `/openapi.json`

- [ ] **F5** [T] Smoke test: `/api/docs` returns 200 for logged-in user, 401 otherwise

---

## Track G — Release Notes & Deployment Guide (FR-7)

- [ ] **G1** [P] Author `docs/releases/CHANGELOG.md`
  - Format: Keep-a-Changelog; initial entry `v0.2.0`

- [ ] **G2** [S→G1] Author `docs/releases/CHANGELOG.tr.md` (mirror)

- [ ] **G3** [P] Author `docs/deployment.md`
  - Vercel deploy, env vars, Supabase migration, rollback steps, smoke-test checklist

- [ ] **G4** [S→G3] Author `docs/deployment.tr.md`

- [ ] **G5** [S→G1..G4] Add CHANGELOG link to README

---

## Definition of Done

- All tasks above checked off
- CI green: unit, E2E, coverage threshold, axe-core
- Manual a11y pass documented
- `/api/docs` reachable and accurate
- Release notes merged to `main`
- No regression in existing Phase 2 flows

## Suggested Execution Order

1. A1 + A2 (foundation for phase integrity)
2. B1-B5 (component, isolated)
3. D1-D4 (coverage, can run alongside A/B)
4. C1-C7 (E2E, depends on app being stable)
5. E1-E6 (a11y, depends on E2E harness)
6. F1-F5 (docs, mostly independent)
7. G1-G5 (release notes, last)

Parallelism opportunities: A, B, D, F can run concurrently across multiple agents.
