# Tasks: Persona Library Expansion

> Spec: `2026-05-23-persona-expansion`
> Status: Ready to build
> Target: 18 personas (5 existing + 13 new), auto-registration, Zod validation, SCID-5 enrichment, trigger-warning UI

---

## Build DAG

### Phase 1: Foundation (Sequential)

| ID | Agent | Scope (write) | Reads | Depends On | Blocks | Est |
|----|-------|---------------|-------|------------|--------|-----|
| `schema` | alchemist | `psko-app/src/types/index.ts` | — | — | all | 30m |

**Deliverables:**
- Extend `CognitiveModel` with optional `scid5?: Scid5Fields` sub-object (`onsetAge`, `durationMonths`, `functionalImpairment: { social, occupational, other }`, `priorTreatment`, `traumaFlags`)
- Add optional `requiresTriggerWarning?: boolean` to `PersonaData` (OQ-3 Option A)
- Confirm/add `'motivational-interviewing'` to `TherapeuticApproach` union (FR-14, OQ-1)
- No `any` casts, `tsc --noEmit` clean

### Phase 2: Code Infrastructure (Parallel — smith × 2)

| ID | Agent | Scope (write) | Reads | Depends On | Blocks | Est |
|----|-------|---------------|-------|------------|--------|-----|
| `persona-loader` | smith-1 | `psko-app/src/lib/personas/index.ts`, `psko-app/src/lib/personas/schema.ts` (new) | `src/types/index.ts`, `src/lib/personas/library/**` | `schema` | `ui-trigger-warnings`, `tests` | 1.5h |
| `prompt-update` | smith-2 | `psko-app/src/lib/claude/prompts/patient-prompt.ts` | `src/types/index.ts` | `schema` | `tests` | 45m |

**`persona-loader` deliverables:**
- Refactor `src/lib/personas/index.ts` to dynamic directory scan (mirror `prisma/seed.ts` pattern: `fs.readdirSync` + `JSON.parse(fs.readFileSync(...))`)
- Create `src/lib/personas/schema.ts` exporting `PersonaDataSchema` (Zod) — mirrors `PersonaData` + `CognitiveModel` + optional `scid5`
- Throw on `PersonaDataSchema.parse()` failure with file path + Zod error detail
- Preserve `getPersonaById()` export
- Verify Next.js production build does not break (OQ-2); if `require()` causes issues, fall back to explicit `fs.readFileSync` reads

**`prompt-update` deliverables:**
- Inject `CLINICAL CONTEXT (SCID-5):` block under `COGNITIVE MODEL:` only when `persona.cognitiveModel.scid5` exists
- Each line conditional on its field's presence
- Output byte-for-byte identical to current behavior when `scid5` is absent (AC-4 regression check)

### Phase 3: Parallel Content Authoring (smith × 5)

All persona-content tasks can run in parallel. Each writes to a disjoint set of JSON files under `psko-app/src/lib/personas/library/`. No code dependencies — only the `schema` task is required (interface shape) so Zod can validate.

| ID | Agent | Scope (write) | Reads | Depends On | Est |
|----|-------|---------------|-------|------------|-----|
| `personas-trauma` | smith-3 | `library/elif-ptsd-intermediate.json`, `library/gunes-dissociative-advanced.json` | `library/ayse-depression-beginner.json` (reference), `src/types/index.ts` | `schema` | 1.5h |
| `personas-personality` | smith-4 | `library/ahmet-bpd-advanced.json`, `library/leyla-avpd-intermediate.json`, `library/hasan-npd-advanced.json` | reference files | `schema` | 2h |
| `personas-clinical` | smith-5 | `library/fatma-psychosis-advanced.json`, `library/kerem-ocd-intermediate.json`, `library/deniz-bipolar-intermediate.json` | reference files | `schema` | 2h |
| `personas-addiction` | smith-6 | `library/tarik-alcohol-advanced.json`, `library/burak-cannabis-intermediate.json` | reference files | `schema` | 1.5h |
| `personas-somatic` | smith-7 | `library/nur-social-anxiety-beginner.json`, `library/aylin-panic-beginner.json`, `library/irem-anorexia-intermediate.json` | reference files | `schema` | 2h |

**Authoring rules (apply to all content tasks):**
- Filename = `{first-name-lowercase}-{primary-disorder-slug}-{difficulty}.json`; `id` field matches filename without `.json` (FR-7)
- Turkish first names, Turkish `presentingProblem` + `backstory` (FR-8)
- Include `scid5` sub-object on every new persona (FR-4)
- Follow per-persona design notes in `spec.md` § Per-Persona Design Notes
- Trauma + psychosis personas: set `requiresTriggerWarning: true` (FR-16)
- BPD: never use "manipulative"; addiction: never use "alkoholik"/"bağımlı" in prompt-injected fields; eating: no weight numbers (Ethical Safeguards)
- Addiction personas: TTM stage encoded only in `intermediateBeliefs`, `recommendedApproaches` includes `motivational-interviewing` (FR-13, FR-14)
- Style/intensity alignment per spec table; respect NFR-7 final coverage

### Phase 4: UI + Tests + Seed (Parallel)

| ID | Agent | Scope (write) | Reads | Depends On | Est |
|----|-------|---------------|-------|------------|-----|
| `ui-trigger-warnings` | shaper-1 | `psko-app/src/app/dashboard/page.tsx`, `psko-app/src/components/session/` (new component file if needed) | `src/lib/personas/index.ts`, `src/types/index.ts` | `persona-loader` | 1.5h |
| `tests` | enforcer-1 | `psko-app/src/lib/personas/__tests__/loader.test.ts` (new), `psko-app/src/lib/personas/__tests__/schema.test.ts` (new), `psko-app/src/lib/claude/prompts/__tests__/patient-prompt.test.ts` (new) | all source under test | `persona-loader`, `prompt-update` | 1.5h |
| `seed-verify` | enforcer-2 | — (verification only; may touch `psko-app/scripts/` for repro notes) | `prisma/seed.ts`, `library/**` | `personas-content` (all 5), `persona-loader` | 30m |

**`ui-trigger-warnings` deliverables:**
- Modal shown before session start when selected persona has `requiresTriggerWarning === true` (FR-16)
- Return-to-selection button + explicit confirm-readiness CTA
- Post-session debrief reminder displayed on feedback screen for all `advanced` personas (FR-17)
- `requiresTriggerWarning` field never injected into Claude prompts (verified via `prompt-update` task)

**`tests` deliverables:**
- Loader: discovers all 18 JSON files, returns 18 personas (AC-1, AC-5)
- Schema: malformed JSON throws with file path + missing field name (AC-3)
- Schema: all 13 new personas pass `PersonaDataSchema.parse()` (AC-9)
- Prompt: `buildPatientPrompt()` with `scid5` includes SCID-5 block; without `scid5` output is byte-identical to baseline (AC-4)
- Prompt: `disorderProfile` value never appears in any persona's generated prompt (AC-8)
- Coverage: each of 6 conversational styles appears in ≥ 2 personas (AC-6)
- Use existing test style (node:test, see `frameworks.test.ts`)

**`seed-verify` deliverables:**
- Run `npx prisma db seed` against expanded library; verify idempotent upsert with exit code 0 (FR-18, AC-10)
- Verify `GET /api/personas` returns 18 entries
- No changes to `prisma/seed.ts` expected; if changes are required, treat as scope escalation

### Phase 5: Integration Gate (Sequential)

| ID | Agent | Scope | Depends On | Est |
|----|-------|-------|------------|-----|
| `integration` | enforcer-3 | `psko-app/tests/integration/personas.spec.ts` (new) | all prior phases | 1h |

**Deliverables:**
- End-to-end: select trauma persona → trigger warning modal → start session → patient prompt includes SCID-5 block → session lifecycle completes
- Verify NFR-1 (load time < 50ms added) via simple timing assertion in loader test
- All 6 acceptance criteria for parallel phases re-asserted

---

## Dependency Graph

```
schema
   │
   ├──► persona-loader ───┬──► ui-trigger-warnings ─┐
   │                      │                         │
   ├──► prompt-update ────┤                         │
   │                      └──► tests ───────────────┤
   │                                                │
   └──► personas-trauma       ─┐                    │
        personas-personality  ─┤                    │
        personas-clinical     ─┼──► seed-verify ────┤
        personas-addiction    ─┤                    │
        personas-somatic      ─┘                    │
                                                    │
                                              integration
```

---

## Scope Boundary Verification

No two parallel tasks share a writable path:

- `persona-loader` → `src/lib/personas/index.ts`, `src/lib/personas/schema.ts`
- `prompt-update` → `src/lib/claude/prompts/patient-prompt.ts`
- `personas-trauma` → 2 named JSON files (Elif, Güneş)
- `personas-personality` → 3 named JSON files (Ahmet, Leyla, Hasan)
- `personas-clinical` → 3 named JSON files (Fatma, Kerem, Deniz)
- `personas-addiction` → 2 named JSON files (Tarık, Burak)
- `personas-somatic` → 3 named JSON files (Nur, Aylin, İrem)
- `ui-trigger-warnings` → `src/app/dashboard/page.tsx`, `src/components/session/**` (new files only)
- `tests` → only files under `__tests__/` directories (new files)

All content tasks read but never modify `src/types/index.ts` or existing personas under `library/`. Verified disjoint.

---

## Progress

| Task | Status | Tests | Commit | Notes |
|------|--------|-------|--------|-------|
| schema | ✅ Done | tsc --noEmit clean | — | Scid5Fields, requiresTriggerWarning, motivational-interviewing added |
| persona-loader | ✅ Done | loader.test.ts 7/7 pass, schema.test.ts 5/5 pass, tsc --noEmit clean | — | smith-1: dynamic fs.readdirSync scan + Zod validation; schema.ts created; priorTreatment accepts string\|boolean during type/spec migration window |
| prompt-update | ✅ Done | patient-prompt-scid5.test.ts — 5/5 pass | — | smith-2: conditional SCID-5 block injected after COGNITIVE MODEL; byte-identical output when scid5 absent; tsc --noEmit clean |
| personas-trauma | ✅ Done | AC-9 pass (Zod + integration) | — | smith-3: elif-ptsd-intermediate + gunes-dissociative-advanced; requiresTriggerWarning: true on both |
| personas-personality | ✅ Done | AC-9 pass | — | smith-4: ahmet-bpd-advanced + leyla-avpd-intermediate + hasan-npd-advanced; no "manipulative" in BPD |
| personas-clinical | ✅ Done | AC-9 pass | — | smith-5: fatma-psychosis-advanced + kerem-ocd-intermediate + deniz-bipolar-intermediate |
| personas-addiction | ✅ Done | AC-9 pass | — | smith-6: tarik-alcohol-advanced + burak-cannabis-intermediate; TTM stages encoded; no forbidden terms |
| personas-somatic | ✅ Done | AC-9 pass | — | smith-7: nur-social-anxiety-beginner + aylin-panic-beginner + irem-anorexia-intermediate; no weight numbers |
| ui-trigger-warnings | ✅ Done | tsc clean | — | shaper-1: TriggerWarningModal + PersonaSelectClient; debrief reminder on advanced personas |
| tests | ✅ Done | 50/50 pass (loader 7, schema 5, prompt 5, integration 33) | — | enforcer-1 + enforcer-3; all ACs verified |
| seed-verify | ✅ Done | 18/18 upserted exit 0 (live DB); ethical guardrails clean | — | enforcer-2: report at scripts/seed-verify-report.md |
| integration | ✅ Done | personas.spec.ts 33/33 pass | — | enforcer-3: all 6 ACs + NFR-1 verified; red-check confirmed |

---

## Current Session

**Phase:** ALL PHASES COMPLETE ✅
**Active:** none
**Working on:** —
**Next:** `/audit-spec` → `/seal-spec`

---

## Decisions

- **OQ-1 (motivational-interviewing):** Add as a new `TherapeuticApproach` value in `schema` task. Stub `ApproachConfig` minimally — full approach module is a separate workstream per spec § Out of Scope.
- **OQ-2 (dynamic require):** Prefer `fs.readdirSync` + `fs.readFileSync` + `JSON.parse` over `require()` to avoid Next.js bundler ambiguity. Mirrors `prisma/seed.ts` exactly.
- **OQ-3 (requiresTriggerWarning):** Option A — explicit top-level field on `PersonaData`. Cleaner single source of truth and avoids deriving from `traumaFlags`.
- **OQ-5 (disorderProfile language):** Turkish DSM-5 labels for new personas (Turkish student audience). Existing 5 personas not backfilled.
- **OQ-6 (Güneş id):** `gunes-dissociative-advanced` (ASCII-safe, matches existing filename convention).
- **Test framework:** Use `node:test` to match existing pattern in `frameworks.test.ts`, not Vitest. Verify with build lead if mixed pattern is acceptable.
- **Backfill:** Existing 5 personas not modified with `scid5` (FR-4 marks backfill optional). Reduces risk and scope.

---

## Risk Areas

- **Clinical accuracy (NFR-3):** 13 new personas require DSM-5 review. Authoring tasks should flag uncertain cases (especially İrem/AN, Fatma/psychosis, Ahmet/BPD per Ethical Safeguards) for clinical review before merge. Define review owner before `personas-*` tasks start (OQ-4).
- **Ethical guardrails:** BPD ("manipulative"), addiction ("alkoholik"/"bağımlı"), eating (weight numbers), psychosis (horror framing) rules must be enforced per Ethical Safeguards. Tests do not catch these — manual review required.
- **Next.js production bundling (OQ-2):** Dynamic file reads must survive `next build`. Mitigation: use `fs.readFileSync` pattern from `prisma/seed.ts`; if it fails, fall back to a build-time codegen script that emits a static barrel file.
- **Shared types:** All parallel tasks read `src/types/index.ts` — `schema` task must land first before any parallel work fans out.
- **Style coverage (NFR-7, AC-6):** Final library must have ≥ 2 personas per conversational style. `tests` task verifies, but if coverage fails, an authoring task must be amended — likely owner is `personas-somatic` (most flexible style assignments).
- **Test file location:** `__tests__/` directories don't currently exist under `personas/` or `prompts/`. Test task creates them; verify no conflict with existing co-located test pattern (e.g., `frameworks.test.ts` sits next to source).
