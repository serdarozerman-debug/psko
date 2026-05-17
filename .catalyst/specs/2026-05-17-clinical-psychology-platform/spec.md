---
spec: 2026-05-17-clinical-psychology-platform
status: complete
validated_at: 2026-05-18
domain: simulation
phase: 2
language: English + Turkish (all AI responses)

provides:
  - Intake questionnaire system (PHQ-9 + GAD-7 inspired, 12-15 items)
  - Case formulation engine (Claude-generated clinical summary from intake)
  - Automatic therapeutic approach recommendation with rationale
  - Protocol phase definitions for all 5 therapeutic approaches (CBT, Psychodynamic, ACT, DBT, Humanistic)
  - Dynamic session guidance panel (real-time protocol phase + recommended next move)
  - Enriched persona system with clinical anchors (SCID-5 aligned)
  - Phase detection engine (turn-based + lightweight content-aware Claude calls)
  - Hybrid framework templates (case conceptualization per approach)
  - Turkish language support throughout (UI + AI responses)

requires:
  - spec: 2026-05-16-simulation-mvp
    needed: Session infrastructure, persona engine, message streaming, approach modules, RoleMode support

affects:
  - Prisma schema: add IntakeResponse, SessionPhase, extend Session with currentPhase
  - API routes: add /intake/analyze, /session/[id]/phase, /session/[id]/advance-phase
  - TypeScript types: add ProtocolPhase, IntakeFormResponse, CaseFormulation, PhaseGuidance
  - Frontend components: IntakeFlow, SessionGuidancePanel (replace static hints)
  - Approach modules: extend with ProtocolPhase[] definitions
  - Personas data: enrich cognitive model with clinicalAnchors
  - Claude prompts: inject case formulation + phase context into system prompts
  - Session start flow: intake → case formulation → approach confirmation → session launch

patterns_established:
  - Protocol phase definitions follow academic clinical frameworks (Beck, Luborsky, Hayes, Linehan, Rogers)
  - Case formulation is Claude-generated, not rule-based (respects clinical complexity)
  - Intake scores (PHQ-9, GAD-7) are educational tools only — never presented as clinical diagnoses
  - Phase detection uses turn-count baseline + optional content-aware refinement
  - All AI responses honor Turkish language support (user preference)
  - Hybrid framework approach: clinically grounded but educationally appropriate (training tool, not diagnostic)

key_files:
  - psko-app/prisma/schema.prisma                                  # IntakeResponse model + Session.currentPhase
  - psko-app/prisma/migrations/20260516212341_add_clinical_intelligence_engine
  - psko-app/src/types/index.ts                                    # ProtocolPhase, CaseFormulation, IntakeQuestion, PhaseGuidance
  - psko-app/src/lib/clinical/frameworks/cbt.ts
  - psko-app/src/lib/clinical/frameworks/psychodynamic.ts
  - psko-app/src/lib/clinical/frameworks/act.ts
  - psko-app/src/lib/clinical/frameworks/dbt.ts
  - psko-app/src/lib/clinical/frameworks/humanistic.ts
  - psko-app/src/lib/clinical/frameworks/index.ts                  # ALL_FRAMEWORKS + getClinicalFramework
  - psko-app/src/lib/clinical/intake/questions.ts                  # PHQ-9 + GAD-7 + open + score helpers
  - psko-app/src/lib/clinical/intake/formulation.ts                # Claude-driven CaseFormulation builder
  - psko-app/src/lib/clinical/phase-engine/detect-phase.ts         # Turn-count phase detection
  - psko-app/src/app/api/intake/analyze/route.ts
  - psko-app/src/app/api/session/start/route.ts                    # Intake-aware session creation
  - psko-app/src/app/api/session/message/route.ts                  # Threads clinicalContext per turn
  - psko-app/src/app/api/session/phase/route.ts                    # Phase guidance polling + lazy persist
  - psko-app/src/components/intake/IntakeFlow.tsx                  # 4-step wizard with folded-in formulation review
  - psko-app/src/components/simulation/SessionGuidancePanel.tsx

key_decisions:
  - Intake is optional but strongly encouraged (users can skip to direct session start)
  - Intake responses persist per-session (not stored globally — ephemeral)
  - Phase detection is asynchronous, non-blocking (updates UI without request lag)
  - No hard-coded if/else rules for approach recommendation (Claude synthesizes clinical picture)
  - SCID-5 aligned persona enrichment focuses on onset timeline, functional impairment, trauma flags (not full diagnostic interview)
  - Turkish language support applies to all AI-generated outputs, guidance text, and feedback
  - Hybrid framework allows students to see how different schools of thought conceptualize the same case
---

# Clinical Psychology Platform — Phase 2

> Status: COMPLETE (validated 2026-05-18 — see validation.md, handoff.md)

## Overview

Elevate PSKO from a basic chat simulation to an academically grounded clinical training environment. Three interconnected systems:

1. **Intake → Case Formulation** — Pre-session structured intake (PHQ-9 + GAD-7 inspired) analyzed by Claude to generate a clinical case formulation summary and recommend the most appropriate therapeutic approach(es) for the presented symptom profile.

2. **Protocol Phase Framework** — Each therapeutic approach is decomposed into 4–6 sequential clinical phases (e.g., CBT: Engagement → Assessment → Formulation → Intervention → Consolidation). Each phase has defined objectives, key techniques, watchpoints, and transition criteria grounded in peer-reviewed clinical literature.

3. **Dynamic Session Guidance** — During simulation, the right guidance panel shows real-time phase progression, recommended next clinical move, and specific technique suggestion — updated every 5 turns via lightweight async phase detection.

**Pedagogical Foundation:** Students learn that clinical training has structure and intentionality. By seeing protocol phases progress, students internalize evidence-based session pacing and recognize when they've moved from exploration to intervention. Case formulation grounds every session in the specific clinical presentation, not just generic "patient" behavior.

**Turkish Language Support:** All AI-generated outputs, guidance text, feedback summaries, and phase descriptions honor the user's language preference (default Turkish for all AI responses, per Phase 1 implementation).

## User Stories

- As a student, I want to fill in a brief structured intake (5 minutes) before choosing a patient so the system can recommend the most clinically appropriate approach for that case
- As a student, I want to see a case formulation summary (clinical picture, key presenting issues, functional impairment level) before I start so I understand what I'm walking into clinically
- As a student, I want the session guidance panel to show me which protocol phase I'm in (e.g., "Phase 2: Assessment — Elicit automatic thoughts") so I can follow a clinically structured session, not just chat randomly
- As a student, I want the guidance panel to suggest my next clinical move based on what's already happened in the session, not generic hints
- As a student, I want to understand how different therapeutic approaches would conceptualize the same case, so I learn to think like a clinician (hybrid framework option)
- As an educator, I want to see that students can conduct structured intakes and follow evidence-based protocol phases, so I can assess their readiness for supervised practice

## Requirements

### Functional

- [ ] REQ-001: Intake questionnaire (11 items: 9 PHQ-9 + 7 GAD-7 adapted, 3 open-ended) with <3 minute completion target
- [ ] REQ-002: Claude analyzes intake → JSON output: `{ caseFormulation: string, phq9Score: number, gad7Score: number, recommendedApproaches: [{name: string, rationale: string, contraindications?: string}], primaryConcerns: string[], functionalImpairment: string }`
- [ ] REQ-003: Student reviews case formulation + recommended approach(es), confirms or overrides before session starts
- [ ] REQ-004: Case formulation injected into session AI system prompt under `CASE_CONTEXT` section
- [ ] REQ-005: Prisma schema: add `IntakeResponse` model (sessionId, responses JSON, formulation JSON, recommendedApproach string, createdAt)
- [ ] REQ-006: Prisma schema: extend `Session` with `currentPhase Int` (0–5), `intakeResponseId` foreign key
- [ ] REQ-007: Each therapeutic approach defines 4–6 ProtocolPhase objects: `{ index, name, objective, techniques: string[], watchFor: string[], triggerTurnMin, transitionSignal?: string }`
- [ ] REQ-008: Session guidance panel displays: phase name, clinical objective, next recommended technique, watchpoint for this phase
- [ ] REQ-009: Phase progression triggered by: (a) turn count thresholds, (b) optional async Claude call every 5 turns to detect content-based phase readiness
- [ ] REQ-010: Persona `cognitiveModel` extended with `clinicalAnchors: { symptomsOnset, functionalImpairment, traumaHistory?, medicalHistory?, previousTreatment? }`
- [ ] REQ-011: Hybrid framework mode: allow students to see how CBT vs. Psychodynamic vs. ACT would each conceptualize the same case (separate read-only framework view, not during session)
- [ ] REQ-012: All AI-generated text (case formulation, guidance, feedback) respects user language preference (Turkish default per Phase 1)

### Non-Functional

- [ ] PERF-001: Intake form submission to case formulation return < 5 seconds (Claude call)
- [ ] PERF-002: Phase detection (async, every 5 turns) adds < 1 second latency; non-blocking UI update
- [ ] PERF-003: Intake questionnaire UI renders < 500ms
- [ ] UX-001: Intake form max 3 screens / single scrollable page with progress indicator
- [ ] UX-002: Case formulation summary displayed in 150–250 words, scannable (bullet points + 1 short paragraph)
- [ ] UX-003: Guidance panel updates visually when phase changes (smooth color transition, highlight)
- [ ] EDU-001: All framework phase definitions cite peer-reviewed sources (Beck 2020, Luborsky 1984, Hayes 2012, Linehan 2014, Rogers 1961)
- [ ] EDU-002: Phase detection rationale logged (students can see why phase advanced)
- [ ] LANG-001: Turkish translations for all UI strings, framework definitions, guidance text, phase names
- [ ] LANG-002: AI responses default to Turkish (system prompt: "Respond in Turkish unless user specifies English")

### Data Model (Type Extensions)

```typescript
export interface ProtocolPhase {
  index: number                       // 0–5
  name: string                        // e.g., "Phase 1: Engagement & Rapport"
  objective: string                   // Clinical goal for this phase
  techniques: string[]                // Specific techniques recommended (e.g., "Open-ended questions", "Validation")
  watchFor: string[]                  // Warning signs / diagnostic cues to notice
  triggerTurnMin: number              // Earliest turn to transition into this phase
  transitionSignal?: string           // Content cue that suggests readiness (e.g., "patient discloses core belief")
  source?: string                     // Academic source (e.g., "Beck 2020, Cognitive Therapy Basics")
}

export interface CaseFormulation {
  presentingIssues: string[]          // Primary and secondary concerns
  phq9Score: number                   // 0–27 (depression screening)
  gad7Score: number                   // 0–21 (anxiety screening)
  functionalImpairment: string        // "Mild" | "Moderate" | "Severe" (work/relationships/self-care)
  clinicalPicture: string             // 150–250 word narrative formulation
  recommendedApproaches: Array<{
    name: TherapeuticApproach
    rationale: string                 // Why this approach fits (e.g., "Depression + anxiety suggests CBT")
    contraindications?: string        // When to avoid (e.g., "Avoid DBT without crisis history")
  }>
  riskFactors?: string[]              // "Suicidality" | "Substance use" | "Trauma" (flagged, not detailed)
}

export interface IntakeResponse {
  id: string
  sessionId: string
  responses: {
    [key: string]: number | string    // Item responses + open-ended answers
  }
  formulation: CaseFormulation
  recommendedApproach: TherapeuticApproach  // Student's selection
  studentOverrideReason?: string      // If student chose different approach than recommended
  createdAt: Date
}

export interface PhaseGuidance {
  currentPhaseIndex: number
  currentPhase: ProtocolPhase
  progressPercent: number             // 0–100 based on turn count
  nextTechniqueHint: string           // Specific action ("Reflect back what you've heard about their core belief")
  watchpoint: string                  // One key thing to notice in this phase
  phaseTransitionJustification?: string // Why we advanced from previous phase
}

export interface ApproachConfig extends existing {
  id: TherapeuticApproach
  phases: ProtocolPhase[]             // 4–6 phases
  caseConceptualizationTemplate: string // Narrative framework for this approach
  keyTheoretical: string[]            // Theoretical anchors (e.g., for CBT: "Beck's cognitive model", "Automatic thought ↔ emotion ↔ behavior triangle")
}
```

## Acceptance Criteria

1. ✅ Student fills intake → sees case formulation (150–250 words) + 2–3 approach recommendations with rationales → confirms approach
2. ✅ Session starts with: "(Therapist name), based on intake, you're working with a (age)-year-old presenting with (primary issues). Clinical picture: (formulation). Your task: apply (approach) to support them."
3. ✅ During session, guidance panel shows current phase name, clinical objective, next recommended move, and one watchpoint
4. ✅ Phase advances automatically every 5 turns (or when content signal detected); UI highlights new phase with brief justification
5. ✅ Each approach module has 4–6 defined phases with techniques + watchpoints + source citations
6. ✅ Persona opening message contextualizes the case formulation (not just generic backstory)
7. ✅ Feedback summaries reference the case formulation and protocol phases ("In Phase 2, you missed an opportunity to elicit automatic thoughts")
8. ✅ Hybrid framework mode accessible from dashboard: read-only view showing how each approach would conceptualize the same case
9. ✅ All guidance, phase names, and formulations can be viewed in Turkish (user language preference)

## Technical Approach

### 1. Intake System

**New component:** `IntakeFlow` (3-screen form)
- Screen 1: PHQ-9 items (9 buttons, 0–3 scale)
- Screen 2: GAD-7 items (7 buttons, 0–3 scale)
- Screen 3: Open-ended (Presenting problem? Duration? How is it affecting work/relationships? Any prior treatment?)

**API:** `POST /api/intake/analyze`
- Input: intake form responses (JSON)
- Claude call: Analyze responses → generate case formulation + approach recommendations
- Output: `IntakeResponse` object
- Storage: Save to DB + attach to session (not global)

**Error handling:** If Claude call fails, offer 2 fallback approaches based on PHQ-9 + GAD-7 scores (rule-based backup)

### 2. Protocol Phase Definitions

**File structure:**
```
src/lib/clinical/
├── frameworks/
│   ├── cbt.ts          # Beck's 5-phase model
│   ├── psychodynamic.ts # CCRT + 5-phase model
│   ├── act.ts           # ACT's 6 core processes (non-sequential)
│   ├── dbt.ts           # DBT's 4 stages
│   └── humanistic.ts    # Rogers' 3-phase empathy progression
├── intake/
│   ├── questions.ts     # Question bank (PHQ-9 + GAD-7 + open-ended)
│   └── analyzer.ts      # analyzeIntake(responses) → Claude call
└── phase-engine/
    ├── detect.ts        # detectPhase(transcript, approach, turnCount) → phase recommendation
    └── schema.ts        # ProtocolPhase, PhaseGuidance types
```

**Each framework exports:**
```typescript
export const cbtFramework: FrameworkDefinition = {
  approach: 'cbt',
  phases: [
    {
      index: 0,
      name: 'Engagement & Socialization',
      objective: 'Build rapport and introduce CBT model',
      techniques: ['Validation', 'Normalizing', 'Explaining CBT', 'Agenda setting'],
      watchFor: ['Does client seem receptive to CBT?', 'Any early signs of resistance?'],
      triggerTurnMin: 0,
      source: 'Beck (2020), Cognitive Therapy Basics & Beyond'
    },
    // ... phases 1–4
  ],
  caseConceptualizationTemplate: `...`,
  theoreticalAnchors: ['Automatic thought ↔ emotion ↔ behavior', '...']
}
```

### 3. Phase Detection Engine

**Simple mode (default):**
```typescript
function getPhaseByTurnCount(turnCount: number, approach: TherapeuticApproach): number {
  const thresholds = {
    cbt:          [0, 3, 8, 15, 22],  // Phases 0–4
    psychodynamic: [0, 3, 8, 15, 22],
    // ... per approach
  }
  return thresholds[approach].findIndex((min, i) => turnCount >= min) || 4
}
```

**Advanced mode (async, every 5 turns):**
```typescript
async function detectPhaseAdvanced(
  transcript: Message[],
  approach: TherapeuticApproach,
  currentPhase: ProtocolPhase
): Promise<{ phaseIndex: number; rationale: string }> {
  const call = await claude.messages.create({
    system: `You are a clinical supervisor. Analyze the transcript and determine if the session should advance to the next phase in ${approach}.
    Current phase: ${currentPhase.name}.
    Return JSON: { phaseIndex: number, rationale: string }`,
    messages: [{ role: 'user', content: generateTranscriptSummary(transcript) }],
    max_tokens: 150
  })
  return JSON.parse(call.content[0].text)
}
```

**API:** `GET /api/session/[id]/phase`
- Returns: current `PhaseGuidance` object (phase index, name, objective, next technique, watchpoint)
- Called after each message (or every 5 turns for advanced detection)

### 4. Session System Prompt Injection

**Before:**
```
You are [PersonaName], a [age]-year-old seeking psychological support.
COGNITIVE MODEL: [core beliefs, automatic thoughts, emotional state, ...]
CONVERSATIONAL STYLE: [style description]
BEHAVIORAL RULES: [stay in character, do NOT use clinical jargon, ...]
```

**After (with case formulation):**
```
You are [PersonaName], a [age]-year-old seeking psychological support.

CASE CONTEXT (for AI's internal reference):
Clinical presentation: [formulation clinical picture]
PHQ-9 score: [X/27] (depression screening)
GAD-7 score: [Y/21] (anxiety screening)
Primary concerns: [concern 1], [concern 2]
Functional impairment: [level]
Recommended approach: [approach] (student selected this)

COGNITIVE MODEL: [core beliefs, automatic thoughts, emotional state, ...]
CONVERSATIONAL STYLE: [style description]
BEHAVIORAL RULES: [stay in character, do NOT use clinical jargon, ...]

CURRENT SESSION CONTEXT:
Protocol phase: [Phase name] (e.g., "Phase 2: Assessment")
Phase objective: [objective]
Therapist is using: [approach]
[Approach-specific instructions]
```

### 5. Prisma Schema Changes

**New model:**
```prisma
model IntakeResponse {
  id               String   @id @default(uuid())
  sessionId        String   @unique @map("session_id")
  responses        Json     // Raw intake form responses
  formulation      Json     // CaseFormulation object
  recommendedApproach String @map("recommended_approach")
  studentApproach  String   @map("student_approach")  // What student selected
  overrideReason   String?  @map("override_reason")   // If different from recommended
  createdAt        DateTime @default(now()) @map("created_at")
  
  session          Session  @relation(fields: [sessionId], references: [id])
  
  @@map("intake_responses")
}
```

**Extended Session model:**
```prisma
model Session {
  // ... existing fields ...
  currentPhase     Int?        @map("current_phase")     // 0–5, null before intake
  intakeResponseId String?     @unique @map("intake_response_id")
  
  // ... existing relations ...
  intakeResponse   IntakeResponse?
}
```

### 6. API Routes

**`POST /api/intake/analyze`**
- Input: `{ responses: Record<string, number | string> }`
- Logic:
  1. Call Claude: analyze responses → generate CaseFormulation JSON
  2. Parse JSON (with fallback if malformed)
  3. Return `{ caseFormulation: CaseFormulation, recommendedApproaches: [...] }`
- Timeout: 5s
- Error handling: Return rule-based backup recommendations if Claude fails

**`POST /api/session/start` (UPDATED)**
- Input: `{ personaId, therapeuticApproach, roleMode, intakeResponseId? }`
- Logic:
  1. If `intakeResponseId`: fetch formulation, inject into system prompt
  2. Create Session with `currentPhase = 0`, `intakeResponseId`
  3. Build enhanced persona system prompt (with CASE_CONTEXT)
  4. Return session + opening AI statement
- Unchanged: streaming response structure

**`GET /api/session/[id]/phase` (NEW)**
- Returns: `PhaseGuidance` (current phase index, name, objective, next technique, watchpoint)
- Called by guidance panel component after each message (or poll every 5 turns for efficiency)

**`POST /api/session/[id]/advance-phase` (NEW)**
- Input: `{ toPhaseIndex: number }`
- Logic: Update `Session.currentPhase`, log phase transition
- Returns: new `PhaseGuidance`
- Called by phase detection engine or manual override (admin/educator)

### 7. Frontend Components

**`IntakeFlow` (new)**
- 3-screen form (or 1 scrollable page)
- Screen 1: PHQ-9 (9 items, 0–3 buttons per item)
- Screen 2: GAD-7 (7 items, 0–3 buttons per item)
- Screen 3: Open-ended text fields (presenting problem, duration, impact, prior treatment)
- "Next" / "Back" / "Submit" buttons
- Sends to `/api/intake/analyze` on submit
- Shows loading state ("Analyzing clinical picture...")
- Returns: case formulation summary + approach recommendations

**`CaseFormulationReview` (new)**
- Displays 150–250 word case formulation (markdown-rendered)
- Shows 2–3 recommended approaches with rationales
- "This looks right" button → confirms approach, opens persona selector
- "I'd prefer" button → manual approach override with optional explanation text
- "Skip intake" button (if intake is optional) → direct to persona selector without formulation

**`SessionGuidancePanel` (refactored from static hints)**
- Subscribes to `/api/session/[id]/phase` every 5 turns (or on message)
- Displays:
  - Phase name + index (e.g., "Phase 2 of 4: Assessment")
  - Phase progress bar (visual indicator of how far into session)
  - Clinical objective (1–2 sentences)
  - "Next move" (specific technique suggestion)
  - "Watch for" (one watchpoint for this phase)
  - Phase transition history (expandable: "Phase 0 → 1 at turn 3")
- Smooth color transitions when phase changes
- Approach-specific color scheme (CBT = blue, PDT = purple, ACT = green, etc.)

**`HybridFrameworkViewer` (new, optional)**
- Dashboard sub-page: "How different approaches would see this case"
- Read-only view: for each of 5 approaches, show:
  - Approach name + key theoretical anchor
  - How this approach would conceptualize the presenting case
  - Phase structure for this approach (table: phase → objective → key techniques)
- Accessible from dashboard, not during session

### 8. Turkish Language Support

**Key files to update:**
- `src/lib/clinical/frameworks/*.ts` — all phase names, objectives, techniques in Turkish + English
- `src/app/api/intake/analyze` — Claude system prompt includes: "Respond in Turkish"
- `IntakeFlow` component — all labels, buttons, instructions in Turkish
- `SessionGuidancePanel` — all phase names, techniques, watchpoints in Turkish
- Supervisor agent prompt — "Provide feedback in Turkish" if user preference is Turkish

**Implementation:**
```typescript
// In session/start route:
const lang = user.languagePreference || 'tr' // Default Turkish per Phase 1

const systemPrompt = `
[... existing persona prompt ...]

LANGUAGE: ${lang === 'tr' ? 'Turkish (Türkçe)' : 'English'}
${lang === 'tr' ? 'Lütfen tüm yanıtları Türkçe olarak verin.' : 'Please respond in English.'}
`
```

## Out of Scope

- Full SCID-5 diagnostic interview (this is training, not clinical assessment)
- Storing or displaying PHQ-9/GAD-7 scores as clinical diagnoses
- Voice interface (Phase 4 feature)
- Avatar / video simulation (Phase 4 feature)
- Educator dashboard / cohort management (Phase 3 feature)
- Crisis protocols (Phase 5 feature)
- Persona customization by educators (Phase 3 feature)

## Open Questions

1. Should intake be optional or mandatory? **Recommendation:** Optional but strongly encouraged (users can skip to direct session)
2. Should intake responses persist globally (reuse with different personas) or per-session only? **Recommendation:** Per-session ephemeral (fresh intake per persona maintains clinical precision)
3. Should phase detection use only turn-count thresholds or also async content-based detection? **Recommendation:** Start with turn-count (simple, performant); add async detection if needed
4. Should students see the phase detection rationale? **Recommendation:** Yes, expand phase transition history in guidance panel for learning
5. Should hybrid framework viewer be pre-session (help students decide which approach to try) or post-session (reflection)? **Recommendation:** Pre-session (help students understand approach fit)
6. How should we handle cases where no approach is clearly "recommended"? **Recommendation:** Present all 5 as equally valid; explain why each has merit for this case

## References

- Beck, J.S. (2020). *Cognitive Behavior Therapy: Basics and Beyond* (3rd ed.). Guilford Press.
- Hayes, S.C., Strosahl, K., & Wilson, K.G. (2012). *Acceptance and Commitment Therapy* (2nd ed.). Guilford Press.
- Linehan, M.M. (2014). *DBT Skills Training Manual* (2nd ed.). Guilford Press.
- Luborsky, L. (1984). *Principles of Psychoanalytic Psychotherapy*. Basic Books.
- Persons, J.B. (2008). *The Case Formulation Approach to CBT*. Guilford Press.
- Rogers, C.R. (1961). *On Becoming a Person*. Houghton Mifflin.
- Shedler, J. (2010). The efficacy of psychodynamic psychotherapy. *American Psychologist*, 65(2), 98.
