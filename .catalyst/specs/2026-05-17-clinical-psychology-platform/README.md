# Clinical Psychology Platform — Phase 2 Specification

**Spec ID:** 2026-05-17-clinical-psychology-platform  
**Status:** DRAFT → Ready for `/forge-spec`  
**Phase:** 2 (Clinical Intelligence Engine)  
**Language:** English + Turkish (all AI responses)  

---

## Documents in This Spec

1. **`spec.md`** — High-level design (20 min read)
   - Overview of 3 interconnected systems (intake, case formulation, protocol phases)
   - Requirements, acceptance criteria, technical approach
   - User stories, data model, API changes, UI components
   - Out of scope, open questions, academic references

2. **`research.md`** — Academic & codebase analysis (15 min read)
   - Part A: Codebase analysis (current architecture, integration points)
   - Part B: Clinical framework analysis (5 therapeutic approaches with peer-reviewed research)
   - Part C: Intake questionnaire design (PHQ-9, GAD-7, approach recommendation logic)
   - Part D: Phase detection strategy (turn-based + async content-aware options)
   - Part E: Codebase integration path (file changes, backward compatibility)
   - Part F: Academic references

3. **`tasks.md`** — Granular implementation breakdown (28 tasks, ~100 story points)
   - T-001 to T-028: each task has description, acceptance criteria, dependencies
   - Grouped by phase: Schema → Frameworks → Intake → Session Integration → Frontend → Testing → Deployment
   - Dependency graph, estimation summary, sprint structure recommendation
   - Quality gates, rollback plan, success metrics

4. **`handoff.md`** — Living implementation guide
   - Quick start for builders
   - Common pitfalls + solutions
   - Testing checklist
   - Code style standards
   - FAQ & escalation path
   - Future enhancements (post-Phase 2)
   - Deployment checklist

---

## The Vision

**Phase 2 elevates PSKO from a basic chat simulation to an academically grounded clinical training environment.**

Three core systems:

### 1. Intake → Case Formulation

Before starting a session, students complete a brief structured intake (PHQ-9 + GAD-7 + 3 open-ended questions). Claude analyzes the responses and generates:
- **Case formulation** (150–250 word clinical narrative)
- **Symptom severity scores** (PHQ-9 for depression, GAD-7 for anxiety)
- **Recommended therapeutic approaches** (2–3 with clinical rationales)

**Pedagogical benefit:** Students learn to synthesize clinical information and understand why certain approaches fit certain cases.

### 2. Protocol Phases

Each therapeutic approach is decomposed into 4–6 sequential phases:

- **CBT** (Beck): Engagement → Assessment → Formulation → Intervention → Consolidation
- **Psychodynamic** (Luborsky CCRT): Rapport → Exploratory Listening → Pattern Recognition → Transference → Integration
- **ACT** (Hayes): 6 core processes (non-sequential): Acceptance, Defusion, Present-Moment, Self-as-Context, Values, Committed Action
- **DBT** (Linehan): Stabilization → Emotional Processing → Ordinary Happiness → Maintenance
- **Humanistic** (Rogers): Presence & Acceptance → Deepening → Heightened Awareness & Challenge

Each phase has defined objectives, key techniques, watchpoints, and transition criteria — all grounded in peer-reviewed academic sources.

**Pedagogical benefit:** Students learn that therapeutic sessions have structure and intentionality. They see the progression from "building rapport" to "challenging distorted thoughts" rather than just chatting randomly.

### 3. Dynamic Session Guidance

During a session, the right guidance panel shows:
- Current protocol phase (e.g., "Phase 2: Assessment")
- Clinical objective for this phase
- Recommended next move (specific, actionable technique)
- Watchpoint (one key thing to notice)
- Progress bar (where you are in the session)

Guidance updates every 5 turns or when phase transitions detected.

**Pedagogical benefit:** Students get real-time, phase-specific coaching. They can see exactly what they should be doing in each part of the session.

---

## Key Features

✅ **Intake Questionnaire**
- 9 PHQ-9 items (depression screening)
- 7 GAD-7 items (anxiety screening)
- 3 open-ended questions (presenting problem, duration, impact)
- Completion time: 3–4 minutes

✅ **Case Formulation Engine**
- Claude-generated clinical summary
- Approach recommendation logic (not rule-based, respects clinical nuance)
- Integrated into session AI system prompt as CASE_CONTEXT

✅ **Protocol Phase Definitions**
- 5 approaches × 4–6 phases = 22 phase definitions
- All peer-reviewed, academically grounded
- Student-actionable language ("Ask Socratic questions", not "Use Socratic method")

✅ **Dynamic Guidance Panel**
- Replaces static hints
- Phase-aware (updates every 5 turns)
- Approach-specific color scheme
- Phase transition history (expandable)

✅ **Hybrid Framework Viewer** (Optional)
- Dashboard page: "How would each approach see this case?"
- Comparative view across 5 therapeutic approaches
- Read-only reference, not used during session

✅ **Turkish Language Support**
- All UI strings, phase definitions, guidance in Turkish
- AI responses default to Turkish (system prompt)
- User language preference respected throughout

✅ **Enriched Personas**
- Cognitive model extended with clinical anchors
- SCID-5 aligned: symptom onset, functional impairment, trauma flags, prior treatment

---

## What's NOT Included (Out of Scope)

- Full SCID-5 diagnostic interview (this is training, not clinical assessment)
- Storing or displaying PHQ-9/GAD-7 as clinical diagnoses
- Voice interface (Phase 4)
- Avatar / video simulation (Phase 4)
- Educator dashboard / cohort management (Phase 3)
- Crisis protocols (Phase 5)
- Content-aware phase detection (turn-count baseline only; async Claude call optional enhancement)

---

## Integration with Existing Code

✅ **Backward Compatible**
- Intake is optional (existing session flow unchanged)
- ApproachConfig.phases is optional (existing approaches work without)
- No breaking changes to Session, Message, Persona models

✅ **Reuses Existing Patterns**
- Session streaming, persona system prompts (unchanged)
- RoleMode support (THERAPIST vs. CLIENT, existing)
- SupervisorFeedback + ClientDebrief (can reference case formulation)

✅ **New Integrations**
- Prisma: add IntakeResponse model + Session.currentPhase
- API: add /intake/analyze, /session/[id]/phase
- Types: add ProtocolPhase, CaseFormulation, PhaseGuidance interfaces
- Components: add IntakeFlow, CaseFormulationReview, refactor SessionGuidancePanel

---

## Implementation Roadmap

**28 tasks grouped into phases:**

1. **Schema & Types** (T-001 to T-003): 8 story points
2. **Clinical Frameworks** (T-004 to T-009): 25 story points
3. **Intake System** (T-010 to T-014): 13 story points
4. **Session Integration** (T-015 to T-020): 24 story points
5. **Testing** (T-021 to T-024): 16 story points
6. **Deployment** (T-025 to T-028): 10 story points

**Recommended timeline:**
- 4 sprints × 2 weeks = 8 weeks (13–16 week effort at 8pt/week velocity)

**Critical path:** T-001 → T-002 → T-003 → T-009 → T-014 → T-015 → T-019

---

## Academic Rigor

All frameworks backed by peer-reviewed sources:

- **Beck, J.S. (2020)** — *Cognitive Behavior Therapy: Basics and Beyond*
- **Hayes, S.C. et al. (2012)** — *Acceptance and Commitment Therapy*
- **Linehan, M.M. (2014)** — *DBT Skills Training Manual*
- **Luborsky, L. (1984)** — *Principles of Psychoanalytic Psychotherapy*
- **Rogers, C.R. (1961)** — *On Becoming a Person*
- **Shedler, J. (2010)** — "The efficacy of psychodynamic psychotherapy" (*American Psychologist*)

Every phase definition includes a source citation. Educational disclaimers applied: "This is a training tool, not a clinical assessment."

---

## Success Metrics (Phase 2 Complete)

✅ Students can complete intake in 3–4 minutes  
✅ Case formulation returned in <5 seconds  
✅ Session guidance panel updates with protocol phases every 5 turns  
✅ Students see 4–6 phase transitions during a typical 25-turn session  
✅ Feedback summary includes case formulation context  
✅ Turkish language fully supported (all AI responses, UI, guidance)  
✅ Zero accessibility violations (WCAG 2.1 AA)  
✅ Academic rigor maintained (all frameworks peer-reviewed)  

---

## Next Steps

1. **Review spec**: Confirm requirements align with vision
2. **Run `/forge-spec @2026-05-17-clinical-psychology-platform`**: Begins TDD implementation
   - Test-Driven Development: Write tests FIRST (red), implement (green), refactor
3. **Follow task breakdown** in `tasks.md`: 28 tasks, dependency-ordered
4. **Refer to `handoff.md`**: Common pitfalls, testing checklist, code standards

---

**Spec ready for `/forge-spec` Phase 2 implementation.**

Turkish language support documented. Academic rigor maintained. Implementation tasks clear and actionable.
