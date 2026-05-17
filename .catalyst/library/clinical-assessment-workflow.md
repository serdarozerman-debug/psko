# Pattern: Clinical Assessment Workflow

> Extracted from: `2026-05-17-clinical-psychology-platform`
> Extracted: 2026-05-18
> Domain: simulation, clinical-ai

## Summary

A two-stage intake and case formulation pattern for clinical training applications. The user completes a structured questionnaire (PHQ-9 + GAD-7 inspired), then a Claude API call synthesizes responses into a structured clinical case formulation with approach recommendations.

## When to Use

- Any AI-assisted clinical training tool that needs to contextualize a session before it begins
- Applications where an AI persona's behavior should adapt to a user-supplied clinical picture
- Training environments that need to model the "assessment before treatment" clinical workflow

## Pattern Structure

### Stage 1: Structured Intake Questionnaire

**Question bank design:**
- PHQ-9 items (9 questions, 0–3 Likert scale) for depression screening
- GAD-7 items (7 questions, 0–3 Likert scale) for anxiety screening
- 3 open-ended items: presenting problem, duration, functional impact

**Key file:** `src/lib/clinical/intake/questions.ts`

Each question object:
```typescript
interface IntakeQuestion {
  id: string
  text: { en: string; tr: string }   // bilingual support
  scale: 0 | 1 | 2 | 3
  category: 'phq9' | 'gad7' | 'open'
}
```

**Scoring thresholds (PHQ-9):**
- 0–4: None / minimal
- 5–9: Mild
- 10–14: Moderate
- 15–19: Moderately severe
- 20–27: Severe

### Stage 2: Claude-Driven Case Formulation

**Key file:** `src/lib/clinical/intake/formulation.ts`

Claude receives the intake responses and returns structured JSON:

```typescript
interface CaseFormulation {
  presentingIssues: string[]
  phq9Score: number              // 0–27
  gad7Score: number              // 0–21
  functionalImpairment: 'Mild' | 'Moderate' | 'Severe'
  clinicalPicture: string        // 150–250 word narrative
  recommendedApproaches: Array<{
    name: TherapeuticApproach
    rationale: string
    contraindications?: string
  }>
  riskFactors?: string[]
}
```

**Claude prompt pattern:**
```
You are a clinical psychologist. Analyze these intake responses and produce a structured case formulation.
Scores: PHQ-9 total = {X}, GAD-7 total = {Y}
Open responses: {responses}

Return JSON: { presentingIssues, functionalImpairment, clinicalPicture, recommendedApproaches, riskFactors }

IMPORTANT: clinicalPicture must be 150–250 words, written as if briefing a trainee therapist.
Respond in {language}.
```

**Error handling:** If Claude fails or returns malformed JSON, fall back to rule-based recommendations using PHQ-9/GAD-7 score thresholds only.

### Stage 3: Session System Prompt Injection

The case formulation is injected as a `CASE_CONTEXT` block in the AI persona's system prompt:

```
CASE_CONTEXT (for AI's internal reference):
Clinical presentation: {clinicalPicture}
PHQ-9: {score}/27 ({interpretation})
GAD-7: {score}/21 ({interpretation})
Primary concerns: {concerns}
Functional impairment: {level}
Student's chosen approach: {approach}
```

This contextualizes the persona's behavior without exposing the clinical framing to the user during the session itself.

## API Shape

**Route:** `POST /api/intake/analyze`

Input:
```json
{ "responses": { "phq9_1": 2, "phq9_2": 1, ..., "open_problem": "..." } }
```

Output:
```json
{
  "caseFormulation": { ... },
  "recommendedApproaches": [ { "name": "cbt", "rationale": "..." } ]
}
```

**Timeout:** 5 seconds. Hard fail with rule-based fallback.

## Key Decisions

**Why per-session, not global intake?**
Fresh intake per session maintains clinical precision. Storing globally risks applying a stale clinical picture to a different persona, which teaches poor clinical habits.

**Why Claude-generated formulation, not rule-based?**
Clinical formulation is inherently interpretive — a rule-based system can only score, not synthesize. Claude handles the nuance of co-occurring symptoms, context from open-ended answers, and approach rationale.

**Why educational scores only, not clinical diagnoses?**
PHQ-9 / GAD-7 are screening tools. The app is a training simulator, not a diagnostic system. Scores inform the learning context; they are never presented as diagnoses.

## Caveats

- This pattern is for training/education contexts only, not real clinical assessment
- The 5-second timeout on Claude is a hard limit; design the UI to handle graceful degradation
- Intake is optional but strongly encouraged — the system prompt injection is backward-compatible (skips CASE_CONTEXT if no intake was completed)

## Related Patterns

- `therapeutic-framework-system.md` — what happens after formulation (approach + phase selection)
- `session-guidance-ui.md` — how the formulation surfaces during the live session
