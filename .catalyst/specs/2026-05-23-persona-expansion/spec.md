---
spec: 2026-05-23-persona-expansion
status: draft
domain: personas

provides:
  - 13 new DSM-5-grounded clinical personas (18 total)
  - SCID-5 enrichment sub-object inside cognitiveModel
  - Auto-registration of persona JSON files via directory scan
  - Zod runtime validation on persona load
  - SCID-5 field injection in buildPatientPrompt()
  - Coverage of all six conversationalStyle values
  - Trauma, personality disorder, psychosis, and addiction disorder categories
  - Turkish cultural authenticity patterns (somatic presentation, family-pressure framing, male help-seeking resistance)

requires:
  - spec: 2026-05-16-clinical-intelligence-engine
    needed: Phase engine and session lifecycle must be stable before new personas can be exercised in sessions

affects:
  - Session start flow (new personas selectable via persona library)
  - GET /api/personas (expanded library response)
  - Student-facing persona selector UI (new difficulty/category distribution)
  - Supervisor feedback agent (new disorder categories require no prompt changes, but clinical review of scoring rubric recommended)
  - Seeding pipeline (npx prisma db seed must be run after persona files are added)
  - UI session-start flow (trigger warnings for trauma and psychosis personas)

patterns_established: []
key_files: []
key_decisions: []
---

# Persona Library Expansion

> Status: DRAFT

---

## Overview

PSKO currently ships 5 patient personas covering MDD (mild), Prolonged Grief, GAD+Panic, Burnout/Adjustment, and relational depression. This spec expands the library to 18 personas by adding 13 new cases across previously uncovered disorder categories: trauma/PTSD, personality disorders (BPD, NPD, AVPD), psychosis spectrum, OCD, bipolar disorder, eating disorders, addiction/substance use, and somatic/anxiety presentations.

In parallel, three structural improvements are made to the persona system:

1. **Auto-registration** — `index.ts` moves from manual static imports to a directory scan, eliminating the maintenance risk of import/JSON mismatches as the library grows.
2. **SCID-5 enrichment** — optional structured clinical fields (`onsetAge`, `durationMonths`, `functionalImpairment`, `priorTreatment`, `traumaFlags`) are added as an optional `scid5` sub-object inside `cognitiveModel`. No DB migration is required because `cognitiveModel` is a freeform `Json` blob in Prisma.
3. **Zod validation** — runtime schema validation is added at persona load time to catch malformed JSON files immediately rather than producing silent broken prompts.

All new personas follow the established conventions: fictional Turkish first names, Turkish/Istanbul-Ankara cultural context, DSM-5-grounded cognitive models, and behavioral complexity encoded entirely in `cognitiveModel` and `conversationalStyle` (not in `difficultyLevel`, which remains a UI filter only).

Two high-risk personas (severe MDD with suicidal ideation, ASPD) are explicitly deferred to Phase 5 pending crisis protocol implementation.

---

## User Stories

**US-1** — As a psychology student, I want to practice with a patient presenting early psychosis so I can develop skills in this underrepresented population before clinical placement.

**US-2** — As a psychology student, I want to practice with an addiction patient who denies having a problem so I can develop Motivational Interviewing skills before using them with real clients.

**US-3** — As a psychology student, I want to practice with a patient who emotionally escalates during the session so I can learn to de-escalate and maintain the therapeutic frame.

**US-4** — As a psychology student, I want to practice with a patient who presents with physical complaints before disclosing emotional distress, reflecting the somatic help-seeking pattern common in Turkey.

**US-5** — As a psychology student, I want to be warned before entering a trauma or psychosis simulation so I can prepare myself and take breaks if needed.

**US-6** — As an educator, I want the persona library to cover all conversational styles and major disorder categories so I can assign targeted cases to students based on their developmental stage.

**US-7** — As a developer, I want persona JSON files to be discovered automatically so that adding a new persona does not require changes to `index.ts`.

**US-8** — As a developer, I want malformed persona JSON to be caught at startup with a descriptive error rather than silently producing a broken simulation prompt.

---

## Requirements

### Functional

- [ ] **FR-1** — The persona library must expand from 5 to 18 personas covering all disorder categories in the approved catalog (see Persona Catalog section).
- [ ] **FR-2** — `src/lib/personas/index.ts` must be refactored to auto-discover all `.json` files in `src/lib/personas/library/` at startup, mirroring the pattern in `prisma/seed.ts`.
- [ ] **FR-3** — The `CognitiveModel` TypeScript interface must be extended with an optional `scid5` sub-object containing: `onsetAge?: number`, `durationMonths?: number`, `functionalImpairment?: { social: number; occupational: number; other: number }` (0–9 scale, matching SCID-5 conventions), `priorTreatment?: string`, `traumaFlags?: string[]`.
- [ ] **FR-4** — All 13 new personas must include the `scid5` sub-object. Backfilling existing 5 personas is optional but recommended for consistency.
- [ ] **FR-5** — `buildPatientPrompt()` must conditionally inject `scid5` fields into the Claude system prompt when the `scid5` sub-object is present on a persona. See Technical Approach for the injection format.
- [ ] **FR-6** — A Zod schema (`PersonaDataSchema`) must be defined and applied at the persona load step in `index.ts`. Any persona file failing validation must throw an error with the persona file path and Zod error details.
- [ ] **FR-7** — The persona filename format must follow: `{first-name-lowercase}-{primary-disorder-slug}-{difficulty}.json`. The `id` field inside the JSON must match the filename without the `.json` extension.
- [ ] **FR-8** — All new personas must include Turkish first names, Turkish/Istanbul-Ankara cultural settings, and Turkish-language `presentingProblem` and `backstory` fields.
- [ ] **FR-9** — Male personas must include culturally authentic help-seeking resistance encoded in `defenses` (e.g., minimization, rationalization).
- [ ] **FR-10** — At least 3 personas must use somatic presenting problems (physical symptom-first disclosure) to train students in detecting masked depression and anxiety.
- [ ] **FR-11** — At least 2 personas must include family-pressure framing in `backstory` or `presentingProblem` (e.g., "ailem ısrar etti" / "my family insisted").
- [ ] **FR-12** — Religious/fatalistic intermediate beliefs (e.g., "Bu Allah'ın bir sınavı") must appear in at least 2 personas where culturally appropriate.
- [ ] **FR-13** — Addiction personas must encode the Transtheoretical Model (TTM) stage in `cognitiveModel.intermediateBeliefs` and must NOT label the stage in `backstory` or `presentingProblem`.
- [ ] **FR-14** — `motivational-interviewing` must be added to `recommendedApproaches` for all addiction personas. Confirm it is a valid `TherapeuticApproach` value; if not, add it.
- [ ] **FR-15** — The `disorderProfile` field must NOT be injected into Claude system prompts for any persona (existing behavior preserved). All new personas must rely entirely on `cognitiveModel` and `conversationalStyle` to drive Claude's simulation behavior.
- [ ] **FR-16** — The UI session-start flow must display a trigger warning before any session with a persona flagged as `requiresTriggerWarning: true` at the persona metadata level. Trauma and psychosis personas must carry this flag. (UI implementation may be a separate ticket; the flag itself must be present in the JSON.)
- [ ] **FR-17** — The UI must display a post-session debrief reminder for all `advanced` personas. (UI implementation may be a separate ticket; the spec establishes this as a requirement.)
- [ ] **FR-18** — After adding all new JSON files, `npx prisma db seed` must complete without errors.

### Non-Functional

- [ ] **NFR-1** — Zod validation at startup must add no more than 50ms to cold-start time for a 20-persona library.
- [ ] **NFR-2** — Auto-discovery must not break hot-reload behavior in Next.js development mode.
- [ ] **NFR-3** — All new personas must be reviewed for DSM-5 accuracy and cultural authenticity before merging (per `concerns.md` §5 — clinical validity gate).
- [ ] **NFR-4** — No new top-level Prisma DB columns are introduced. All SCID-5 enrichment lives inside the existing `cognitiveModel` JSON blob column.
- [ ] **NFR-5** — Psychosis personas must use neutral clinical framing. They must not use horror tropes, dramatic violence, or descriptions designed to evoke fear. (See Ethical Safeguards section.)
- [ ] **NFR-6** — BPD personas must not describe the patient as "manipulative." Splitting behavior must be modeled through `cognitiveModel.emotionalState` volatility and `upset`/`pleasing` style alternation.
- [ ] **NFR-7** — All 6 conversational styles (`plain`, `upset`, `reserved`, `verbose`, `pleasing`, `tangent`) must be represented in the final 18-persona library.
- [ ] **NFR-8** — TypeScript must compile without errors after interface changes. No `any` casts introduced.

---

## Acceptance Criteria

**AC-1** — `src/lib/personas/index.ts` exports a `personaLibrary` array containing exactly 18 personas without any manual import statements for individual persona files.

**AC-2** — Adding a new JSON file to `src/lib/personas/library/` and restarting the dev server causes the persona to appear in `GET /api/personas` without any changes to `index.ts`.

**AC-3** — Dropping a malformed JSON file (missing required field) into `library/` causes the application startup to throw an error that includes the filename and the specific missing field(s).

**AC-4** — `buildPatientPrompt()` called with a persona that has `cognitiveModel.scid5` populated produces a system prompt that includes the SCID-5 fields. Called with a persona without `scid5`, the output is identical to the current behavior.

**AC-5** — `GET /api/personas` returns exactly 18 personas after seeding.

**AC-6** — Each of the 6 conversational styles appears in at least 2 personas across the full library.

**AC-7** — Each of the disorder categories (Mood, Trauma, Personality, Psychosis, OCD, Bipolar, Addiction, Eating, Cultural/Somatic) has at least 1 persona in the library.

**AC-8** — No persona's `disorderProfile` array value appears in any Claude system prompt (verified by inspecting `buildPatientPrompt()` output for each persona).

**AC-9** — All 13 new personas pass `PersonaDataSchema.parse()` without errors.

**AC-10** — `npx prisma db seed` completes idempotently with 18 personas upserted.

---

## Technical Approach

### Auto-Registration

**Current state:** `src/lib/personas/index.ts` contains one `import` statement per persona and manually pushes each to a `personaLibrary` array. Adding a persona requires editing this file.

**Target state:** `index.ts` uses Node's `fs.readdirSync` (or `require.context` equivalent for Next.js) to enumerate all `.json` files in the `library/` directory at module load time, dynamically `require()`s each, runs Zod validation, and assembles `personaLibrary`.

**Reference pattern:** `prisma/seed.ts` already does this — it uses `fs.readdirSync(libraryPath)` and a filter for `.json` files. `index.ts` must mirror this pattern.

**Implementation note:** Next.js server-side modules (API routes) run in a Node.js context where `fs` and `path` are available. The `library/` directory contents are bundled at build time. Verify that dynamic `require()` inside a loop does not break Next.js tree-shaking in production — if it does, the alternative is a build-time code-generation script that outputs a static `index.ts` from the directory contents.

### SCID-5 Schema Extension

The `CognitiveModel` interface in `src/types/index.ts` gains one optional sub-object:

```typescript
scid5?: {
  onsetAge?: number                          // Patient age when symptoms began
  durationMonths?: number                    // Total months symptomatic at time of persona
  functionalImpairment?: {
    social: number                           // 0–9 SCID-5 scale (0=none, 8=severe)
    occupational: number                     // 0–9
    other: number                            // 0–9 (e.g., self-care)
  }
  priorTreatment?: string                    // e.g., "No prior treatment", "6 months CBT, 2 years ago"
  traumaFlags?: string[]                     // Clinical category labels only — no narrative descriptions
                                             // e.g., ["tek-olay travma — iş kazası", "çocukluk ihmal geçmişi"]
}
```

**No DB migration required.** The Prisma `Persona.cognitiveModel` column is typed as `Json`. Extending the sub-object does not change the column type or require a migration. The seed upsert will write the new fields transparently.

**Backfill:** Existing 5 personas do not require `scid5`. The field is optional. Backfill is recommended for curriculum consistency but is not a blocking requirement for this spec.

### Zod Validation

A `PersonaDataSchema` Zod schema must be added to `src/lib/personas/index.ts` (or a co-located `schema.ts`). It must mirror the `PersonaData` and `CognitiveModel` interfaces, including the optional `scid5` sub-object.

At load time, each dynamically-required JSON must be passed through `PersonaDataSchema.parse()`. Any failure must:
1. Throw immediately (do not continue loading remaining personas with a broken entry in the array)
2. Include the file path and the Zod error output in the thrown error message

This converts silent type-cast failures (current state) into loud, diagnosable startup errors.

**Schema file location:** `src/lib/personas/schema.ts` (new file, consistent with architecture.md's planned `personas/schema.ts`).

### Patient Prompt Update

`buildPatientPrompt()` in `src/lib/claude/prompts/patient-prompt.ts` must be updated to inject SCID-5 fields when present. Injection is additive — the function signature and all existing behavior remain unchanged.

The SCID-5 block is injected under `COGNITIVE MODEL:`, after the existing fields, using this format:

```
CLINICAL CONTEXT (SCID-5):
- Symptoms began at age: {onsetAge}
- Duration: {durationMonths} months
- Functional impairment — Social: {social}/9, Occupational: {occupational}/9, Other: {other}/9
- Prior treatment: {priorTreatment}
- Relevant history flags: {traumaFlags joined by ", "}
```

Each line is only included if the corresponding field is present. The block is omitted entirely if `scid5` is absent.

**Verification:** After this change, call `buildPatientPrompt()` with both a persona that has `scid5` and one that does not. Assert that the output of the latter is byte-for-byte identical to the current output (no regression).

### Persona Authoring Guide

This section is normative — all new persona JSON files must follow these rules.

**Filename format:** `{first-name-lowercase}-{primary-disorder-slug}-{difficulty}.json`
- Example: `elif-ptsd-intermediate.json`
- The `id` field in the JSON must equal the filename without `.json`.

**Turkish language fields:** `presentingProblem` and `backstory` must be written in Turkish. All other fields (`coreBeliefs`, `automaticThoughts`, etc.) may be in Turkish or English — choose consistently within a persona. (Current library uses English for cognitive model fields.)

**`disorderProfile` field:** Include accurate DSM-5 label(s) for educational reference and UI display. Never include diagnosis terms in `presentingProblem`, `backstory`, `coreBeliefs`, `automaticThoughts`, or `intermediateBeliefs`.

**`conversationalStyle` + `emotionalState.intensity` alignment:**

| Style | Expected intensity range |
|-------|--------------------------|
| `plain` | 2–3 |
| `reserved` | 2–4 |
| `verbose` | 3–4 |
| `pleasing` | 3–4 |
| `upset` | 4–5 |
| `tangent` | 3–5 |

**`defenses` field format:** Each defense should include a label in parentheses followed by a one-sentence behavioral manifestation.
- Example: `"Minimization (downplays severity of drinking): 'I just have a couple of beers after work, everyone does that.'"` 

**Somatic presenting problem format:** For personas with somatic help-seeking patterns, `presentingProblem` must lead with a physical symptom and disclose emotional distress only indirectly or not at all.
- Example: `"Sürekli başım ağrıyor ve yorgunluktan bir türlü kurtulamıyorum. Doktorlar bir şey bulamadı, belki stres diyorlar."` (I constantly have headaches and can't shake the fatigue. Doctors couldn't find anything, maybe they say it's stress.)

**TTM stage encoding for addiction personas:** The patient's stage of change must appear as an intermediate belief, not a diagnostic label.
- Precontemplation: `"İçmek istemiyorum ama bir sorunum olduğunu da düşünmüyorum."` (I don't want to stop but I also don't think I have a problem.)
- Contemplation: `"Belki bir şeyleri değiştirmem gerekiyor ama nasıl yapacağımı bilmiyorum."` (Maybe I need to change things but I don't know how.)

**`traumaFlags` field:** Use clinical category labels only. No narrative descriptions, perpetrator details, or graphic event descriptions.
- Permitted: `["tek-olay travma — iş kazası", "travma sonrası güven sorunları"]`
- Not permitted: `["2019'da üstü tarafından tacize uğradı"]`

---

## Persona Catalog

### Complete 18-Persona Library

#### Existing Personas (5)

| # | ID | İsim | Disorder | Difficulty | Style | Category |
|---|-----|------|----------|------------|-------|----------|
| 1 | `ayse-depression-beginner` | Ayşe | Major Depressive Disorder, mild | beginner | plain | Mood |
| 2 | `zeynep-grief-beginner` | Zeynep | Prolonged Grief Disorder | beginner | plain | Mood |
| 3 | `mert-anxiety-intermediate` | Mert | GAD + Panic Disorder | intermediate | verbose | Anxiety |
| 4 | `can-burnout-intermediate` | Can | Occupational Burnout + Adjustment Disorder | intermediate | reserved | Occupational |
| 5 | `selin-relational-advanced` | Selin | Anxious-preoccupied attachment + Recurrent depression | advanced | pleasing | Relational |

#### New Personas (13)

| # | ID | İsim | Primary Disorder | Difficulty | Style | Category | Trigger Warning |
|---|-----|------|-----------------|------------|-------|----------|-----------------|
| 6 | `elif-ptsd-intermediate` | Elif | PTSD (workplace accident) | intermediate | reserved | Trauma | Yes |
| 7 | `ahmet-bpd-advanced` | Ahmet | Borderline Personality Disorder | advanced | upset | Personality | No |
| 8 | `fatma-psychosis-advanced` | Fatma | Early psychosis / schizophrenia spectrum | advanced | tangent | Psychosis | Yes |
| 9 | `kerem-ocd-intermediate` | Kerem | OCD (contamination subtype) | intermediate | verbose | OCD | No |
| 10 | `deniz-bipolar-intermediate` | Deniz | Bipolar II Disorder | intermediate | verbose | Bipolar | No |
| 11 | `tarik-alcohol-advanced` | Tarık | Alcohol Use Disorder (precontemplation) | advanced | reserved | Addiction | No |
| 12 | `nur-social-anxiety-beginner` | Nur | Social Anxiety Disorder + somatisation | beginner | plain | Cultural/Somatic | No |
| 13 | `burak-cannabis-intermediate` | Burak | Cannabis Use Disorder (contemplation) | intermediate | pleasing | Addiction | No |
| 14 | `leyla-avpd-intermediate` | Leyla | Avoidant Personality Disorder | intermediate | reserved | Personality | No |
| 15 | `irem-anorexia-intermediate` | İrem | Anorexia Nervosa (restricting type) | intermediate | pleasing | Eating | No |
| 16 | `hasan-npd-advanced` | Hasan | Narcissistic Personality Disorder | advanced | upset | Personality | No |
| 17 | `aylin-panic-beginner` | Aylin | Panic Disorder + somatisation | beginner | verbose | Cultural/Somatic | No |
| 18 | `gunes-dissociative-advanced` | Güneş | Dissociative disorder (DDNOS) | advanced | tangent | Trauma | Yes |

### Style Coverage After Expansion

| Style | Persona Count | Personas |
|-------|--------------|----------|
| `plain` | 3 | Ayşe, Zeynep, Nur |
| `reserved` | 3 | Can, Elif, Tarık, Leyla* |
| `verbose` | 3 | Mert, Kerem, Deniz, Aylin* |
| `pleasing` | 3 | Selin, Burak, İrem |
| `upset` | 2 | Ahmet, Hasan |
| `tangent` | 2 | Fatma, Güneş |

*Note: reserved and verbose each have 4 personas after expansion. All 6 styles are now represented with at least 2 personas each, satisfying NFR-7.

### Disorder Category Coverage

| Category | Personas |
|----------|----------|
| Mood | Ayşe, Zeynep |
| Anxiety / OCD | Mert, Kerem |
| Trauma | Elif, Güneş |
| Personality | Ahmet (BPD), Leyla (AVPD), Hasan (NPD), Selin (relational) |
| Psychosis | Fatma |
| Bipolar | Deniz |
| Addiction | Tarık, Burak |
| Eating | İrem |
| Cultural/Somatic | Nur, Aylin |
| Occupational | Can |

### Per-Persona Design Notes

**Elif — PTSD (intermediate, reserved)**
- Workplace accident as trauma source. Focus: functional impairment over graphic event description.
- `backstory` describes impact (hypervigilance, avoidance of workplace) not the accident itself.
- `traumaFlags`: `["tek-olay travma — iş kazası"]`
- Male authority figures and loud sudden sounds as `triggers`.
- `reserved` style reflects trauma-driven avoidance and distrust. Requires multiple questions before disclosure.
- `scid5.functionalImpairment`: social 5/9, occupational 7/9.
- Trigger warning required.

**Ahmet — BPD (advanced, upset)**
- Young adult male. Cultural framing: male emotional volatility is not normalized in Turkish context, adding a layer of shame.
- `emotionalState`: `primary: "öfkeli"`, `intensity: 5`, `secondary: "boş"`.
- `coreBeliefs` center on abandonment: "Herkes sonunda beni terk eder" (Everyone eventually abandons me).
- `defenses`: splitting mapped as rapid idealization/devaluation within the session. Described as emotional volatility, NOT as "manipulative."
- `conversationalStyle: "upset"` reflects emotional activation. May shift toward `pleasing` mid-session to reflect splitting — this is described in `backstory` context but the JSON style field is `upset`.
- No trigger warning required. Post-session debrief reminder required (advanced).

**Fatma — Early psychosis (advanced, tangent)**
- Young female university student. Positive symptoms: ideas of reference, mild paranoid ideation, auditory experiences (ambiguous, not command hallucinations).
- Negative symptoms: avolition, flat affect encoded in low secondary emotional intensity.
- `conversationalStyle: "tangent"` reflects disorganized thinking — thoughts fragment and loop.
- `backstory` describes functional decline (stopped attending classes, withdrawn from friends) without horror framing.
- `automaticThoughts` include fragmented, contextually odd but not overtly threatening cognitions.
- `disorderProfile`: `["Kısa Psikotik Bozukluk / Şizofreni Spektrum Bozukluğu (erken dönem)"]` — not injected into prompt.
- `scid5.functionalImpairment`: social 6/9, occupational 7/9.
- Trigger warning required. Post-session debrief reminder required.

**Kerem — OCD contamination (intermediate, verbose)**
- Adult male. Contamination obsessions, cleaning and checking compulsions.
- `verbose` style: over-explains rituals and rationale, difficult to keep on topic.
- `backstory` includes somatic framing: presents initially with hand skin damage from washing, not with "obsession" language.
- `coreBeliefs`: "Kirlenmiş bir şeye dokunursam başkalarına zarar veririm" (If I touch something contaminated I'll harm others). Responsibility schema.
- `recommendedApproaches`: `["cbt", "act"]` — ERP is the evidence-based treatment and is embedded within CBT framing.

**Deniz — Bipolar II (intermediate, verbose)**
- Adult. Currently in a depressive episode; hypomanic episode disclosed in `backstory`.
- `verbose` style reflects residual hypomanic activation energy mixed with depressive thought content.
- `intermediateBeliefs` include mood-congruent rules ("Enerjim varken her şeyi yapmalıyım" / "When I have energy I must do everything").
- `scid5.durationMonths` reflects the current episode duration.
- `recommendedApproaches`: `["cbt", "dbt"]`.

**Tarık — Alcohol Use Disorder precontemplation (advanced, reserved)**
- Middle-aged male. Culturally authentic presentation: presents because wife insisted ("karım ısrar etti"). Minimizes alcohol use throughout.
- `reserved` style reflects resistance and emotional unavailability typical of precontemplation stage.
- `defenses`: minimization and rationalization of drinking behavior.
- `intermediateBeliefs` encode precontemplation: "İçmem kimseye zarar vermiyor, kontrol bende" (My drinking harms no one, I'm in control).
- `recommendedApproaches`: `["motivational-interviewing"]`.
- No `traumaFlags`. `scid5.priorTreatment`: "Hiç tedavi almadı" (No prior treatment).
- Family-pressure framing in `presentingProblem`.

**Nur — Social anxiety + somatisation (beginner, plain)**
- Young adult female. Somatic presenting problem: "çarpıntı ve terleme" (palpitations and sweating) before disclosing social fear.
- `beginner` difficulty: cooperative, clear response to empathic reflection.
- `backstory` includes family discouragement of emotional disclosure ("abartıyorsun" / "you're exaggerating").
- Cultural authenticity: stigma around mental health, somatic idiom of distress.
- `recommendedApproaches`: `["cbt", "humanistic"]`.

**Burak — Cannabis Use Disorder contemplation (intermediate, pleasing)**
- Young adult male. Contemplation stage: ambivalent, wants to please the therapist, says he's "thinking about it" but not committed.
- `pleasing` style: agrees readily, downplays resistance, but cognitive model reveals ongoing ambivalence.
- `intermediateBeliefs` encode contemplation: "Belki bırakmalıyım ama sosyal hayatım için önemli" (Maybe I should quit but it's important for my social life).
- `recommendedApproaches`: `["motivational-interviewing", "cbt"]`.
- Religious/fatalistic belief where appropriate: optional, evaluate in authoring.

**Leyla — Avoidant Personality Disorder (intermediate, reserved)**
- Adult female. Pattern of social inhibition, feelings of inadequacy, hypersensitivity to negative evaluation.
- `reserved` style reflects avoidance of self-disclosure and fear of judgment from therapist.
- `coreBeliefs`: "Yetersizim ve başkaları bunu anlayacak" (I'm inadequate and others will see it).
- `backstory`: few close relationships, history of job changes to avoid performance evaluation.
- `recommendedApproaches`: `["cbt", "humanistic"]`.

**İrem — Anorexia Nervosa restricting (intermediate, pleasing)**
- Young adult female. `pleasing` style: minimizes symptoms, presents as doing well, denies severity.
- `coreBeliefs` include weight/shape-related worthiness beliefs and control schemas.
- `scid5.functionalImpairment` reflects medical and social impairment without specifying weight numbers in cognitive model fields.
- `backstory` focuses on control, perfectionism, and family expectations — not weight numbers.
- `recommendedApproaches`: `["cbt", "humanistic"]`.
- Clinical review required: eating disorder personas carry highest risk of clinically inaccurate portrayal.

**Hasan — NPD (advanced, upset)**
- Middle-aged professional male. Grandiose self-image, devaluation of the therapist, entitlement.
- `upset` style: condescending edge, impatient, dismissive.
- `coreBeliefs`: grandiosity as defense against underlying inadequacy schema (consistent with psychodynamic NPD formulation).
- `automaticThoughts` include devaluing thoughts about the therapist.
- `defenses`: devaluation, projection.
- Cultural note: professional male seeking therapy carries stigma; Hasan frames attendance as "coming to see if this is worth my time."
- `recommendedApproaches`: `["psychodynamic", "cbt"]` (TFP/MBT principles embedded in psychodynamic approach).

**Aylin — Panic Disorder + somatisation (beginner, verbose)**
- Adult female. Somatic presenting problem: chest pain, shortness of breath, fear of cardiac event.
- `verbose` style: over-describes physical symptoms, catastrophizes in detail.
- `beginner` difficulty: cooperative once physical symptoms are acknowledged as distress-related.
- Cultural authenticity: somatic idiom. Doctor-shopping before reaching psychology.
- `scid5.priorTreatment`: multiple cardiology referrals with no organic finding.
- `recommendedApproaches`: `["cbt", "humanistic"]`.

**Güneş — Dissociative disorder DDNOS (advanced, tangent)**
- Young adult. Dissociative episodes, depersonalization, memory gaps. Trauma history.
- `tangent` style: narrative jumps, loses thread, occasionally describes events in third person.
- `traumaFlags`: `["çocukluk çağı travması — duygusal ihmal", "dissosiyatif belirtiler"]`.
- `backstory` describes functional impact of dissociative episodes, not graphic trauma content.
- `scid5.functionalImpairment` reflects significant social impairment.
- Trigger warning required. Post-session debrief reminder required.

---

## Ethical Safeguards

### Trigger Warnings

Three personas require a UI-level trigger warning before session start: Elif (PTSD), Fatma (psychosis), and Güneş (dissociative/trauma). The mechanism is a `requiresTriggerWarning: true` field in the persona JSON. The UI must:
1. Display a modal before the session begins explaining the sensitive nature of the content.
2. Provide an option to return to the persona selection screen.
3. Not proceed until the student actively confirms readiness.

This field is metadata — it must not be injected into the Claude system prompt.

### Post-Session Debrief Reminder

All three `advanced` personas that carry trigger warnings (Elif, Fatma, Güneş) and all `advanced` personas in general (Ahmet, Tarık, Hasan, Selin) must trigger a post-session debrief reminder in the UI. This is a soft nudge ("How are you feeling after this session?") displayed on the feedback screen, not a hard gate.

### Psychosis Framing Rules

- Positive symptoms (hallucinations, paranoia) must be represented through ambiguous, low-intensity descriptions. No command hallucinations, no violence-adjacent content.
- Negative symptoms (avolition, alogia, flat affect) must be given equal weight through `reserved` style elements and `backstory` functional decline.
- The `disorderProfile` field for Fatma must not be injected into the Claude prompt (preserved by existing architecture).
- Fatma's session must not produce output that reinforces the "dangerous mentally ill person" stereotype. If the simulation is observed to do so during testing, the `cognitiveModel` must be revised.

### BPD Authoring Rules

- The word "manipulative" must not appear in Ahmet's JSON file in any field.
- Splitting behavior is represented through `emotionalState` with high `intensity` (5), a `secondary` emotion that contrasts with the `primary`, and `upset` conversational style — not through narrative description.
- `defenses` for Ahmet must include: idealization, devaluation, and emotional reactivity — described behaviorally, not pejoratively.

### Addiction Representation Rules

- TTM stage must be encoded in `cognitiveModel.intermediateBeliefs`, not labeled in `backstory` or `presentingProblem`.
- Neither Tarık's nor Burak's JSON file may use the word "alkoholik" (alcoholic) or "bağımlı" (addict/dependent) in any field that is injected into the Claude prompt. The `disorderProfile` field may use DSM-5 labels; these are not injected.

### Eating Disorder Authoring Rules

- İrem's JSON must not include specific weight numbers, BMI values, or caloric restriction details in any field.
- The `backstory` and `presentingProblem` focus on psychological themes (control, perfectionism, fear of weight gain) without clinical measurement language.

### Deferred High-Risk Personas

The following personas are explicitly out of scope for this spec:

| Persona | Reason for Deferral |
|---------|---------------------|
| Severe MDD with suicidal ideation | Crisis protocol not yet implemented (Phase 5) |
| ASPD | Highest simulation harm risk; requires expert review of ethical guardrails |

---

## Out of Scope

- Personas with suicidal ideation (Phase 5 only).
- ASPD persona (Phase 5 only).
- UI changes for persona filtering by disorder category (may be addressed in a separate UI spec).
- Changes to the supervisor feedback agent prompts for new disorder categories (separate spec if needed).
- Versioning system for persona files (no version field currently; not added in this spec).
- Backfilling existing 5 personas with `scid5` enrichment (recommended but not required).
- Multilingual support (all personas are Turkish-only; hardcoded in the patient prompt).
- Student progress gating by difficulty level (no guard currently exists; this spec does not add one).
- `motivational-interviewing` as a new therapeutic approach module (if it does not already exist as a `TherapeuticApproach` value, adding it is in-scope for FR-14 but the full approach module with `guidanceHints` and `supervisorCriteria` is a separate workstream).

---

## Open Questions

**OQ-1 — Does `motivational-interviewing` exist as a `TherapeuticApproach` value?**
The current `TherapeuticApproach` type includes: `cbt`, `psychodynamic`, `humanistic`, `act`, `dbt`. If `motivational-interviewing` is not present, FR-14 requires adding it. Confirm before implementation and determine whether a full `ApproachConfig` module is needed or whether a stub is sufficient for this spec.

**OQ-2 — Next.js dynamic require() in production bundle.**
Auto-registration uses `fs.readdirSync` + dynamic `require()` at module load time. Confirm that this pattern survives Next.js production build and does not cause a bundler error. If it does, the alternative is a build-time code-generation script that writes a static barrel file.

**OQ-3 — Should `requiresTriggerWarning` be a top-level persona field or a UI concern?**
Option A: Add `requiresTriggerWarning: boolean` to the `PersonaData` JSON and TypeScript interface — clean single source of truth, but adds a field to the interface. Option B: Derive the warning from the `cognitiveModel.scid5.traumaFlags` array or `difficultyLevel` — no new field, but less explicit. Recommendation: Option A. Confirm before implementation.

**OQ-4 — Clinical review process.**
NFR-3 requires clinical accuracy review before merging. Who performs this review? Is it a checklist gate in the PR process, or does it require an external clinical consultant? Define the review owner before authoring begins.

**OQ-5 — `disorderProfile` field language.**
Existing personas use English DSM-5 labels (e.g., `"Major Depressive Disorder, mild"`). Should new personas use Turkish labels (`"Majör Depresif Bozukluk, hafif"`) for UI display consistency with the Turkish student audience? Establish a convention before authoring new files.

**OQ-6 — `id` field for Güneş.**
Turkish character `ş` in `gunes` (without diacritic) is the established convention (filenames are ASCII-safe). Confirm `gunes-dissociative-advanced` as the canonical ID.
