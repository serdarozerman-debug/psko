# Research: Clinical Psychology Platform

## Part A: Codebase Analysis

### Current Architecture

**Session Infrastructure (Existing)**
- `Session` model (Prisma): userId, personaId, therapeuticApproach, roleMode (THERAPIST | CLIENT), messages[], feedback
- `RoleMode` enum: THERAPIST = student plays therapist; CLIENT = student plays patient
- Dual-mode feedback: `SupervisorFeedback` (CTS-R competency scoring for THERAPIST mode) vs. `ClientDebrief` (emotional experience for CLIENT mode)
- Message model: simple sessionId, role (student | patient), content, createdAt

**Approach Configuration**
- `ApproachConfig` interface: id, name, description, systemPromptInstructions, guidanceHints[], supervisorCriteria[], suggestedQuestions[]
- 5 approaches implemented: CBT, Psychodynamic, ACT, DBT, Humanistic (in `src/lib/approaches/`)
- Guidance hints are static (rendered once at session start, never updated)
- No concept of protocol phases or sequential session structure

**Persona Model**
- `Persona` (Prisma): id, name, age, presentingProblem, backstory, difficultyLevel, conversationalStyle, recommendedApproaches[], cognitiveModel (JSON), disorderProfile[]
- `CognitiveModel` interface: coreBeliefs, intermediateBeliefs, automaticThoughts, emotionalState, triggers, defenses, values
- No clinical anchors (symptom onset, functional impairment, trauma history, prior treatment)

**API Routes**
- `POST /api/session/start`: creates session, builds persona system prompt, returns opening statement
- `POST /api/session/message`: streams patient response from Claude
- `POST /api/session/end`: triggers supervisor/debrief agent, saves feedback
- `GET /api/personas`: returns persona library

**Type System**
- `TherapeuticApproach` = 'cbt' | 'psychodynamic' | 'humanistic' | 'act' | 'dbt'
- `RoleMode` = 'THERAPIST' | 'CLIENT'
- `DifficultyLevel` = 'beginner' | 'intermediate' | 'advanced'
- `MessageRole` = 'student' | 'patient'
- `SupervisorFeedback` interface: overallScore, competencyScores[], strengths[], areasForImprovement[], keyMoments[], suggestedReadings[]
- `ClientDebrief` interface: type, experienceSummary, helpfulMoments[], challengingMoments[], emotionalThemes[], techniqueUsed, reflectionPrompts[]

### Integration Points for Phase 2

**1. Add to Prisma Schema**
- `IntakeResponse` model (new)
- `Session.currentPhase` (new Int field)
- `Session.intakeResponseId` (new foreign key)

**2. Extend ApproachConfig Type**
- Add `phases: ProtocolPhase[]` optional field
- Add `caseConceptualizationTemplate: string`
- Backward compatible: existing approaches work without phases

**3. New API Routes**
- `POST /api/intake/analyze` — intake form → case formulation
- `GET /api/session/[id]/phase` — current phase + guidance
- `POST /api/session/[id]/advance-phase` — update currentPhase (optional)

**4. Session Start Flow (Enhanced)**
- If `intakeResponseId` provided: fetch formulation, inject into system prompt
- Build CASE_CONTEXT section with clinical picture + formulation
- No breaking changes to existing flow (intake is optional)

**5. Message Route (Minor Update)**
- Poll phase detection every 5 turns (or call `/phase` endpoint separately)
- Guidance panel subscribes to `/api/session/[id]/phase`, not static hints

---

## Part B: Clinical Framework Analysis

### 1. Cognitive Behavioral Therapy (CBT) — Beck's Model

**Academic Basis:** Beck (2020), *Cognitive Behavior Therapy: Basics and Beyond*, 3rd ed.

**Theoretical Foundation:**
- Automatic thought ↔ emotion ↔ behavior triangle (core mechanism)
- Core beliefs (deep, rigid: "I am worthless") → intermediate beliefs (rules: "If I fail, I'm a failure") → automatic thoughts (situational: "I messed that up")
- Case conceptualization is the bridge between assessment and intervention

**5-Phase Protocol:**

| Phase | Name | Objective | Key Techniques | Watch For | Transition Signal |
|-------|------|-----------|---|---|---|
| 0 | Engagement & Socialization | Build rapport; introduce CBT model; set agenda | Validation, normalizing, psychoeducation, clear agenda setting | Client receptivity to CBT model; early resistance | Client agrees with session agenda; feels understood |
| 1 | Assessment | Identify thoughts, feelings, behaviors in specific situations | Open-ended questions ("What went through your mind?"), ABC model exploration, emotion labeling | Hidden automatic thoughts; behavioral avoidance; somatic complaints | Client can articulate one clear automatic thought |
| 2 | Case Formulation | Map connections: how core beliefs drive intermediate beliefs and automatic thoughts | Socratic questioning, pattern reflection, cognitive model drawing, behavioral tracking | Over-pathologizing; intellectualizing without emotion; flight to safety | Client recognizes pattern ("That's my rule: if I'm not perfect, I fail") |
| 3 | Intervention | Guided discovery; challenge distorted thoughts; design behavioral experiments | Thought records, Socratic questions ("What evidence?"), behavioral experiments, coping statements | Avoidance of emotion; premature reassurance-seeking; black-and-white thinking | Client generates alternative thoughts or experiments with behavior change |
| 4 | Consolidation & Relapse Prevention | Solidify gains; create maintenance plan; prepare for setbacks | Homework review, relapse prevention planning, resource list, continuation strategies | Termination anxiety; incomplete learning; plan too vague | Client articulates clear maintenance plan; feels confident |

**Case Conceptualization Template:**
```
[Client name] presents with [primary symptoms: anxiety/depression/both] 
driven by core belief: "[core belief]". 
When [triggering situation], [client] thinks "[automatic thought]", 
which leads to [emotional response] and [behavioral response]. 
CBT will target [specific thought pattern or behavior] through [Socratic questioning / behavioral experiments].
```

**Approach Recommendation Triggers:**
- High PHQ-9 (depression): CBT effective for moderate-to-severe depression
- High GAD-7 (anxiety): CBT gold standard for anxiety disorders
- Clear thought-emotion-behavior patterns in intake: good CBT fit
- Prefer cognitive approaches and structured homework: CBT alignment

---

### 2. Psychodynamic Psychotherapy — Luborsky's CCRT Model

**Academic Basis:** Luborsky (1984), *Principles of Psychoanalytic Psychotherapy*; Shedler (2010), APA efficacy review.

**Theoretical Foundation:**
- Unconscious conflicts and patterns repeat across relationships (transference)
- Core Conflictual Relationship Theme (CCRT): Wish → Response of Other → Response of Self
- Therapeutic change via insight into these patterns
- Listening stance: curious, non-judgmental, attention to emotional nuance

**5-Phase Protocol:**

| Phase | Name | Objective | Key Techniques | Watch For | Transition Signal |
|-------|------|-----------|---|---|---|
| 0 | Establishing Rapport & Safety | Build therapeutic alliance; client feels heard; explore what brings them in | Free association encouragement, reflective listening, validation, minimal direction | Guardedness; fear of judgment; rushed narrative | Client shares something vulnerable; pauses to check therapist reaction |
| 1 | Exploratory Listening | Invite client to associate freely; notice emotional themes; begin identifying patterns | "Tell me more", reflective summaries, gentle curiosity, emotion labeling | Deflection to external blame; avoidance of feeling; intellectualizing | Client identifies same feeling across multiple relationships or stories |
| 2 | Pattern Recognition & CCRT Formulation | Name the recurring Wish-RO-RS pattern; explore relational expectations | Gentle interpretation ("I notice you often feel let down by people you trust"), pattern reflection | Resistance to insight; shame about pattern; denial | Client spontaneously connects pattern to current relationships |
| 3 | Transference Exploration | Examine how the pattern shows up in the therapy relationship itself | Transference interpretation ("Perhaps you're wondering if I'll also let you down?"), present-moment focus | Rupture; client feels blamed; premature termination | Client recognizes own pattern playing out with therapist |
| 4 | Integration & Consolidation | Client understands pattern origin and can notice it in real time; therapy ends with plan for continued insight | Summarizing insight, psychoeducation about pattern, reflection on change process, ongoing self-observation | Unresolved grief about pattern; dependency on therapist; relapse | Client feels agency in recognizing and potentially shifting pattern |

**Case Conceptualization Template:**
```
[Client name] seeks therapy due to [presenting problem]. 
Exploring their relational history reveals a pattern: they wish for [Wish: e.g., "to be valued and needed"], 
but expect [RO: e.g., "others will abandon or criticize"], 
leading them to [RS: e.g., "become anxious, compliant, or withdrawn"]. 
This pattern likely originates in [early relationship], and repeats in [current relationship].
Psychodynamic work will focus on helping [client] become aware of and gradually shift this relational expectation.
```

**Approach Recommendation Triggers:**
- Recurrent relational patterns in intake: PDT fit
- History of relationship difficulties with "the same story different person": pattern repetition
- Client curious about "why" (introspective): PDT alignment
- Moderate anxiety/depression with relational roots: PDT efficacy

---

### 3. Acceptance & Commitment Therapy (ACT) — Hayes' Hexaflex

**Academic Basis:** Hayes, Strosahl, & Wilson (2012), *Acceptance and Commitment Therapy*, 2nd ed.

**Theoretical Foundation:**
- Psychological flexibility: ability to be present and move toward values even when painful thoughts/feelings arise
- 6 core processes (Hexaflex): acceptance, cognitive defusion, present-moment awareness, self-as-context, values, committed action
- Not linear phases; rather, a therapeutic orientation that addresses whichever process is most relevant to the client's stuck point

**"6-Process" Guidance (Non-Sequential)**

| Core Process | Objective | Key Techniques | Watch For | Readiness Signal |
|---|---|---|---|---|
| **Acceptance** | Willing contact with difficult thoughts/feelings rather than avoidance | Metaphors ("tug of war with a monster"), willingness exercises, exposure-based work | Confusion (isn't this negative?); avoidance of the technique | Client distinguishes between "unwilling" and "willing to have the feeling" |
| **Cognitive Defusion** | Step back from thoughts; observe them as "just thoughts" not facts | Labeling ("That's the anxiety thought"), metaphors ("leaves floating down a stream"), repeating words until meaning dissolves | Resistance ("But it IS true"); misunderstanding as dismissal | Client creates distance from thoughts; less hook/fusion |
| **Present-Moment Awareness** | Anchor in sensory experience; interrupt rumination/planning | Mindfulness exercises, 5-senses grounding, awareness of breath, noticing body | Sleepiness; meditation as escape; dissociation | Client can stay with sensations; noticing without judgment |
| **Self-as-Context** | Recognize the observing self (aware of thoughts/feelings but not defined by them) | Perspective-taking exercises ("Wise self"), observer role, continuity over time | Existential vertigo; "who am I without my thoughts?"; ego-threat | Client experiences self as larger than any single thought or feeling |
| **Values** | Clarify what matters most in life (not goals, but directions: being a good friend, learning, creating) | Values clarification card sort, metaphor exploration, "if there were no obstacles" questions | Values conflict (work vs. family); confusion with goals | Client articulates values with emotion; feels pulled toward them |
| **Committed Action** | Take concrete steps in line with values, despite discomfort | Behavioral activation, commitment devices, obstacles planning, tracking progress | Avoidance under guise of "getting over it first"; goal-setting instead of values-aligned action | Client takes action; feels life moving in valued direction |

**Session Example:** Client presents with anxiety about social situations (stuck point: avoidance). ACT might prioritize: **Defusion** (anxiety thoughts are not commands) → **Acceptance** (willing to feel anxious if it means connecting) → **Values** (what do I want my social life to be?) → **Committed Action** (show up to coffee, feel anxious, do it anyway).

**Case Conceptualization Template:**
```
[Client name] experiences [anxiety/depression/avoidance] and has become entangled in [belief: e.g., "I must feel confident to act"].
Their valued directions are [values], but they're stuck in [avoidance pattern]. 
ACT will help them:
1) Defuse from the belief (it's a thought, not a rule)
2) Accept the difficult feeling
3) Clarify what truly matters to them
4) Take small steps toward valued living despite discomfort
```

**Approach Recommendation Triggers:**
- High avoidance behavior (behavioral avoidance) in intake: ACT fit
- Values-clarification resonates ("What do you actually want in life?"): ACT alignment
- Anxiety/depression with experiential avoidance component: ACT efficacy
- Client stuck in struggle/control (fighting the feeling): ACT intervention

---

### 4. Dialectical Behavior Therapy (DBT) — Linehan's Biosocial Model

**Academic Basis:** Linehan (2014), *DBT Skills Training Manual*, 2nd ed.

**Theoretical Foundation:**
- Biosocial theory: emotional dysregulation (bio) meets invalidating environment (social) = emotional crisis
- 4 skills modules (building blocks): mindfulness (foundation), distress tolerance, emotion regulation, interpersonal effectiveness
- Stage-based: Stage 1 (stabilization/safety), Stage 2 (emotional processing), Stage 3 (ordinary happiness)
- Primarily for Borderline Personality Disorder but adapted for other emotion dysregulation presentations

**4-Stage Protocol (Simplified for PSKO)**

| Stage | Focus | Objectives | Key Skills | Watch For | Transition Signal |
|-------|-------|----------|---|---|---|
| **Stage 1: Stabilization & Safety** | Crisis management; safety first; behavioral targets | Reduce self-harm, suicidal ideation, therapy-interfering behaviors; establish stability | Distress tolerance (TIPP: temperature, intense exercise, paced breathing, paired muscle relaxation), grounding, crisis plan | Imminent harm; high dysregulation; overwhelming trauma | Client engages in skills; safety plan in place; acute crisis resolved |
| **Stage 2: Emotional Processing** | Process trauma/loss; understand emotion | Reduce quality-of-life-threatening behaviors (substance abuse, binge eating); process past pain | Emotion regulation (opposite action, checking the facts, ABC PLEASE), exposure-based work, validation | Avoidance of emotion; shame about past; therapist burnout | Client processes emotion without crisis; self-compassion emerging |
| **Stage 3: Ordinary Happiness** | Build positive life; future-oriented | Increase capacity for joy, relationships, meaning; reduce quiet desperation | Interpersonal effectiveness (DEAR MAN, GIVE, FAST: assertiveness, relationship maintenance, respect), values, goalsetting | Goal-setting as escape; isolation persisting; meaning elusive | Client describes envisioned life; takes steps toward it |

**Note:** DBT is typically a 1-year+ commitment with individual therapy + skills group + phone coaching + team consultation. PSKO will teach DBT principles and Stage 1 skills as a simulation; not replace full DBT.

**Case Conceptualization Template:**
```
[Client name] experiences intense [emotion regulation difficulty], 
driven by biological sensitivity and history of [invalidation: criticism, abuse, dismissal]. 
This leads to [self-harm, crisis, avoidance]. 
DBT will teach:
- **Stage 1:** Safety first — crisis skills and distress tolerance
- **Stage 2:** Processing emotions with validation
- **Ongoing:** Emotion regulation and interpersonal effectiveness skills for long-term stability
```

**Approach Recommendation Triggers:**
- High PHQ-9 + GAD-7 + behavioral dyscontrol (self-harm, substance, impulsivity): DBT fit
- Trauma history + emotion dysregulation: DBT alignment
- Suicidality or crisis ideation (even low): DBT consideration
- Client struggles with emotion intensity: DBT skills efficacy

---

### 5. Humanistic / Person-Centered Approach — Rogers' Core Conditions

**Academic Basis:** Rogers (1961), *On Becoming a Person*; Rogers' core conditions: unconditional positive regard, empathic understanding, congruence.

**Theoretical Foundation:**
- Client-centered: trust client's own wisdom and capacity to change
- Therapist offers genuine presence, acceptance, and understanding — change flows from this relational safety
- No agenda; session follows client's lead
- Empathy ladder: basic reflection → accurate empathy → advanced empathy (immediacy, challenge)
- Not problem-focused; existential-humanistic: who are you becoming?

**3-Phase Empathy Progression (Simplified)**

| Phase | Name | Objective | Key Techniques | Watch For | Transition Signal |
|-------|------|-----------|---|---|---|
| 0 | **Presence & Acceptance** | Build unconditional positive regard; client feels truly heard and valued | Genuine listening, minimal structure, unconditional acceptance, reflecting back ("I hear you saying..."), warmth and congruence | Therapist rescuing; judgment creeping in; client sensing conditions ("if you're happy, I'm happy") | Client relaxes; shares more freely; feels safe to be imperfect |
| 1 | **Deepening & Empathic Understanding** | Move beyond surface to emotional truth; reflect the felt sense | Accurate empathy ("It sounds like underneath the anger is deep hurt"), immediacy ("Right now, I sense you're..."), validation of experience | Misattunement ("You seem angry" when it's grief); premature meaning-making | Client nods recognition; "Yes, that's it"; emotional release |
| 2 | **Heightened Awareness & Gentle Challenge** | When trust is deep, gently invite client to new awareness; still centered in acceptance | Advanced empathy ("What I'm hearing is you want independence AND connection — and that tension is painful"), non-directive challenge ("I wonder if..."), existential exploration | Client feels criticized; therapist gone "intellectual"; rupture in alliance | Client self-reflects; recognizes own contradictions; feels supported while growing |

**Core Conditions (Always):**
- **Unconditional positive regard:** Accept client fully; no judgment
- **Empathic understanding:** Stand in their shoes; understand their internal world
- **Congruence/Authenticity:** Therapist is genuinely present; no facade

**Case Conceptualization Template:**
```
[Client name] seeks therapy feeling [unheard/unseen/disconnected]. 
Their presenting issue reflects a deeper question: [existential theme: who am I? what do I value? how do I belong?].
Person-centered work will provide the relational conditions (acceptance, empathic understanding, authenticity) 
in which [client] can reconnect with their own wisdom about who they are and who they want to become.
```

**Approach Recommendation Triggers:**
- Client value-driven language in intake ("I feel lost", "I want to find myself"): humanistic fit
- Relational wounds (feeling unseen, unvalued): person-centered healing alignment
- Low-to-moderate symptom severity; client capable of self-reflection: humanistic efficacy
- Existential concerns (meaning, identity, freedom): humanistic focus

---

## Part C: Intake Questionnaire Design

### PHQ-9 (Patient Health Questionnaire for Depression)

9 items, each rated 0–3 (Not at all, Several days, More than half the days, Nearly every day).

```
Over the past 2 weeks, how often have you been bothered by:
1. Little interest or pleasure in doing things
2. Feeling down, depressed, or hopeless
3. Trouble falling or staying asleep, or sleeping too much
4. Feeling tired or having little energy
5. Poor appetite or overeating
6. Feeling bad about yourself — or that you are a failure or have let your family down
7. Trouble concentrating on things, such as reading the newspaper or watching television
8. Moving or speaking so slowly that others have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual
9. Thoughts that you would be better off dead or of hurting yourself
```

**Scoring:**
- 0–4: Minimal / None
- 5–9: Mild depression
- 10–14: Moderate depression
- 15–19: Moderately severe depression
- 20–27: Severe depression

**Clinical Use:** PHQ-9 ≥ 10 suggests depressive disorder; strong predictor of functional impairment.

### GAD-7 (Generalized Anxiety Disorder Scale)

7 items, each rated 0–3.

```
Over the past 2 weeks, how often have you been bothered by:
1. Feeling nervous, anxious, or on edge
2. Not being able to stop or control worrying
3. Worrying too much about different things
4. Trouble relaxing
5. Being so restless that it's hard to sit still
6. Becoming easily annoyed or irritable
7. Feeling afraid as if something awful might happen
```

**Scoring:**
- 0–4: Minimal
- 5–9: Mild anxiety
- 10–14: Moderate anxiety
- 15–21: Severe anxiety

**Clinical Use:** GAD-7 ≥ 10 suggests generalized anxiety disorder.

### Open-Ended Questions (3 items)

```
1. What brings you to seek support right now? (Presenting problem)
2. How long have you been dealing with this? (Duration / onset)
3. How is this affecting your work, relationships, or day-to-day life? (Functional impairment)
```

**Optional (if high PHQ-9 or GAD-7):**
```
4. Have you experienced any trauma or significant loss?
5. Have you tried therapy or other support before? What was helpful or unhelpful?
```

### Approach Recommendation Algorithm

**Claude-based (NOT rule-based):**

```json
{
  "system": "You are a clinical training system. Analyze this intake and recommend therapeutic approaches.",
  "user_prompt": "
    PHQ-9 Score: {phq9}
    GAD-7 Score: {gad7}
    Presenting Problem: {presentingProblem}
    Duration: {duration}
    Functional Impairment: {impairment}
    Prior Treatment: {priorTreatment}
    Trauma History: {traumaHistory}
    
    Recommend the most clinically appropriate approaches for this case. Return JSON:
    {
      'caseFormulation': '150-250 word narrative',
      'recommendedApproaches': [
        {
          'name': 'approach_name',
          'rationale': 'Why this fits',
          'contraindications': 'When to avoid (optional)'
        }
      ],
      'primaryConcerns': ['concern1', 'concern2'],
      'functionalImpairment': 'Mild|Moderate|Severe',
      'riskFactors': ['risk1'] (if applicable)
    }
  "
}
```

**Example Output:**

```json
{
  "caseFormulation": "Sarah, 28, presents with moderate anxiety (GAD-7: 14) and mild depression (PHQ-9: 8) triggered by workplace perfectionism and fear of criticism. She reports 'feeling tense constantly, unable to relax.' Functionally impaired at work (avoidance of presentations) but relationships intact. No prior therapy; no trauma disclosed. Clinical picture suggests anxiety-driven rumination responding well to cognitive or acceptance-based approaches.",
  "recommendedApproaches": [
    {
      "name": "cbt",
      "rationale": "Clear thought-feeling-behavior pattern (perfectionism → anxiety → avoidance). CBT structured techniques (Socratic questioning, thought records) align with her preference for 'doing something concrete.' Anxiety responds reliably to CBT."
    },
    {
      "name": "act",
      "rationale": "High avoidance (presentations) driven by discomfort-intolerance. ACT's focus on values (career growth) + acceptance (willingness to feel anxious) + committed action fits her stuck point. No need for extensive emotion processing (depression mild)."
    }
  ],
  "primaryConcerns": ["anxiety", "perfectionism", "avoidance"],
  "functionalImpairment": "Moderate",
  "riskFactors": []
}
```

---

## Part D: Phase Detection Strategy

### Approach 1: Turn-Count Based (Default)

Simple, performant, no API calls. Per therapeutic approach:

```typescript
const phaseThresholds = {
  cbt:          [0, 3, 8, 15, 22],
  psychodynamic: [0, 4, 10, 18, 25],
  act:          [0, 5, 12, 20, 28],
  dbt:          [0, 3, 8, 15, 22],
  humanistic:   [0, 4, 10, 18, 26],
}

function getPhaseByTurnCount(turnCount: number, approach: TherapeuticApproach): number {
  const thresholds = phaseThresholds[approach]
  return thresholds.findIndex((min, i, arr) => turnCount >= min && (i === arr.length - 1 || turnCount < arr[i + 1])) || 4
}
```

**Pros:** Fast, no latency, predictable  
**Cons:** Ignores actual session content; phase might advance even if assessment not done

### Approach 2: Content-Aware (Optional, Async)

Every 5 turns, async Claude call to detect readiness:

```typescript
async function detectPhaseContent(
  messages: Message[],
  approach: TherapeuticApproach,
  currentPhase: ProtocolPhase
): Promise<{ phaseIndex: number; rationale: string }> {
  const summary = messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n')
  
  const response = await claude.messages.create({
    system: `You are a clinical supervisor evaluating a ${approach} session. Analyze the transcript snippet and recommend the next protocol phase.
    
    Current phase: "${currentPhase.name}" (${currentPhase.objective})
    Criteria for advancing: ${currentPhase.transitionSignal || 'Client has articulated key insight for this phase'}
    
    Return JSON: { phaseIndex: number (0-5), rationale: string (1-2 sentences) }`,
    messages: [{ role: 'user', content: summary }],
    max_tokens: 150,
  })
  
  return JSON.parse(response.content[0].text)
}
```

**Pros:** Respects actual clinical progress; students see "why" they advanced  
**Cons:** Adds ~1s latency; costs extra API calls

**Recommendation:** Start with turn-count; implement content-aware if feedback suggests students don't understand phase transitions.

---

## Part E: Codebase Integration Path

### File Changes Summary

**New files:**
- `src/lib/clinical/frameworks/cbt.ts` — CBT phase definitions
- `src/lib/clinical/frameworks/psychodynamic.ts` — PDT phase definitions
- `src/lib/clinical/frameworks/act.ts` — ACT phase definitions
- `src/lib/clinical/frameworks/dbt.ts` — DBT phase definitions
- `src/lib/clinical/frameworks/humanistic.ts` — Humanistic phase definitions
- `src/lib/clinical/intake/questions.ts` — PHQ-9 + GAD-7 question bank
- `src/lib/clinical/intake/analyzer.ts` — analyzeIntake(responses) → Claude call
- `src/lib/clinical/phase-engine/detect.ts` — detectPhase() implementations
- `src/lib/clinical/phase-engine/schema.ts` — TypeScript types

**Modified files:**
- `src/types/index.ts` — Add ProtocolPhase, CaseFormulation, IntakeResponse, PhaseGuidance interfaces
- `prisma/schema.prisma` — Add IntakeResponse model; extend Session
- `src/app/api/session/start/route.ts` — Accept intakeResponseId; inject case context into system prompt
- `src/lib/approaches/cbt.ts` — Add phases: ProtocolPhase[]
- `src/lib/approaches/psychodynamic.ts` — Add phases
- `src/lib/approaches/act.ts` — Add phases
- `src/lib/approaches/dbt.ts` — Add phases
- `src/lib/approaches/humanistic.ts` — Add phases

**New API routes:**
- `src/app/api/intake/analyze/route.ts` — POST /api/intake/analyze
- `src/app/api/session/[id]/phase/route.ts` — GET /api/session/[id]/phase
- `src/app/api/session/[id]/advance-phase/route.ts` — POST /api/session/[id]/advance-phase (optional)

**New components:**
- `src/components/IntakeFlow.tsx` — 3-screen intake form
- `src/components/CaseFormulationReview.tsx` — Case formulation + approach confirmation
- `src/components/SessionGuidancePanel.tsx` — Refactored from static hints

**Seed data / migrations:**
- `prisma/migrations/[timestamp]_add_clinical_phase_support.sql` — Schema migration
- `prisma/seed-clinical.ts` — Seed phase definitions into frameworks

### Backward Compatibility

- Intake is **optional** — existing session flow unchanged
- ApproachConfig phases are **optional** — existing approaches work without them
- Session.currentPhase defaults to 0
- If no intakeResponseId, session proceeds as before

---

## Part F: References & Academic Grounding

### Primary Sources

1. **Beck, J.S. (2020).** *Cognitive Behavior Therapy: Basics and Beyond* (3rd ed.). Guilford Press.
   - Standard CBT training text; clear 5-phase model

2. **Hayes, S.C., Strosahl, K., & Wilson, K.G. (2012).** *Acceptance and Commitment Therapy* (2nd ed.). Guilford Press.
   - Definitive ACT manual; Hexaflex model

3. **Linehan, M.M. (2014).** *DBT Skills Training Manual* (2nd ed.). Guilford Press.
   - DBT foundational text; Stage 1–3 framework

4. **Luborsky, L. (1984).** *Principles of Psychoanalytic Psychotherapy*. Basic Books.
   - CCRT (Core Conflictual Relationship Theme) model

5. **Rogers, C.R. (1961).** *On Becoming a Person*. Houghton Mifflin.
   - Humanistic psychology classic; core conditions

6. **Shedler, J. (2010).** "The efficacy of psychodynamic psychotherapy." *American Psychologist*, 65(2), 98–109.
   - Meta-analysis validating psychodynamic approaches

### Supporting References

- Persons, J.B. (2008). *The Case Formulation Approach to CBT*. Guilford Press.
- Needleman, L.D. (1999). *Cognitive Case Conceptualization*. LEA.
- First, M.B. et al. (2016). *SCID-5-CV User's Guide*. APA Publishing.
- American Psychiatric Association (2013). *Diagnostic and Statistical Manual of Mental Disorders* (5th ed.).

### Educational Integration

All phase definitions, techniques, and case conceptualizations in PSKO will:
1. **Cite sources** — each phase includes a source attribution
2. **Remain educationally appropriate** — not duplicate full clinical training (students still need supervised practice)
3. **Respect clinical complexity** — no reductive rule-based approach selection; Claude-generated formulations honor nuance
4. **Include disclaimers** — "Educational tool; not a clinical assessment; not for clinical decision-making"

---

## Summary

This clinical psychology platform bridges theory and practice by:

1. **Grounding intake in evidence** (PHQ-9, GAD-7, SCID-5 aligned enrichment)
2. **Making protocol phases visible** (students learn structured, intentional session pacing)
3. **Connecting case formulation to approach selection** (students see why CBT vs. ACT vs. psychodynamic for this case)
4. **Offering hybrid framework option** (students learn multi-school thinking)
5. **Supporting dual-mode learning** (therapist mode with phase guidance; client mode with emotional debrief)
6. **Honoring language diversity** (Turkish-first AI responses per Phase 1)
7. **Maintaining academic rigor** (all frameworks peer-reviewed, sources cited)

Next: Implementation specifications in `tasks.md`.
