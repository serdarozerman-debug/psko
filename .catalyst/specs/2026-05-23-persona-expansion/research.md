## Codebase Analysis
[Date: 2026-05-23]

### Relevant Files

- `/Users/serdarozerman/Documents/PSKO/psko-app/src/lib/personas/library/` — 5 JSON persona files (the entire library)
- `/Users/serdarozerman/Documents/PSKO/psko-app/src/lib/personas/index.ts` — imports all personas, exports `personaLibrary` array and `getPersonaById()`
- `/Users/serdarozerman/Documents/PSKO/psko-app/src/types/index.ts` — canonical `PersonaData` and `CognitiveModel` TypeScript interfaces
- `/Users/serdarozerman/Documents/PSKO/psko-app/src/lib/claude/prompts/patient-prompt.ts` — `buildPatientPrompt(persona, approach)` — the function that injects persona data into the Claude system prompt
- `/Users/serdarozerman/Documents/PSKO/psko-app/src/app/api/personas/route.ts` — `GET /api/personas` — returns a stripped persona list (no `backstory`, no `cognitiveModel`)
- `/Users/serdarozerman/Documents/PSKO/psko-app/prisma/schema.prisma` — `Persona` model definition; personas are stored in DB
- `/Users/serdarozerman/Documents/PSKO/psko-app/prisma/seed.ts` — reads every JSON file in `library/`, upserts into `personas` table
- `/Users/serdarozerman/Documents/PSKO/.catalyst/main/architecture.md` — system design, prompt architecture
- `/Users/serdarozerman/Documents/PSKO/.catalyst/main/conventions.md` — naming conventions, persona library rules
- `/Users/serdarozerman/Documents/PSKO/.catalyst/main/concerns.md` — clinical validity risks
- `/Users/serdarozerman/Documents/PSKO/.catalyst/main/roadmap.md` — Phase 2C persona expansion spec

---

### 1. Existing Persona JSON Structure (Full Schema)

Every persona JSON file must contain all of the following fields. Example from `ayse-depression-beginner.json`:

```json
{
  "id": "ayse-depression-beginner",           // kebab-case string; used as DB primary key
  "name": "Ayşe",                              // fictional Turkish first name
  "age": 28,                                   // integer
  "presentingProblem": "...",                  // first-person opening statement from the patient
  "backstory": "...",                          // 3–5 sentence rich personal history (prose)
  "difficultyLevel": "beginner",              // "beginner" | "intermediate" | "advanced"
  "conversationalStyle": "plain",             // see §7 below
  "recommendedApproaches": ["cbt", "humanistic", "act"],  // TherapeuticApproach[]
  "disorderProfile": ["Major Depressive Disorder, mild"],  // DSM-5 label strings[]
  "cognitiveModel": {
    "coreBeliefs": ["...", "..."],             // 3 beliefs minimum
    "intermediateBeliefs": ["...", "..."],     // 3 rules/assumptions
    "automaticThoughts": ["...", "..."],       // 4 situational cognitions
    "emotionalState": {
      "primary": "sad",                        // emotion label
      "intensity": 3,                          // 1–5 integer
      "secondary": "ashamed"                   // optional
    },
    "triggers": ["...", "..."],                // 3 topics that intensify distress
    "defenses": ["...", "..."],               // 2+ defense mechanisms (with label in parens)
    "values": ["...", "...", "..."]           // 3 ACT-relevant values
  }
}
```

**No fields beyond these 9 top-level keys exist in any current persona.** All 5 personas follow this structure identically.

---

### 2. PersonaData TypeScript Interface (canonical)

From `/Users/serdarozerman/Documents/PSKO/psko-app/src/types/index.ts`:

```typescript
export interface CognitiveModel {
  coreBeliefs: string[]
  intermediateBeliefs: string[]
  automaticThoughts: string[]
  emotionalState: {
    primary: string
    intensity: 1 | 2 | 3 | 4 | 5
    secondary?: string
  }
  triggers: string[]
  defenses: string[]
  values: string[]
}

export interface PersonaData {
  id: string
  name: string
  age: number
  presentingProblem: string
  backstory: string
  difficultyLevel: DifficultyLevel          // 'beginner' | 'intermediate' | 'advanced'
  conversationalStyle: ConversationalStyle  // 'plain' | 'upset' | 'reserved' | 'verbose' | 'pleasing' | 'tangent'
  recommendedApproaches: TherapeuticApproach[]
  cognitiveModel: CognitiveModel
  disorderProfile: string[]
}
```

**The interface has no optional fields** — every persona must supply all 9 top-level fields and all 7 `cognitiveModel` sub-fields.

---

### 3. How Personas Are Loaded

Loading is static — not database-driven at runtime for the prompt:

1. Each JSON file is individually imported at the top of `/Users/serdarozerman/Documents/PSKO/psko-app/src/lib/personas/index.ts`
2. They are cast to `PersonaData` and pushed into the exported `personaLibrary` array
3. `getPersonaById(id)` does a linear `.find()` over the array

**Critical implication:** Adding a new persona requires **two manual steps** — dropping the JSON file in `library/` is not enough:
- Step A: Add an `import` statement and array entry in `index.ts`
- Step B: Run `npx prisma db seed` to upsert the persona into the `personas` Postgres table (required because `Session.personaId` is a FK to the `Persona` table)

The seed script auto-discovers all JSON files in `library/` by reading the directory, so step B is purely `npx prisma db seed` — no seed file changes needed.

---

### 4. How Personas Are Used in Prompts

`buildPatientPrompt(persona, approach)` in `/Users/serdarozerman/Documents/PSKO/psko-app/src/lib/claude/prompts/patient-prompt.ts` injects these fields into the Claude system prompt:

| Persona Field | How Injected |
|---|---|
| `name` | "You are {name}..." (character identity) |
| `age` | "...a {age}-year-old person..." |
| `presentingProblem` | Injected verbatim under `PRESENTING PROBLEM:` |
| `backstory` | Injected verbatim under `BACKGROUND:` |
| `cognitiveModel.coreBeliefs` | Pipe-joined list under `COGNITIVE MODEL` |
| `cognitiveModel.intermediateBeliefs` | Pipe-joined list |
| `cognitiveModel.automaticThoughts` | Pipe-joined list |
| `cognitiveModel.emotionalState.primary` | `Primary emotion: {primary} (intensity {intensity}/5)` |
| `cognitiveModel.emotionalState.intensity` | Inline with primary |
| `cognitiveModel.emotionalState.secondary` | Added on a new line if present |
| `cognitiveModel.triggers` | Comma-joined list |
| `cognitiveModel.defenses` | Comma-joined list |
| `cognitiveModel.values` | Comma-joined list |
| `conversationalStyle` | Mapped to a full prose style description via `STYLE_DESCRIPTIONS` lookup |

**Fields NOT currently injected into the prompt:**
- `disorderProfile` — stored in DB, shown in the UI persona card, but NOT sent to Claude
- `recommendedApproaches` — shown in UI only
- `difficultyLevel` — shown in UI only; no behavioral effect inside the Claude prompt itself

The approach config's `systemPromptInstructions` is appended at the bottom as `THERAPEUTIC APPROACH CONTEXT`.

---

### 5. Existing Disorder Categories (All 5 Personas)

| Persona | `disorderProfile` |
|---|---|
| Ayşe (beginner) | `["Major Depressive Disorder, mild"]` |
| Zeynep (beginner) | `["Prolonged Grief Disorder"]` |
| Mert (intermediate) | `["Generalized Anxiety Disorder", "Panic Disorder"]` |
| Can (intermediate) | `["Occupational Burnout", "Adjustment Disorder with mixed anxiety and depressed mood"]` |
| Selin (advanced) | `["Anxious-preoccupied attachment", "Recurrent depressive episodes in relational context"]` |

**Coverage gaps** (mentioned in roadmap Phase 2C as explicit targets): trauma/PTSD, OCD, personality disorders (BPD, NPD, AVPD), psychosis spectrum, addiction/substance use disorders.

---

### 6. SCID-5 Enrichment — Missing Fields Analysis

The roadmap (Phase 2C) specifies adding:
- Symptom onset timeline
- Functional impairment score/description
- Trauma flags

**None of these exist** in the current `PersonaData` interface or any JSON file. They are entirely absent from:
- The TypeScript `PersonaData` interface in `src/types/index.ts`
- The Prisma `Persona` model in `schema.prisma` (the `cognitiveModel` column is a freeform `Json` blob, so sub-fields could be added without a migration, but top-level additions require a migration)
- All 5 existing JSON files

To add SCID-5 enrichment fields, the implementation path is:
1. Add optional fields to `PersonaData` and `CognitiveModel` interfaces in `src/types/index.ts`
2. If top-level fields on `Persona` DB model: write a Prisma migration
3. If stored inside the `cognitiveModel` JSON blob: no migration needed, just update the interface and JSON files
4. Update `buildPatientPrompt()` to conditionally inject them into the system prompt
5. Update `seed.ts` upsert mapping if adding top-level DB columns
6. Backfill all 5 existing personas with the new fields

**Recommendation from analysis:** Store SCID-5 enrichment inside `cognitiveModel` as optional sub-fields (e.g., `cognitiveModel.symptomOnset`, `cognitiveModel.functionalImpairment`, `cognitiveModel.traumaFlags`) to avoid a DB migration. This matches the pattern: `cognitiveModel` is already a `Json` blob in Postgres.

---

### 7. Difficulty Levels — Values and Behavioural Effect

Three values exist: `'beginner' | 'intermediate' | 'advanced'`

Behavioural mapping (from conventions.md and codebase patterns):
- `beginner` — cooperative, clear presentation, minimal defensiveness. Current examples: Ayşe (plain style, mild MDD), Zeynep (plain style, grief)
- `intermediate` — some resistance, more complex presentation, comorbidity possible. Current examples: Mert (verbose, GAD + Panic), Can (reserved, Burnout + Adjustment)
- `advanced` — complex comorbidity, high defensiveness, challenging conversational style. Current example: Selin (pleasing style, attachment + depression)

**Important:** `difficultyLevel` is NOT currently injected into the Claude prompt — it only affects UI (difficulty filter/badge). Behavioral complexity is entirely encoded in the `cognitiveModel` and `conversationalStyle` fields. There is no guard in the session start logic that prevents a student from selecting an advanced persona regardless of their experience level.

---

### 8. Conversational Styles — Values and How They're Used

Six values exist. All are mapped in `patient-prompt.ts` via the `STYLE_DESCRIPTIONS` object:

| Style | Description injected into Claude system prompt |
|---|---|
| `plain` | "Speak matter-of-factly. Answer questions directly but without volunteering extra information." |
| `upset` | "You are emotionally activated. Your responses may be shorter, more terse, or carry an edge of frustration or distress." |
| `reserved` | "You answer minimally. You rarely volunteer information. You need to be asked multiple times before you open up." |
| `verbose` | "You over-share and tend to go on tangents. You jump between topics. You have trouble staying focused." |
| `pleasing` | "You try to give the 'right' answer. You agree readily and want the therapist to like you. This masks your real experience." |
| `tangent` | "You drift off topic frequently. One thought leads to another. You need gentle redirection." |

Current persona distribution: `plain` ×2, `reserved` ×1, `verbose` ×1, `pleasing` ×1, `upset` ×0, `tangent` ×0.

---

### 9. What Adding a New Persona Requires

**Minimum steps:**

1. **Create JSON file** at `src/lib/personas/library/{first-name}-{disorder}-{difficulty}.json` following the exact schema in §1
2. **Register the import** in `src/lib/personas/index.ts` — add an `import` line and push to `personaLibrary` array
3. **Run `npx prisma db seed`** — the seed script auto-discovers JSON files by directory scan; no changes to `seed.ts` itself needed

**No other changes required** — no new API routes, no schema migrations (using existing fields), no component changes.

**Optional but consistent with existing code:**
- Ensure `id` matches filename (e.g., `"id": "fatma-ptsd-intermediate"` in `fatma-ptsd-intermediate.json`)
- Clinical review before inclusion (per `concerns.md` §5)

---

### Patterns Found

- **Static in-process library:** personas are imported as JS modules at build time, not fetched from DB at runtime. The DB is a mirror for FK integrity, not the source of truth for the prompt.
- **Flat JSON + single TypeScript cast:** no validation (Zod or similar) occurs when the JSON is cast to `PersonaData` — type safety is compile-time only. A malformed JSON file would silently produce broken prompts.
- **No dynamic field injection by difficulty:** difficulty is purely a UI affordance. Complex behavior is authored into the cognitive model directly.
- **disorderProfile is UI-only:** the DSM-5 labels are never sent to Claude — this is a deliberate privacy/realism choice (per architecture.md design notes).
- **All personas are Turkish/Turkish-context:** convention enforces Turkish first names and Istanbul/Ankara settings; the Claude prompt has a hardcoded rule: "ALWAYS respond in Turkish."
- **No persona versioning:** there is no `version` field on the JSON or the DB model. If a persona is updated and re-seeded, the upsert overwrites the DB record silently.
- **Seed is idempotent** via `upsert { where: { id } }` — safe to run repeatedly.

---

### Integration Points

- `src/lib/personas/index.ts` — **single registration point** for new personas; must be manually updated per persona
- `src/types/index.ts` — **interface definition**; must be updated if any new fields are added to the schema
- `prisma/schema.prisma` + `prisma/seed.ts` — **DB layer**; migration needed only for new top-level columns, not for extensions to the `cognitiveModel` JSON blob
- `src/lib/claude/prompts/patient-prompt.ts` — **prompt injection**; must be updated to use any new SCID-5 fields in the Claude prompt
- `src/app/api/personas/route.ts` — **API strip list**; if new top-level fields are added, decide whether to expose them in the library view

---

### Recommendations

1. **SCID-5 enrichment should live inside `cognitiveModel`** as optional sub-objects to avoid DB migrations. Suggested shape:
   ```typescript
   // Added to CognitiveModel interface as optional
   symptomOnset?: string           // e.g., "Symptoms began ~18 months ago following job loss"
   functionalImpairment?: {
     work: 'mild' | 'moderate' | 'severe'
     social: 'mild' | 'moderate' | 'severe'
     selfCare: 'mild' | 'moderate' | 'severe'
   }
   traumaFlags?: string[]           // e.g., ["childhood emotional neglect", "single-incident trauma"]
   ```

2. **Automate the `index.ts` registration step** — a build-time script that auto-imports all JSON files in `library/` and constructs `personaLibrary` dynamically would eliminate the manual import step and the risk of mismatches. The seed script already does this pattern; `index.ts` should too.

3. **Add Zod schema validation** at the `index.ts` load step — the current code blindly casts JSON to `PersonaData`. With 20+ personas, a malformed file would be difficult to diagnose. A `PersonaDataSchema.parse()` at startup would surface errors immediately.

4. **Track which styles and disorders are covered** — with 20+ personas, the distribution of `conversationalStyle`, `difficultyLevel`, and disorder category should be deliberate. Currently `upset` and `tangent` styles have zero personas; trauma, OCD, personality disorders, psychosis, and addiction have zero coverage.

5. **No DB migration needed for the expansion itself** — adding more personas with the existing schema is purely additive (new JSON files + `index.ts` imports + `db seed`).

6. **The `disorderProfile` field is intentionally hidden from Claude** — new personas for psychosis or personality disorders should NOT leak diagnosis names into the system prompt. The cognitive model structure is sufficient for Claude to simulate the presentation realistically.

7. **Turkish language constraint is global and hardcoded** — all new personas must be Turkish-named and Turkish-context, as the prompt has a hardcoded rule (rule #9: "ALWAYS respond in Turkish"). This is not configurable per-persona.

---

## External Research
[Date: 2026-05-23]

---

### 1. DSM-5 Disorder Priority for Psychology Training

**High-priority disorders by training gap x prevalence:**

- **Serious Mental Illness (SMI) is the most under-trained category.** APA's 2019 recognition of SMI psychology as its own specialty confirmed a decades-long gap: treating schizophrenia, bipolar disorder, and severe personality disorders is "not part of standard psychological curriculum." A dedicated workforce is critically needed.
- **Borderline Personality Disorder** is explicitly called out in both APA guidelines and medical education literature as a disorder requiring standardized simulation training. It is among the highest-priority for clinical skills development.
- **PTSD/Trauma-related disorders** appear in every major training curriculum audit as underrepresented relative to clinical demand.
- **Addiction/substance use** has a documented training gap: "lack of an adequately trained workforce is one of the prominent reasons for limited treatment coverage in substance use disorders" (PMC7283115).
- **OCD** is included in psychiatry simulation curricula (e.g., scenario: patient with OCD who has developed skin damage due to compulsive handwashing) but rarely practiced before residency.

**Recommended priority tiers for PSKO expansion:**

| Tier | Disorders | Rationale |
|---|---|---|
| Tier 1 (immediate) | PTSD, BPD, Schizophrenia spectrum, Major Depression severe | Highest training gap + prevalence |
| Tier 2 | Bipolar I/II, OCD, Alcohol Use Disorder, Social Anxiety Disorder | High prevalence, moderate training exposure |
| Tier 3 | NPD, ASPD, Avoidant PD, Panic Disorder + Agoraphobia, Specific Phobia | Important but lower immediate gap |
| Tier 4 | Eating disorders, Somatic Symptom Disorder, ADHD, Dissociative Identity | Specialty areas; valuable but require expert review |

---

### 2. SCID-5 Structured Interview Fields

The SCID-5 is a semi-structured diagnostic interview lasting 45–90 minutes, organized into diagnostic modules. It is the gold-standard assessment instrument for DSM-5 diagnoses.

**Core data domains the SCID-5 collects (actionable for persona enrichment):**

| SCID-5 Domain | What It Captures | Persona Field Mapping |
|---|---|---|
| Symptom onset | When symptoms first appeared; precipitating events | `cognitiveModel.symptomOnset` (already proposed) |
| Duration | Weeks/months/years symptomatic; episodic vs. chronic | New sub-field in `cognitiveModel` |
| Functional impairment | Social, occupational, and "other" impairment on a 9-point scale (0=none, 8=severe) | `cognitiveModel.functionalImpairment` (already proposed) |
| Prior treatment | Previous therapy, medication, hospitalization | New optional sub-field |
| Trauma history | Criterion A traumatic events, prior victimization | `cognitiveModel.traumaFlags` (already proposed) |
| Symptom severity coding | Present / subthreshold / absent coding per symptom | Could map to `emotionalState.intensity` extensions |
| Course specifiers | First episode, recurrent, partial/full remission | Implicit in `backstory`; could be formalized |

**Key principle:** SCID-5 uses skip logic — if entry criteria are not met, the module is skipped. This mirrors the idea that persona triggers should only activate specific symptom chains (already represented in the `triggers` field).

**Versions relevant to PSKO:**
- SCID-5-CV (Clinician Version): covers the most clinically common presentations — best reference for persona grounding
- SCID-5-PD: Personality disorder module — essential for BPD, NPD, ASPD personas

---

### 3. Trauma-Informed Persona Design

**Best practices from simulation research (MedEdPORTAL, PMC10376910):**

- **Facilitators act as patients; students do not embody trauma survivors.** The most ethically sound approach is to have the AI/facilitator represent the traumatized patient. Students practice assessment — they do not roleplay victimization. This is directly applicable: the AI (Claude) is the patient; the student is the clinician.
- **Trigger warnings before session start are mandatory.** Research requires "content warnings about sensitive topics, reminders to practice self-care, and invitations to take breaks" before trauma-presenting simulations.
- **Debriefing after each session is non-negotiable.** Dedicated debrief phases are required where students can self-assess and receive feedback — not optional.
- **Small group / low learner-to-facilitator ratio** is recommended for trauma cases; this argues for trauma personas being gated as intermediate/advanced with explicit warnings.

**What NOT to include in trauma personas:**
- Graphic violence or abuse descriptions in the `presentingProblem` or `backstory` fields (these are injected verbatim into the Claude prompt and would appear in every session)
- Specific perpetrator details that could be speculated/hallucinated by the LLM
- Real-sounding event descriptions that mirror actual news events or identifiable cases
- Explicit self-harm method descriptions (methods should be referred to clinically, not graphically)

**Recommended trauma persona structure:**
- `backstory` should describe impact of trauma, not the trauma itself (e.g., "Fatma has difficulty trusting others since an experience of loss she finds hard to talk about" rather than detailed abuse narrative)
- `triggers` field should include trauma-adjacent cues (e.g., "being asked about childhood," "discussions about safety," "male authority figures")
- `traumaFlags` (proposed SCID-5 enrichment) should use clinical category labels, not narrative descriptions (e.g., `["childhood emotional neglect", "single-incident trauma — assault"]`)

---

### 4. Personality Disorder Simulation Challenges

**BPD — Borderline Personality Disorder:**

- Described in literature as "more difficult to portray than other conditions" — standardized patients in traditional simulation programs struggle to maintain consistency, making AI simulation particularly valuable here.
- AAMC has published an AI standardized patient script for BPD based on the Handbook for Good Psychiatric Management (GPM) — this is directly relevant as a reference design.
- Training goals for BPD simulation: therapeutic communication, de-escalating crises, recognizing "splitting" behavior, setting limits around attention-seeking, maintaining team consistency.
- Key cognitive model features for BPD personas: core beliefs of abandonment and worthlessness, intense emotional reactivity (high `emotionalState.intensity`), `upset` or `pleasing` conversational style with rapid switching, triggers around perceived rejection or abandonment.
- Countertransference risk is highest for BPD — students will feel criticized/devalued. Training should surface this explicitly in debrief.

**NPD — Narcissistic Personality Disorder:**

- Countertransference pattern: students feel criticized/devalued, helpless/inadequate, or disengaged. Training must address this directly.
- Key clinical challenge: NPD is positively associated with hostile/angry countertransference. The `upset` conversational style with grandiose automatic thoughts would be the right combination.
- Clinical differentiation from ASPD: NPD lacks recurrent antisocial behavior; exploitativeness is "less systematic and conscious" than in ASPD.
- Recommended treatment frame: Transference-Focused Psychotherapy (TFP) and Mentalization-Based Treatment (MBT) — both are valid `recommendedApproaches` entries.

**ASPD — Antisocial Personality Disorder:**

- Highest risk of harmful simulation: the persona must not model predatory or manipulative behavior in ways that could be mistaken for acceptable conduct.
- Training value: recognizing deception, testing limits, legal/ethical boundary awareness.
- Recommended: keep ASPD at advanced difficulty only; include explicit session-start warning in UI.
- Conversational style: `tangent` or `upset` with minimizing automatic thoughts; core beliefs centered on entitlement and distrust.

---

### 5. Psychosis Simulation Guidelines

**Core finding from VR/simulation research (PMC9152122, Frontiers 2025 scoping review):**

- Simulations that portray psychosis as *terrifying* with dramatic, dark environmental cues produce WORSE attitudes toward people with schizophrenia. **Neutral environmental framing with educational context significantly outperforms shock-based approaches.**
- VR simulation of positive psychotic symptoms (hallucinations, delusions) increased empathy and reduced stigma when paired with education. Standalone simulation without education *does not reliably lower stigma* (RCT finding).

**Positive symptoms to represent (authentic, non-stigmatizing):**
- Auditory hallucinations: patient mentions hearing voices commenting on the session, difficulty concentrating because of background voices — not violent command hallucinations (too stigmatizing)
- Paranoid ideation: moderate suspicion about the therapist's motives, guarded disclosures — not dangerous persecution delusions
- Disorganized thinking: reflected in `tangent` conversational style + fragmented automatic thoughts

**Negative symptoms to represent (often overlooked in training):**
- Anhedonia: flat affect, difficulty expressing emotions (low `emotionalState.intensity` despite significant distress)
- Alogia: minimal verbal output — maps naturally to `reserved` style
- Avolition: described in `backstory` through functional impairment (e.g., stopped attending university, no longer cooking)

**Key guidance for PSKO:**
- Do NOT use `disorderProfile: ["Schizophrenia"]` as a trigger for Claude to perform stereotyped "crazy" behavior — the diagnosis label is already hidden from Claude (correct current design)
- Represent psychosis through cognitive model and conversational style, not through dramatic narrative
- Pair psychosis personas with mandatory debrief prompts in the UI

**Simulation limitation to acknowledge:** Brief AI sessions cannot replicate the disorientation of lived psychosis. Simulations give insight into symptom patterns but students must be told explicitly this is not experiential equivalence.

---

### 6. Addiction / Substance Use Personas

**Transtheoretical Model (TTM) — Prochaska's Stages of Change:**

The six stages provide a natural difficulty calibration axis for addiction personas:

| Stage | Patient Stance | PSKO Difficulty | MI Skill Target |
|---|---|---|---|
| Precontemplation | "I don't have a problem" | Advanced | Developing discrepancy, avoiding confrontation |
| Contemplation | "Maybe I should change, but..." | Intermediate | Exploring ambivalence, rolling with resistance |
| Preparation | "I want to change, need help" | Beginner/Intermediate | Strengthening commitment, action planning |
| Action | Currently changing | Beginner | Support, relapse prevention |
| Maintenance | Sustaining change | Beginner | Relapse prevention, identity consolidation |
| Relapse | Has relapsed, shame-laden | Advanced | Non-judgmental re-engagement |

**Motivational Interviewing alignment:**
- TTM-based interventions are most effective when "stage-matched" — this is the key design principle: each addiction persona's `cognitiveModel` should reflect a specific TTM stage, and `recommendedApproaches` should include `motivational-interviewing`.
- Stage of change should be encodable in `cognitiveModel.intermediateBeliefs` (e.g., "I can quit whenever I want to" = precontemplation; "I know I need to do something but I don't know how" = contemplation).
- The most training-valuable addiction persona is precontemplation/contemplation — this is where MI skill gaps are largest and confrontational approaches cause the most harm.

**Recommended first addiction personas:**
1. Alcohol Use Disorder, moderate, contemplation stage (intermediate difficulty)
2. Cannabis Use Disorder, mild, precontemplation stage (advanced difficulty — student will face denial and resistance)

---

### 7. Difficulty Calibration — Principles and Parameters

**From PatientSim (arxiv 2505.17818) and PATIENT-psi (arxiv 2405.19660):**

PatientSim defines personas across 4 axes: personality type, language proficiency, medical history recall level, and cognitive confusion level. PATIENT-psi uses 6 conversation styles derived from clinical expert consultation.

**Recommended difficulty parameter matrix for PSKO:**

| Parameter | Beginner | Intermediate | Advanced |
|---|---|---|---|
| Conversational style | `plain` | `verbose`, `reserved` | `upset`, `pleasing`, `tangent` |
| Emotional intensity | 1–2 | 3 | 4–5 |
| Number of core beliefs | 3 (simple, congruent) | 3–4 (with contradictions) | 4–5 (rigid, conflicting) |
| Defense mechanisms | Rationalization, avoidance | Projection, intellectualization | Splitting, dissociation, acting out |
| Symptom clarity | Single, clear presentation | Moderate comorbidity | Complex comorbidity, atypical presentation |
| Resistance to insight | Low | Moderate | High |
| Number of active triggers | 2–3 | 3–4 | 4–5 (some hidden until probed) |

**Key insight from AI simulation literature:** Difficulty in clinical simulation is primarily a function of *diagnostic ambiguity*, *patient resistance*, and *clinician countertransference challenge* — not symptom severity alone. A severely depressed but cooperative patient (Ayşe) is beginner; a mildly symptomatic but splitting BPD patient is advanced.

**Practical recommendation for PSKO:** Since `difficultyLevel` is currently not injected into the Claude prompt (confirmed by codebase analysis), behavioral complexity must be fully encoded in `cognitiveModel` and `conversationalStyle`. The difficulty parameter remains a UI-layer filter only. This is architecturally sound — do not change it.

---

### 8. Turkish Cultural Context

**Sources:** PMC11423985 (PLOS One, 2024), PMC11780694 (2025), and qualitative literature on Turkish psychotherapy perception.

**Somatization:**
- Emotional distress is commonly expressed through physical symptoms in Turkish clinical presentations. Depression and anxiety frequently present with headaches, chest pain, fatigue, or gastrointestinal complaints rather than mood-first language.
- Clinically: Turkish patients may initially deny emotional distress but report extensive physical symptoms. A persona backstory that leads with somatic complaints before disclosing emotional pain is culturally authentic.

**Collectivism and Family Dynamics:**
- Turkish culture is strongly collectivistic: family integrity takes priority over individual wellbeing. Patients frequently present with distress that is framed as interpersonal or relational ("my family is falling apart") rather than intrapsychic.
- Patients report problems "not as individual suffering but as disturbances to social relationships and community participation." A student using purely individual CBT conceptualization may miss the relational framing.
- Family opposition to mental health treatment is a real barrier — personas can include backstory elements where family discourages therapy ("my mother thinks I just need to pray more").
- The collectivist frame creates a specific training opportunity: students must learn to work *with* the family system, not against it.

**Stigma Patterns:**
- Stigma is high and specific: fear of being labeled (labels affect "marriageability"), fear of losing social standing, shame around emotional weakness.
- Men are significantly less likely to seek help than women — a male persona presenting for therapy is already navigating cultural resistance, which can be encoded in `defenses` (e.g., "minimization," "intellectualization").
- Religious fatalism is a documented barrier: some Turkish patients attribute psychological distress to divine will and resist secular therapeutic frameworks. This is a culturally authentic cognitive model element (intermediate belief: "If God wills it, I will recover").

**Help-Seeking Drivers:**
- Social isolation is the strongest predictor of help-seeking in Turkish samples — personas can reflect this pattern.
- Depression is seen as legitimately requiring help (community-disruptive framing); ADHD is highly stigmatized and resisted.
- Employed individuals are less likely to seek help — a working male presenting with unacknowledged burnout or depression is a highly culturally authentic persona.

**Clinical presentation variations:**
- Turkish patients interpret mental health through interdependence with their social group. Therapeutic success is often framed as "restoring my relationships" rather than "feeling better."
- Psychotherapy is perceived with some distrust — patients may test whether the therapist is trustworthy before disclosing. This maps directly to the `reserved` conversational style and `distrust` as a defense mechanism.

**Actionable persona design implications:**
1. Male personas should carry cultural resistance to help-seeking as encoded defenses (minimization, rationalization around weakness)
2. At least 2–3 personas should lead with somatic presenting problems to train students in detecting masked depression/anxiety
3. Family-conflict framing is a culturally authentic trigger category for Turkish personas
4. Religious/fatalistic intermediate beliefs should appear in at least 1–2 personas (e.g., "This is a test from God," "I shouldn't complain when others have it worse")
5. The `presentingProblem` for Turkish male personas should reflect minimization ("I'm here because my wife insisted" rather than "I've been feeling depressed")

---

### Sources

- [New Psychology Training Guidelines Address Treatment Gap for Serious Mental Illness — NewYork-Presbyterian](https://www.nyp.org/advances/article/psychiatry/new-psychology-training-guidelines-address-treatment-gap-for-serious-mental-illness)
- [Structured Clinical Interview for the DSM-5 (SCID PTSD Module) — VA National Center for PTSD](https://www.ptsd.va.gov/professional/assessment/adult-int/scid-ptsd-module.asp)
- [Psychometric properties of SCID-5-CV — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8119811/)
- [Trauma-Informed Care for Acute Care Settings: A Novel Simulation Training for Medical Students — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10376910/)
- [Simulation-Based Trauma-Informed Care Education Instills Empathy — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11638314/)
- [Standardized Patient Script and Feedback Rubric for BPD with AI-Simulated Patient — AAMC](https://www.aamc.org/about-us/mission-areas/medical-education/advancing-ai-resource-collection/standardized-patient-script-and-feedback-rubric-discussing-borderline-personality-disorder-ai)
- [The person behind the label: co-production as a tool in teaching about BPD — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8770063/)
- [Countertransference when working with NPD: An empirical investigation — PubMed](https://pubmed.ncbi.nlm.nih.gov/28581327/)
- [Evaluating the Effects of VR Simulation of Psychosis on Stigma, Empathy, and Knowledge — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9152122/)
- [Scoping Review: Simulation-Based Interventions on Reducing Stigma Toward Schizophrenia — Frontiers in VR](https://www.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2025.1404156/full)
- [Schizophrenia Simulations: What We've Learned — Mind Diagnostics](https://www.mind-diagnostics.org/blog/schizophrenia/schizophrenia-simulations-what-weve-learned)
- [Motivational Interviewing and the Stages of Change — MI Center for Change](https://blog.micenterforchange.com/just-what-is-the-relationship-between-stages-of-change-motivational-interviewing/)
- [Transtheoretical Model — Wikipedia](https://en.wikipedia.org/wiki/Transtheoretical_model)
- [PatientSim: A Persona-Driven Simulator for Realistic Doctor-Patient Interactions — arXiv](https://arxiv.org/html/2505.17818v2)
- [PATIENT-psi: Using LLMs to Simulate Patients for Training Mental Health Professionals — arXiv](https://arxiv.org/html/2405.19660v2)
- [Factors affecting seeking psychological and psychiatric support for Turkish society — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11423985/)
- [Cultural differences in diagnosis and treatment perceptions: Turkish collectivistic representations — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11780694/)
- [Closing the gap between training needs and training provision in addiction medicine — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7283115/)
- [Standardized Patient Assessment Of Learners In Medical Simulation — StatPearls/NCBI](https://www.ncbi.nlm.nih.gov/books/NBK546672/)

---

### Recommendations Summary

1. **Tier 1 personas to build first:** PTSD (female, single-incident trauma, intermediate), BPD (female, abandonment schema, advanced), Schizophrenia spectrum (male, early psychosis, advanced), Severe MDD (male, somatic presentation, intermediate).

2. **SCID-5 enrichment should add `symptomOnset`, `duration`, `functionalImpairment`, `priorTreatment`, and `traumaFlags`** as optional fields inside `cognitiveModel`. This avoids DB migrations and integrates cleanly with the existing architecture.

3. **Trauma personas must not contain graphic event descriptions.** Use clinical category labels in `traumaFlags`, impact-focused `backstory`, and trauma-cue `triggers`. Add a UI-level trigger warning for sessions with `traumaFlags` populated.

4. **BPD is the highest-value single addition.** It addresses the largest documented training gap, has AAMC AI-simulation precedent, and maps cleanly to existing conversational style infrastructure (`upset`/`pleasing` switching).

5. **Psychosis personas must pair positive symptoms with negative symptoms.** Use `tangent` style for disorganization, `reserved` style for negative symptom profiles. Never use `disorderProfile` to drive Claude behavior — rely entirely on `cognitiveModel`.

6. **Addiction personas should be built stage-matched to TTM.** Start with contemplation-stage alcohol use disorder (intermediate) and precontemplation cannabis use disorder (advanced). Add `motivational-interviewing` to `recommendedApproaches`.

7. **Turkish cultural authenticity requires:** somatic presenting problems for masked depression/anxiety, family-pressure triggers, male personas with minimizing defenses, and religious/fatalistic intermediate beliefs in at least 2 personas.

8. **Difficulty calibration is behavioral, not diagnostic.** Encode difficulty through `conversationalStyle` + `defenses` complexity + trigger count, not through DSM severity specifiers. This matches the current architecture where `difficultyLevel` is a UI filter only.
