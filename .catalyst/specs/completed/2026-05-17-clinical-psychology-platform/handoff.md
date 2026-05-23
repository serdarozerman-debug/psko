# Handoff: Clinical Psychology Platform — Phase 2

> Last updated: 2026-05-18
> Status: Shipped (conditional pass — see validation.md for follow-ups)

## TL;DR

PSKO now runs a clinically-grounded session loop. A student fills a PHQ-9 + GAD-7 + open-question intake, Claude turns it into a case formulation, the formulation seeds the persona system prompt, and a turn-count phase engine drives a live guidance panel that suggests the next clinical move for whichever of the five therapeutic frameworks (CBT, Psychodynamic, ACT, DBT, Humanistic) the student chose.

Roughly 70% of the original 28-task scope shipped. The core happy path works end to end; deferred items are listed under "What's Next."

## What Changed

**Database**
- New `IntakeResponse` model (1:1 to `Session` via unique `sessionId`) holding raw responses, the Claude-generated formulation JSON, and the recommended approach.
- `Session` extended with `currentPhase Int @default(0)`.
- Migration `20260516212341_add_clinical_intelligence_engine` ships these changes.

**Clinical knowledge layer (`src/lib/clinical/`)**
- `frameworks/{cbt,psychodynamic,act,dbt,humanistic}.ts` — each defines ≥4 protocol phases with `objective`, `techniques[]`, `watchFor[]`, `triggerTurnMin`, and academic sources (Beck, Luborsky, Hayes, Linehan, Rogers).
- `frameworks/index.ts` exposes `ALL_FRAMEWORKS` and `getClinicalFramework(approach)`.
- `intake/questions.ts` — PHQ-9 (9), GAD-7 (7), and 3 open prompts plus `computePHQ9Score` / `computeGAD7Score`.
- `intake/formulation.ts` — `buildCaseFormulation(...)`: sends scored intake + persona context to Claude, parses JSON, falls back to a rule-based formulation if parsing fails.
- `phase-engine/detect-phase.ts` — pure `getPhaseForTurn(approach, turnCount)` returns `{ currentPhase, phase, nextPhase, nextMove }`. Zero API calls; deterministic.

**API routes**
- `POST /api/intake/analyze` — auth-gated, Zod-validated, returns `{ formulation, recommendedApproach, questions }`.
- `POST /api/session/start` — now accepts optional `intakeResponses`; builds formulation, stores `IntakeResponse`, threads `clinicalContext` into the opening statement.
- `POST /api/session/message` — pulls the prior `IntakeResponse` (if any) and passes `clinicalContext` into `streamPatientResponse` on every turn.
- `GET /api/session/phase?sessionId=...` — returns current `PhaseGuidance` and lazily persists `currentPhase` when it advances.

**UI**
- `IntakeFlow.tsx` — 4-step wizard (`phq9 → gad7 → open → result`), folds in the case-formulation review on the final step, allows skip.
- `SessionGuidancePanel.tsx` — subscribes to the phase route, renders phase name, objective, suggested next move, and watchpoints.

**Types** — `ProtocolPhase`, `CaseFormulation`, `IntakeQuestion`, `PhaseGuidance` all live in `src/types/index.ts`.

## Key Decisions

**Why fold `CaseFormulationReview` into `IntakeFlow` (vs. a separate component)?**
The review is the natural final step of the wizard. A standalone component would have duplicated state plumbing for marginal modularity gain. Acceptable trade.

**Why turn-count phase detection (vs. async Claude content detection)?**
Predictable, zero cost, zero latency. Async content detection (REQ-009) is a clean follow-up once we have telemetry on whether students are actually outrunning or lagging the turn thresholds.

**Why lazy phase persistence (in the GET handler) instead of advancing inside the message route?**
Keeps the message hot path single-purpose (stream the AI reply, save the message, bump turn count). The guidance panel polls phase on the client, so the DB write happens then. Trade-off documented in validation.md item 2 — refactor candidate if any backend consumer ever needs authoritative `currentPhase`.

**Why a single `clinicalContext` string in the prompt (vs. the structured `CASE_CONTEXT` block in REQ-004)?**
Smaller token footprint, easier prompt iteration. The structured block can be reconstructed when we want richer prompt-time control over PHQ-9/GAD-7 emphasis.

**Why hardcode Turkish in the formulation prompt?**
Phase 1 set Turkish as the default for all AI-generated text. Enforcing it at the prompt level (rather than a runtime locale check) guarantees consistency until we expose a user language preference.

## How to Test

**Local dev**

```bash
cd psko-app
npm install
npx prisma migrate deploy
npm run dev
```

**Manual smoke test**

1. Log in via Supabase auth.
2. From the persona picker, choose any persona → click "Start with intake".
3. Fill PHQ-9 (9 items), then GAD-7 (7 items), then 3 open questions.
4. Wait < 5s for the case formulation. Confirm it lists 1–2 recommended approaches with Turkish rationale text.
5. Click confirm → session opens with the AI's contextualized opening line (it should reference the presenting concern, not generic).
6. Exchange 8–10 turns. The right-hand `SessionGuidancePanel` should advance phase index at the framework's `triggerTurnMin` boundaries and update the suggested next move.
7. End session → debrief should reference the case context.

**Automated**

```bash
cd psko-app
node --require tsx/cjs --test $(find src/lib -name '*.test.ts')
npx tsc --noEmit
npm run lint
```

Expected: 23 / 29 tests pass (6 known dynamic-import failures — see Gotchas), tsc exits 0, lint exits 0.

## Gotchas

- **`npm test` script is broken.** The shell glob `src/lib/**/*.test.ts` in `package.json` doesn't expand in the npm script context. Use the `find` command above. Fix is one line in `package.json`.
- **6 failing tests are tooling, not product.** `frameworks.test.ts` uses `await import('../phase-engine/detect-phase')` inside test bodies. tsx's ESM resolver can't resolve the implicit `.ts` extension from a dynamic import. Top-level static imports in the same file work fine. Either lift the imports or append `.ts`.
- **Model string is hardcoded** as `claude-opus-4-5` in `formulation.ts`. Current production is Opus 4.7. Bump or move to `process.env.ANTHROPIC_MODEL`.
- **Phase advances lazily.** `Session.currentPhase` is only written when a client GETs `/api/session/phase`. If you ever query phase from the backend without that GET happening first, you'll see stale data.
- **`clinicalContext` is a single string.** PHQ-9/GAD-7 scores are computed but only their textual rendering reaches the persona prompt. If you want the persona to react to a specific score, you'll need to enrich `clinicalContext` in `buildCaseFormulation`.
- **`npm audit` is loud (4 high, 7 moderate)** — all upstream in Next.js 14.2.35 / postcss. Not introduced here, but they're in the project. Plan a Next minor bump.
- **No E2E test coverage.** T-021 was not implemented. Manual smoke test only.

## What's Next

Track these as a Phase 2.1 hardening spec (`2026-05-18-clinical-platform-hardening` suggested):

- [ ] Fix the 6 dynamic-import tests and the `npm test` glob.
- [ ] Move phase advancement into `POST /api/session/message` so server state is authoritative.
- [ ] Bump Claude model and externalize it via env var.
- [ ] Implement async content-aware phase detection (REQ-009).
- [ ] Add `clinicalAnchors` to persona `cognitiveModel` (REQ-010).
- [ ] Build `HybridFrameworkViewer` dashboard page (REQ-011).
- [ ] Write Playwright E2E (T-021) and intake-analyzer unit tests with Claude mocking (T-023).
- [ ] WCAG 2.1 AA audit on new components (T-024).
- [ ] Docs: `INTAKE_SYSTEM.md`, `PROTOCOL_PHASES.md`, `CLINICAL_FRAMEWORKS.md` (T-025).
- [ ] Release notes + git tag `v2.0.0-clinical-psychology-platform` (T-028).
- [ ] Next.js minor-version bump to absorb security fixes.
