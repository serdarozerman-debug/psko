# Research: Clinical Intelligence Engine

## Academic Framework Sources

### 1. CBT — Beck's Case Conceptualization Model (Beck, 2020; Persons, 2008)
The gold-standard CBT case formulation follows 5 protocol phases:
1. **Engagement & Socialisation** — Build rapport, explain CBT model, set agenda
2. **Assessment** — Identify automatic thoughts, emotions, behaviours (ABC model)
3. **Case Formulation** — Map core beliefs, intermediate beliefs, cognitive model
4. **Intervention** — Guided discovery, Socratic questioning, behavioural experiments
5. **Consolidation & Relapse Prevention** — Homework, maintenance plan

Key techniques per phase are documented in Beck Institute training materials and Needleman (1999) *Cognitive Case Conceptualization*.

### 2. Psychodynamic — CCRT (Luborsky, 1984; Shedler, 2010)
The Core Conflictual Relationship Theme method structures sessions around:
- **Wish** (W): What the patient wishes for in relationships
- **Response of Other** (RO): How others respond
- **Response of Self** (RS): How the self responds to others' reactions
Session phases: Rapport → Free Association → Theme identification → Transference work → Working through

### 3. ACT — Acceptance & Commitment Therapy (Hayes, 2012)
6 core processes (Hexaflex):
1. Acceptance
2. Defusion (cognitive)
3. Present-moment awareness
4. Self-as-context
5. Values clarification
6. Committed action

ACT does not follow strict sequential phases; guidance focuses on which process to target based on patient's stuck point.

### 4. DBT — Linehan (2014)
Biosocial model + 4 skills modules:
- Mindfulness (foundation)
- Distress Tolerance
- Emotion Regulation
- Interpersonal Effectiveness

Stage-based treatment: Stage 1 = stabilisation / safety; Stage 2 = emotional processing; Stage 3 = ordinary happiness.

### 5. Humanistic / Person-Centred — Rogers (1961)
3 core conditions: Unconditional Positive Regard, Empathic Understanding, Congruence.
Empathy ladder: basic reflection → advanced empathy → challenge.
No structured phases — session follows client's lead.

---

## Intake Questionnaire Design

### PHQ-9 (Patient Health Questionnaire — Depression)
9 items rated 0-3. Score thresholds:
- 0-4: None/minimal
- 5-9: Mild (→ Humanistic, supportive)
- 10-14: Moderate (→ CBT, ACT)
- 15-19: Moderately severe (→ CBT, DBT)
- 20-27: Severe (→ DBT, crisis protocols)

### GAD-7 (Generalised Anxiety Disorder)
7 items rated 0-3. Score thresholds:
- 0-4: Minimal
- 5-9: Mild
- 10-14: Moderate
- 15-21: Severe

### Approach Recommendation Logic (Claude-generated, not rule-based)
The case formulation agent receives PHQ-9 score, GAD-7 score, presenting problem, and relationship/trauma history and generates a clinically reasoned recommendation. No hard-coded if/else — the AI synthesises the clinical picture.

**Caveat:** Scores are for educational framing only. The system must include a disclaimer: "These scores are educational tools, not clinical assessments. Do not use PSKO output for clinical decision-making."

---

## Structured Clinical Interview Reference — SCID-5

Key SCID-5 domains to inform persona enrichment:
- **Mood episodes**: onset, duration, severity, prior episodes
- **Anxiety**: frequency, triggers, avoidance patterns
- **Trauma**: type, recency, current impact
- **Substance use**: frequency, impact on functioning
- **Psychosis screening**: perceptual disturbances (rare in training scenarios)
- **Functioning**: work, relationships, self-care impairment level

Each persona JSON should include a `clinicalAnchors` section with SCID-5 aligned fields.

---

## Phase Detection Design

### Turn-based trigger (simple, no AI)
- Turns 0-3: Phase 0 (Engagement)
- Turns 4-8: Phase 1 (Assessment)
- Turns 9-14: Phase 2 (Formulation / deepening)
- Turns 15-25: Phase 3 (Intervention)
- Turns 26+: Phase 4 (Consolidation)

### Content-aware trigger (lightweight Claude call every 5 turns)
A 150-token Claude call reads the last 3 transcript turns + current phase and returns:
```json
{
  "recommendedPhase": 2,
  "rationale": "Patient has disclosed core belief; ready for formulation work",
  "nextMove": "Reflect the pattern you've heard and check if it resonates"
}
```

This can be done async (non-blocking) and cached per turn block.

---

## Codebase Analysis

Current state:
- `src/lib/approaches/` — 5 approach files with static `guidanceHints[]` and `suggestedQuestions[]`
- `ApproachConfig` interface has no concept of phases
- No intake flow exists
- Guidance panel is purely static (rendered once at session start)
- No `currentPhase` on `Session` model

Migration path:
- Keep backward-compatible `ApproachConfig` interface
- Add `ProtocolPhase[]` field to each approach (optional, used by phase engine)
- `currentPhase` column on Session (default 0)
- New `IntakeResponse` table
- New `src/lib/clinical/` module alongside existing `src/lib/approaches/`

---

## References

- Beck, J.S. (2020). *Cognitive Behavior Therapy: Basics and Beyond* (3rd ed.). Guilford Press.
- Hayes, S.C., Strosahl, K., & Wilson, K.G. (2012). *Acceptance and Commitment Therapy* (2nd ed.). Guilford Press.
- Linehan, M.M. (2014). *DBT Skills Training Manual* (2nd ed.). Guilford Press.
- Luborsky, L. (1984). *Principles of Psychoanalytic Psychotherapy*. Basic Books.
- Needleman, L.D. (1999). *Cognitive Case Conceptualization*. LEA.
- Persons, J.B. (2008). *The Case Formulation Approach to CBT*. Guilford Press.
- Rogers, C.R. (1961). *On Becoming a Person*. Houghton Mifflin.
- First, M.B. et al. (2016). *SCID-5-CV User's Guide*. APA Publishing.
