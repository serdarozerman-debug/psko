# Tasks: Clinical Psychology Platform — Phase 2

> Status: COMPLETE (archived 2026-05-18)
>
> Shipped: T-001–T-017, T-019
> Deferred: T-018, T-020, T-021, T-023, T-024, T-025, T-028
> N/A: T-026, T-027
> 
> All tasks are granular, dependency-ordered, and ready for `Smith` (builder), `Shaper` (refactor), `Alchemist` (integration).
> 
> Notation: `#T-001` = Task ID; `[depends: #T-002]` = must complete before this task; `(5pt)` = story points estimate

---

## Phase 2A: Foundation — Schema & Types

### T-001: Extend TypeScript Types with Protocol Phases ✅ SHIPPED

**Description:** Add new interfaces to `src/types/index.ts` for clinical phase system.

**Acceptance Criteria:**
- [x] `ProtocolPhase` interface defined (index, name, objective, techniques[], watchFor[], triggerTurnMin, transitionSignal?, source?)
- [x] `CaseFormulation` interface defined (presentingIssues[], phq9Score, gad7Score, functionalImpairment, clinicalPicture, recommendedApproaches[])
- [x] `IntakeResponse` interface defined (id, sessionId, responses JSON, formulation JSON, recommendedApproach, studentApproach, overrideReason?)
- [x] `PhaseGuidance` interface defined (currentPhaseIndex, currentPhase, progressPercent, nextTechniqueHint, watchpoint, phaseTransitionJustification?)
- [x] `ApproachConfig` extended with optional `phases: ProtocolPhase[]`, `caseConceptualizationTemplate: string`, `keyTheoretical: string[]`
- [x] All types exported from index, properly documented (JSDoc comments)

**Story Points:** 3

**Depends:** None

---

### T-002: Update Prisma Schema — Add IntakeResponse & Extend Session ✅ SHIPPED

**Description:** Add `IntakeResponse` model and extend `Session` with phase tracking to `prisma/schema.prisma`.

**Acceptance Criteria:**
- [x] New `IntakeResponse` model created with fields: id (uuid), sessionId (unique FK), responses (Json), formulation (Json), recommendedApproach (string), studentApproach (string), overrideReason (string?), createdAt (DateTime)
- [x] `Session` model extended with: `currentPhase` (Int?, default 0), `intakeResponseId` (String? @unique foreign key to IntakeResponse)
- [x] Relation `IntakeResponse` ↔ `Session` defined (one-to-one)
- [x] `@@map` annotations consistent with existing naming convention (snake_case in DB)
- [x] Schema compiles with `prisma format` (no syntax errors)

**Story Points:** 2

**Depends:** #T-001

---

### T-003: Generate Prisma Migration ✅ SHIPPED

**Description:** Create and test Prisma migration for new schema.

**Acceptance Criteria:**
- [x] Migration file generated in `prisma/migrations/` with timestamp + descriptive name
- [x] Migration includes all schema changes from T-002
- [x] Migration can be applied to local dev DB without errors: `npx prisma migrate dev`
- [x] Prisma client regenerated (`npx prisma generate`)
- [x] No data loss warnings in dev environment

**Story Points:** 2

**Depends:** #T-002

---

## Phase 2B: Clinical Frameworks — Protocol Phases

### T-004: Define CBT Protocol Phases ✅ SHIPPED

**Description:** Create `src/lib/clinical/frameworks/cbt.ts` with Beck's 5-phase CBT model.

**Acceptance Criteria:**
- [x] CBT phases (0–4) fully defined: Engagement, Assessment, Formulation, Intervention, Consolidation
- [x] Each phase includes: index, name, objective, techniques[] (5–8 items), watchFor[] (3–5 items), triggerTurnMin, transitionSignal (optional), source
- [x] Phase definitions match research.md academic grounding (Beck 2020)
- [x] All technique descriptions use student-actionable language ("Ask Socratic questions", not "Use Socratic method")
- [x] Export as `cbtFramework` (FrameworkDefinition)
- [x] TypeScript strict mode passes (no `any` types)

**Story Points:** 5

**Depends:** #T-001

---

### T-005: Define Psychodynamic Protocol Phases ✅ SHIPPED

**Description:** Create `src/lib/clinical/frameworks/psychodynamic.ts` with Luborsky CCRT 5-phase model.

**Acceptance Criteria:**
- [x] PDT phases (0–4) fully defined: Rapport, Exploratory Listening, Pattern Recognition, Transference, Integration
- [x] Each phase includes: index, name, objective, techniques[], watchFor[], triggerTurnMin, transitionSignal, source
- [x] CCRT framework (Wish-RO-RS) explained in each phase's objective
- [x] Transference concepts clearly explained for student understanding
- [x] Source cited: Luborsky (1984), Shedler (2010)
- [x] Export as `psychodynamicFramework`

**Story Points:** 5

**Depends:** #T-001

---

### T-006: Define ACT Protocol Phases ✅ SHIPPED

**Description:** Create `src/lib/clinical/frameworks/act.ts` with Hayes' 6-core-processes (non-sequential) model.

**Acceptance Criteria:**
- [x] 6 ACT core processes defined (not traditional phases): Acceptance, Defusion, Present-Moment Awareness, Self-as-Context, Values, Committed Action
- [x] Each process includes: index (0–5), name, objective, techniques[], watchFor[], context (when to target this process)
- [x] Note in phase 0 (Acceptance): "ACT is not sequential; all processes are available throughout the session"
- [x] Hexaflex model explained in key documentation
- [x] Source: Hayes et al. (2012)
- [x] Export as `actFramework`

**Story Points:** 5

**Depends:** #T-001

---

### T-007: Define DBT Protocol Phases ✅ SHIPPED

**Description:** Create `src/lib/clinical/frameworks/dbt.ts` with Linehan's 4-stage model (simplified for PSKO).

**Acceptance Criteria:**
- [x] DBT stages (0–3): Stabilization, Emotional Processing, Ordinary Happiness, Maintenance (or consolidation)
- [x] Each stage includes: index, name, objective, techniques[], watchFor[], triggerTurnMin, transitionSignal, source
- [x] Stage 1 heavily weighted (safety, crisis de-escalation skills)
- [x] Note: "Full DBT is 12+ months; PSKO teaches foundational skills within one session"
- [x] 4 skills modules referenced: Mindfulness, Distress Tolerance, Emotion Regulation, Interpersonal Effectiveness
- [x] Source: Linehan (2014)
- [x] Export as `dbtFramework`

**Story Points:** 5

**Depends:** #T-001

---

### T-008: Define Humanistic/Person-Centered Protocol Phases ✅ SHIPPED

**Description:** Create `src/lib/clinical/frameworks/humanistic.ts` with Rogers' 3-phase empathy progression.

**Acceptance Criteria:**
- [x] Humanistic phases (0–2): Presence & Acceptance, Deepening, Heightened Awareness & Challenge
- [x] Each phase includes: index, name, objective, techniques[], watchFor[], triggerTurnMin, transitionSignal, source
- [x] Core conditions (unconditional positive regard, empathic understanding, congruence) woven throughout
- [x] Non-directive approach emphasized ("Follow client's lead, not therapist's agenda")
- [x] Empathy ladder concept (basic reflection → accurate empathy → advanced empathy) clear
- [x] Source: Rogers (1961)
- [x] Export as `humanisticFramework`

**Story Points:** 5

**Depends:** #T-001

---

### T-009: Update ApproachConfig in All 5 Approaches ✅ SHIPPED

**Description:** Add `phases: ProtocolPhase[]`, `caseConceptualizationTemplate`, `keyTheoretical[]` to each approach module.

**Acceptance Criteria:**
- [x] `src/lib/approaches/cbt.ts` updated with CBT phases from #T-004
- [x] `src/lib/approaches/psychodynamic.ts` updated with PDT phases from #T-005
- [x] `src/lib/approaches/act.ts` updated with ACT processes from #T-006
- [x] `src/lib/approaches/dbt.ts` updated with DBT stages from #T-007
- [x] `src/lib/approaches/humanistic.ts` updated with Humanistic phases from #T-008
- [x] Each has `caseConceptualizationTemplate` (narrative template, ~200 words)
- [x] Each has `keyTheoretical` array (3–5 key theoretical anchors)
- [x] No breaking changes to existing `ApproachConfig` interface (phases[] optional)
- [x] All tests still pass

**Story Points:** 3

**Depends:** #T-004, #T-005, #T-006, #T-007, #T-008

---

## Phase 2C: Intake System — Questions & Analysis

### T-010: Create Intake Question Bank ✅ SHIPPED

**Description:** Create `src/lib/clinical/intake/questions.ts` with PHQ-9 + GAD-7 + open-ended questions.

**Acceptance Criteria:**
- [x] PHQ-9 questions (9 items) formatted as objects with id, text, scale (0–3 mapping), scoring
- [x] GAD-7 questions (7 items) formatted similarly
- [x] 3 open-ended questions: presenting problem, duration, functional impact
- [x] All questions include Turkish translations (e.g., `text: { en: "...", tr: "..." }`)
- [x] Scoring thresholds defined: PHQ-9 (0–4: none, 5–9: mild, etc.), GAD-7 (similar)
- [x] Export as `phq9Questions`, `gad7Questions`, `openEndedQuestions`
- [x] TypeScript interfaces: `IntakeQuestion`, `IntakeQuestionResponse`

**Story Points:** 3

**Depends:** #T-001

---

### T-011: Create Intake Analyzer Function ✅ SHIPPED

**Description:** Create `src/lib/clinical/intake/analyzer.ts` with Claude-based case formulation generation.

**Acceptance Criteria:**
- [x] Function `analyzeIntake(responses: Record<string, any>): Promise<CaseFormulation>`
- [x] Takes intake form responses, calculates PHQ-9 and GAD-7 scores
- [x] Calls Claude API with system prompt designed for case formulation
- [x] Claude returns structured JSON: `{ caseFormulation, phq9Score, gad7Score, recommendedApproaches[], primaryConcerns[], functionalImpairment, riskFactors? }`
- [x] Parsing with error handling (malformed JSON fallback)
- [x] Timeout: 5 seconds (hard fail if exceeded)
- [x] Returns `CaseFormulation` interface
- [x] Claude prompt includes: "Respond in the user's language (Turkish or English as applicable)"
- [x] Tested with sample intake responses (happy path + edge cases)

**Story Points:** 5

**Depends:** #T-001, #T-010

---

### T-012: Create Intake Form Component ✅ SHIPPED

**Description:** Create `src/components/IntakeFlow.tsx` React component for intake form UI.

**Acceptance Criteria:**
- [x] Multi-screen form (3 screens or 1 scrollable page with progress indicator)
- [x] Screen 1: PHQ-9 items (radio buttons or buttons, 0–3 scale)
- [x] Screen 2: GAD-7 items (similar)
- [x] Screen 3: Open-ended text inputs (3 questions)
- [x] "Next" / "Back" / "Submit" buttons
- [x] Progress indicator (e.g., "2 of 3" or progress bar)
- [x] Responsive design (mobile-friendly, fits in 80% of viewport)
- [x] Keyboard navigation (Tab, Enter, Arrow keys)
- [x] Turkish language support (labels, buttons, instructions)
- [x] Loading state during submission (spinner, disabled submit button)
- [x] Error state (network error, Claude failure) with retry option

**Story Points:** 5

**Depends:** #T-010

---

### T-013: Create Case Formulation Review Component ✅ SHIPPED

**Description:** Create `src/components/CaseFormulationReview.tsx` component for displaying and confirming formulation + approach.

**Acceptance Criteria:**
- [x] Displays case formulation narrative (150–250 words, markdown-rendered)
- [x] Shows PHQ-9 and GAD-7 scores (with interpretation, e.g., "Moderate depression")
- [x] Lists 2–3 recommended approaches with rationales (bullet points)
- [x] Shows primary concerns and functional impairment level
- [x] "This looks right" button → confirms approach, proceeds to persona selector
- [x] "I'd prefer a different approach" button → dropdown/radio to select alternative
- [x] Optional "Skip intake" link (if intake is optional)
- [x] Responsive, accessible (ARIA labels, high contrast)
- [x] Turkish translations for all labels + interpretation text

**Story Points:** 3

**Depends:** #T-011

---

## Phase 2D: Session Integration — API Routes

### T-014: Create Intake Analysis API Route ✅ SHIPPED

**Description:** Create `src/app/api/intake/analyze/route.ts` POST endpoint.

**Acceptance Criteria:**
- [x] Endpoint: `POST /api/intake/analyze`
- [x] Input validation: intake form responses (JSON schema validation)
- [x] Calls `analyzeIntake()` from T-011
- [x] Returns `{ caseFormulation: CaseFormulation, recommendedApproaches: [...] }`
- [x] Error handling: if Claude fails, return rule-based recommendations (PHQ-9 + GAD-7 only)
- [x] 5-second timeout with descriptive error message
- [x] Request logging (for debugging)
- [x] Response compression (gzip)
- [x] Tested with curl or client-side test

**Story Points:** 3

**Depends:** #T-011

---

### T-015: Update Session Start Route with Intake Integration ✅ SHIPPED

**Description:** Modify `src/app/api/session/start/route.ts` to accept intakeResponseId and inject case context.

**Acceptance Criteria:**
- [x] Accept optional `intakeResponseId` in request body
- [x] If provided: fetch `IntakeResponse` from DB, extract `formulation` JSON
- [x] Build CASE_CONTEXT section in system prompt: clinical picture, PHQ-9 score, GAD-7 score, primary concerns, functional impairment
- [x] Inject CASE_CONTEXT into persona system prompt under dedicated section
- [x] Store `intakeResponseId` on Session model
- [x] If intakeResponseId NOT provided: session proceeds as before (backward compatible)
- [x] Test: session with intake vs. session without intake both work
- [x] Session opening message contextualizes the case (e.g., "Based on your intake, I'm working with someone presenting with [concerns]")

**Story Points:** 5

**Depends:** #T-001, #T-002, #T-003, #T-014

---

### T-016: Create Phase Tracking API Route (GET) ✅ SHIPPED

**Description:** Create `src/app/api/session/[id]/phase/route.ts` GET endpoint.

**Acceptance Criteria:**
- [x] Endpoint: `GET /api/session/[id]/phase`
- [x] Fetches current Session, extracts `currentPhase` and approach
- [x] Retrieves current ProtocolPhase definition from approach framework
- [x] Calculates progress percentage (turnCount / estimatedSessionLength, e.g., 25 turns)
- [x] Returns `PhaseGuidance` object: currentPhaseIndex, currentPhase, progressPercent, nextTechniqueHint, watchpoint
- [x] Handles edge case: no ProtocolPhase defined (returns default guidance)
- [x] Fast response (query-only, no AI calls)
- [x] Tested with multiple approach types

**Story Points:** 3

**Depends:** #T-002, #T-004 through #T-008

---

### T-017: Create Phase Detection Service (Turn-Based) ✅ SHIPPED

**Description:** Create `src/lib/clinical/phase-engine/detect.ts` with turn-count-based phase detection.

**Acceptance Criteria:**
- [x] Function `detectPhaseByTurnCount(turnCount: number, approach: TherapeuticApproach): number`
- [x] Uses approach-specific turn thresholds (from research.md)
- [x] Returns phase index (0–4 or 0–5)
- [x] Fallback: if thresholds not found for approach, return 0
- [x] Unit tests: verify phase advancement at correct turn counts
- [x] Exported for use in route handlers

**Story Points:** 2

**Depends:** #T-009

---

### T-018: Create Phase Update Logic in Message Route — DEFERRED

**Description:** Integrate phase detection into `src/app/api/session/message/route.ts`.

> Deferred: Phase DB persistence on message route not yet integrated. Phase detection works via GET /phase polling; server-side auto-advance not shipped in Phase 2.

**Acceptance Criteria:**
- [ ] After saving message pair, check if phase should advance (turnCount % 5 === 0)
- [ ] Call `detectPhaseByTurnCount()` to determine new phase
- [ ] If phase changed: update `Session.currentPhase` in DB, log transition
- [ ] Return phase in response metadata (optional, for frontend to show "phase advanced!")
- [ ] No blocking: phase detection doesn't slow message response
- [ ] Tested: verify phase advances at expected turn counts

**Story Points:** 3

**Depends:** #T-017, #T-018

---

## Phase 2E: Frontend — Session Guidance

### T-019: Create Session Guidance Panel Component (Refactored) ✅ SHIPPED

**Description:** Create `src/components/SessionGuidancePanel.tsx` replacing static hints with dynamic phase guidance.

**Acceptance Criteria:**
- [x] Component subscribes to `/api/session/[id]/phase` every 5 turns (or after each message)
- [x] Displays: phase name, index (e.g., "Phase 2 of 4"), progress bar (visual %)
- [x] Shows clinical objective (1–2 sentences)
- [x] Shows "Next move" suggestion (specific, actionable technique)
- [x] Shows "Watch for" (one watchpoint)
- [x] Phase transition indicator: when phase changes, highlight with color animation + brief explanation
- [x] Expandable section: "Phase history" showing previous transitions
- [x] Approach-specific color scheme (CBT = blue, PDT = purple, ACT = green, DBT = orange, Humanistic = warm red)
- [x] Mobile responsive (side panel becomes bottom panel on small screens)
- [x] Turkish translations for all labels and descriptions
- [x] Error handling: if phase API fails, fall back to static hints

**Story Points:** 8

**Depends:** #T-016, #T-019

---

### T-020: Create Hybrid Framework Viewer Component — DEFERRED

**Description:** Create `src/components/HybridFrameworkViewer.tsx` for showing how all 5 approaches conceptualize a case.

**Acceptance Criteria:**
- [ ] Dashboard sub-page: "How different approaches would see this case"
- [ ] Displays for each of 5 approaches: name, theoretical anchor, case conceptualization, phase table
- [ ] Phase table: columns (Phase, Objective, Key Techniques), rows (phase 0–4)
- [ ] Read-only view (no interactive selection during session)
- [ ] Case study example included (pre-populated for learning)
- [ ] Responsive table (horizontal scroll on mobile)
- [ ] Turkish translations for all framework content
- [ ] Accessible (semantic HTML, ARIA labels)

**Story Points:** 5

**Depends:** #T-004 through #T-008

---

## Phase 2F: Integration & Testing

### T-021: End-to-End Test: Intake → Session → Feedback Flow — DEFERRED

**Description:** Integration test covering full flow: intake form → case formulation → session start → phase progression → feedback.

**Acceptance Criteria:**
- [ ] Test scenario: student fills intake (moderate PHQ-9/GAD-7) → sees case formulation + approach rec → confirms → session starts
- [ ] During session: message turn 1, 5, 10, 15, 20 — verify phase advances at expected turns
- [ ] Verify CASE_CONTEXT injected into system prompt
- [ ] Verify guidance panel shows correct phase + technique
- [ ] Verify feedback summary references case formulation
- [ ] All in-browser or Playwright test (no manual steps)
- [ ] Pass with and without intake (optional intake test)

**Story Points:** 8

**Depends:** #T-014 through #T-020

---

### T-022: Unit Test: Phase Detection

**Description:** Unit tests for phase detection logic (turn-based).

**Acceptance Criteria:**
- [ ] Test each approach's turn thresholds: verify phase at turn 0, 3, 8, 15, 22
- [ ] Test edge cases: turn 2 (phase 0), turn 100 (stay at max phase)
- [ ] Test all 5 approaches
- [ ] 100% code coverage for `phase-engine/detect.ts`

**Story Points:** 3

**Depends:** #T-017

---

### T-023: Unit Test: Case Formulation Analyzer — DEFERRED

**Description:** Unit tests for intake analyzer (Claude API mocking).

**Acceptance Criteria:**
- [ ] Mock Claude API responses (success + malformed JSON)
- [ ] Test high PHQ-9, low GAD-7 (depression focus)
- [ ] Test high GAD-7, low PHQ-9 (anxiety focus)
- [ ] Test high both (complex presentation)
- [ ] Test error handling: Claude timeout, network error, malformed response
- [ ] Verify fallback recommendations work
- [ ] All major code paths tested

**Story Points:** 5

**Depends:** #T-011

---

### T-024: Accessibility & i18n Audit — DEFERRED

**Description:** Audit all new components for accessibility (WCAG 2.1 AA) and Turkish language support.

**Acceptance Criteria:**
- [ ] IntakeFlow: keyboard navigation, form labels, error messages accessible
- [ ] CaseFormulationReview: heading hierarchy, button labels, color contrast checked
- [ ] SessionGuidancePanel: semantics (current phase announced), screen reader tested
- [ ] HybridFrameworkViewer: table semantics, link descriptions
- [ ] All UI strings in TypeScript files have Turkish translations
- [ ] No hardcoded English text in components
- [ ] Language toggle works (if implemented) or default to Turkish (if Phase 1 rule)
- [ ] Lighthouse accessibility score ≥ 95

**Story Points:** 5

**Depends:** #T-012, #T-013, #T-019, #T-020

---

## Phase 2G: Documentation & Deployment

### T-025: Update Documentation — DEFERRED

**Description:** Update project docs to explain intake, case formulation, protocol phases.

**Acceptance Criteria:**
- [ ] `docs/INTAKE_SYSTEM.md` — explains intake questionnaire, scoring, approach recommendation
- [ ] `docs/PROTOCOL_PHASES.md` — overview of 5 approaches + their phases, with student-facing explanations
- [ ] `docs/CLINICAL_FRAMEWORKS.md` — academic grounding, references, limitations
- [ ] `docs/API.md` updated with new routes: `/intake/analyze`, `/session/[id]/phase`
- [ ] All docs include Turkish translation (or links to translated versions)
- [ ] README updated with "Clinical Psychology Platform" Phase 2 overview

**Story Points:** 3

**Depends:** All tasks complete

---

### T-026: Database Seed Data for Clinical Frameworks — N/A

**Description:** Create seed script to populate framework definitions (if storing phases in DB, not just code).

> N/A: Frameworks are code-based only (src/lib/clinical/frameworks/). No DB seed required.

**Acceptance Criteria:**
- [ ] `prisma/seed-clinical.ts` script created (optional, if DB storage used)
- [ ] OR confirm frameworks are code-based only (no DB seed needed)
- [ ] If DB seed needed: populate ProtocolPhase definitions per approach
- [ ] `npx prisma db seed` runs without errors
- [ ] Verify data in DB with `SELECT * FROM protocol_phases`

**Story Points:** 2

**Depends:** #T-003, #T-004 through #T-008

---

### T-027: Deploy to Staging & QA — N/A

**Description:** Deploy Phase 2 to staging environment; full QA testing.

> N/A: Deployment managed via Vercel CI on the development branch. No separate staging QA gate for this spec.

**Acceptance Criteria:**
- [ ] All code merged to development branch
- [ ] Staging deployment: `vercel --prod` (or equivalent)
- [ ] QA checklist:
  - [ ] Intake form renders, submits, case formulation returns in <5s
  - [ ] Session with intake: CASE_CONTEXT visible in first AI response (check with dev tools)
  - [ ] Phase advances as turns progress (check guidance panel)
  - [ ] Feedback includes case formulation reference
  - [ ] Turkish translations render correctly
  - [ ] Accessibility: keyboard nav, screen reader, mobile
  - [ ] No console errors or warnings
- [ ] Performance: Lighthouse score ≥ 85
- [ ] Bug report template + QA sign-off required

**Story Points:** 5

**Depends:** #T-021, #T-024

---

### T-028: Merge to Main & Release Notes — DEFERRED

**Description:** Final merge to main branch; release notes for Phase 2.

**Acceptance Criteria:**
- [ ] All QA sign-off complete; no blocking bugs
- [ ] Rebase & merge to development (or main, per convention)
- [ ] Git tag created: `v2.0.0-clinical-psychology-platform`
- [ ] RELEASE_NOTES.md updated:
  - [ ] Feature: Intake questionnaire (PHQ-9 + GAD-7)
  - [ ] Feature: Case formulation with Claude AI
  - [ ] Feature: Protocol phase definitions for 5 approaches
  - [ ] Feature: Dynamic session guidance panel
  - [ ] Feature: Hybrid framework viewer (optional)
  - [ ] Feature: Turkish language support throughout
  - [ ] Fixes: Any bugs found during QA
  - [ ] Migration instructions: `npx prisma migrate deploy`
  - [ ] Rollback plan (if needed)
- [ ] CHANGELOG.md appended

**Story Points:** 2

**Depends:** #T-027

---

## Dependency Graph Summary

```
T-001 (Types)
├── T-002 (Prisma Schema)
│   └── T-003 (Migration)
│       └── T-015 (Update Session/Start)
├── T-004 through T-008 (Framework Definitions)
│   └── T-009 (Update ApproachConfig)
│       └── T-016 (Phase Tracking API)
│       └── T-018 (Message Route Integration)
├── T-010 (Intake Questions)
│   └── T-011 (Intake Analyzer)
│       └── T-014 (Intake API Route)
│       └── T-023 (Test)
│   └── T-012 (Intake Form Component)
│       └── T-024 (Accessibility Audit)
├── T-013 (Case Formulation Review)
│   └── T-024 (Accessibility Audit)
├── T-017 (Phase Detection)
│   └── T-018 (Message Route)
├── T-019 (Guidance Panel)
│   └── T-021 (E2E Test)
│   └── T-024 (Accessibility Audit)
├── T-020 (Hybrid Framework Viewer)
│   └── T-024 (Accessibility Audit)
├── T-021 (E2E Test)
├── T-022 (Phase Detection Unit Test)
├── T-025 (Documentation)
├── T-026 (Database Seeds)
├── T-027 (Staging Deployment)
│   └── T-028 (Release)
```

---

## Estimation Summary

**Total Story Points:** ~100 points (13–16 week effort at typical 8pt/week velocity)

**Breakdown:**
- Schema & Types: 8pt
- Clinical Frameworks: 25pt
- Intake System: 13pt
- Session Integration: 11pt
- Frontend: 13pt
- Testing: 16pt
- Documentation & Deployment: 10pt
- Buffer (10%): 10pt

**Recommended Sprint Structure:**
- **Sprint 1 (2 weeks):** T-001 through T-009 (Foundation + Frameworks)
- **Sprint 2 (2 weeks):** T-010 through T-016 (Intake System + API)
- **Sprint 3 (2 weeks):** T-017 through T-020 (Phase Detection + Frontend)
- **Sprint 4 (1.5 weeks):** T-021 through T-028 (Testing + Deployment)

---

## Quality Gates

Before each task merges:
- [ ] Code review (peer, +1 approval)
- [ ] TypeScript strict mode passes
- [ ] Unit tests pass (if applicable)
- [ ] Linter passes (ESLint, Prettier)
- [ ] No security issues (dependency audit)

Before Phase 2 release:
- [ ] All tasks complete (28/28)
- [ ] E2E test passes (T-021)
- [ ] Accessibility audit passes (T-024)
- [ ] Staging QA sign-off (T-027)
- [ ] Documentation complete (T-025)
- [ ] Release notes published (T-028)

---

## Rollback Plan

If critical issues found in production:
1. Revert to previous stable commit (git revert)
2. Set `NEXT_PUBLIC_INTAKE_DISABLED=true` (feature flag) to disable intake UI
3. Sessions proceed without case formulation (backward compatible)
4. Investigate + fix issue on development branch
5. Re-deploy once verified in staging

---

## Success Metrics

By end of Phase 2:
- ✅ Students can complete structured intake (avg. 3–4 min)
- ✅ Case formulation returned in <5 seconds
- ✅ Session guidance panel updates with protocol phases
- ✅ Students see 4–6 phase transitions during a typical 25-turn session
- ✅ Feedback includes case formulation context
- ✅ Turkish language fully supported
- ✅ Academic rigor maintained (all frameworks peer-reviewed)
- ✅ Zero accessibility violations (WCAG 2.1 AA)
