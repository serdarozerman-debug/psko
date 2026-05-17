# Pattern: Therapeutic Framework System

> Extracted from: `2026-05-17-clinical-psychology-platform`
> Extracted: 2026-05-18
> Domain: simulation, clinical-ai

## Summary

A pattern for defining structured therapeutic protocol phases per clinical approach, with a lightweight turn-count-based phase detection engine. Each approach (CBT, Psychodynamic, ACT, DBT, Humanistic) is decomposed into 4–6 sequential phases with objectives, techniques, watchpoints, and academic citations. A phase engine tracks progression through the session.

## When to Use

- Clinical training simulators where students should follow an evidence-based session structure
- Any AI conversation tool that needs to track "where are we in the protocol?" over time
- Applications that want to surface approach-specific guidance without requiring continuous AI calls

## Framework Structure

### ProtocolPhase Type

```typescript
interface ProtocolPhase {
  index: number                // 0-based
  name: string                 // "Phase 1: Assessment"
  objective: string            // Clinical goal for this phase
  techniques: string[]         // 5–8 actionable techniques ("Ask Socratic questions")
  watchFor: string[]           // 3–5 diagnostic/behavioral cues
  triggerTurnMin: number       // Earliest turn to enter this phase
  transitionSignal?: string    // Content cue that suggests phase readiness
  source?: string              // Academic citation
}
```

### Framework Definition Per Approach

Each approach exports a `FrameworkDefinition`:

```typescript
interface FrameworkDefinition {
  approach: TherapeuticApproach
  phases: ProtocolPhase[]
  caseConceptualizationTemplate: string  // ~200 word narrative template
  keyTheoretical: string[]               // 3–5 theoretical anchors
}
```

**Key files:** `src/lib/clinical/frameworks/`
- `cbt.ts` — Beck's 5-phase model (Engagement, Assessment, Formulation, Intervention, Consolidation)
- `psychodynamic.ts` — Luborsky CCRT 5-phase model (Rapport, Exploratory Listening, Pattern Recognition, Transference, Integration)
- `act.ts` — Hayes' 6 core processes (non-sequential: Acceptance, Defusion, Present-Moment Awareness, Self-as-Context, Values, Committed Action)
- `dbt.ts` — Linehan's 4-stage model (Stabilization, Emotional Processing, Ordinary Happiness, Maintenance)
- `humanistic.ts` — Rogers' 3-phase empathy progression (Presence & Acceptance, Deepening, Heightened Awareness & Challenge)
- `index.ts` — `ALL_FRAMEWORKS` map + `getClinicalFramework(approach)` helper

### Phase Detection Engine

**Key file:** `src/lib/clinical/phase-engine/detect-phase.ts`

Turn-count based (default, performant):
```typescript
function detectPhaseByTurnCount(
  turnCount: number,
  approach: TherapeuticApproach
): number {
  // Approach-specific turn thresholds
  // e.g., CBT: [0, 3, 8, 15, 22]
  // Returns phase index (0 to N-1)
}
```

Content-aware (async, optional — every 5 turns):
```typescript
async function detectPhaseAdvanced(
  transcript: Message[],
  approach: TherapeuticApproach,
  currentPhase: ProtocolPhase
): Promise<{ phaseIndex: number; rationale: string }>
```

The async variant calls Claude with a transcript summary to detect content-based phase readiness. It is non-blocking and does not gate message delivery.

### Phase Guidance Output

```typescript
interface PhaseGuidance {
  currentPhaseIndex: number
  currentPhase: ProtocolPhase
  progressPercent: number            // 0–100, based on turn count
  nextTechniqueHint: string          // Specific, actionable suggestion
  watchpoint: string                 // One key thing to notice now
  phaseTransitionJustification?: string
}
```

**Route:** `GET /api/session/[id]/phase` — returns PhaseGuidance, query-only, no AI calls.

## Turn Threshold Reference (by Approach)

| Approach | P0 | P1 | P2 | P3 | P4 |
|----------|----|----|----|----|-----|
| CBT | 0 | 3 | 8 | 15 | 22 |
| Psychodynamic | 0 | 3 | 8 | 15 | 22 |
| ACT | 0 | 3 | 8 | 15 | 20 |
| DBT | 0 | 4 | 10 | 18 | — |
| Humanistic | 0 | 5 | 12 | — | — |

## Key Decisions

**Why turn-count thresholds, not purely AI-driven?**
Turn-count is fast, deterministic, and predictable for students. AI-driven detection adds latency and non-determinism. The hybrid approach (turn-count default + optional async AI) gives both performance and clinical depth.

**Why ACT is non-sequential?**
ACT's hexaflex model treats the 6 core processes as simultaneously accessible. Forcing sequential phases would misrepresent the model. The "phases" in act.ts are labeled as "processes" and include notes that any can be targeted at any time.

**Why are techniques written as student actions, not clinical jargon?**
Students are trainees. "Ask Socratic questions about the evidence" is more useful than "Employ Socratic dialogue." The frameworks are for teaching, not professional reference.

**Why academic citations on each phase?**
Grounds the training tool in peer-reviewed literature. Students and educators can verify the source frameworks. Critical for an educational product targeting clinical psychology programs.

## Academic Sources

- Beck, J.S. (2020). *Cognitive Behavior Therapy: Basics and Beyond* (3rd ed.). Guilford Press.
- Hayes, S.C., Strosahl, K., & Wilson, K.G. (2012). *Acceptance and Commitment Therapy* (2nd ed.). Guilford Press.
- Linehan, M.M. (2014). *DBT Skills Training Manual* (2nd ed.). Guilford Press.
- Luborsky, L. (1984). *Principles of Psychoanalytic Psychotherapy*. Basic Books.
- Rogers, C.R. (1961). *On Becoming a Person*. Houghton Mifflin.
- Shedler, J. (2010). The efficacy of psychodynamic psychotherapy. *American Psychologist*, 65(2), 98.

## Related Patterns

- `clinical-assessment-workflow.md` — intake + formulation that feeds into approach selection
- `session-guidance-ui.md` — frontend that consumes PhaseGuidance to show real-time guidance
