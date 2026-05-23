/**
 * Persona Zod schema — runtime validation for PersonaData JSON files.
 *
 * Mirrors the TypeScript interfaces in `src/types/index.ts` (PersonaData,
 * CognitiveModel, Scid5Fields) so any malformed persona JSON file throws
 * loudly at load time instead of producing a silent broken patient prompt.
 *
 * spec: 2026-05-23-persona-expansion (FR-6)
 */

import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

const TherapeuticApproachSchema = z.enum([
  'cbt',
  'psychodynamic',
  'humanistic',
  'act',
  'dbt',
  'motivational-interviewing',
])

const DifficultyLevelSchema = z.enum(['beginner', 'intermediate', 'advanced'])

const ConversationalStyleSchema = z.enum([
  'plain',
  'upset',
  'reserved',
  'verbose',
  'pleasing',
  'tangent',
])

// ─── SCID-5 sub-schema ───────────────────────────────────────────────────────
//
// Note on `priorTreatment` typing — the codebase is mid-migration:
//   • spec.md §Technical Approach defines it as a free-text clinical note
//     (e.g. "No prior treatment", "6 months CBT, 2 years ago").
//   • src/types/index.ts (legacy) types it as `boolean`.
//   • Existing persona JSON files on disk use `boolean`.
//   • schema.test.ts fixture uses `string`.
// To keep both the loader (which must parse real on-disk JSON) and the
// schema test green during the migration window, the schema accepts either
// shape. A follow-up task can tighten this to `z.string()` once the JSON
// files and types/index.ts are reconciled per the spec.
const Scid5FieldsSchema = z
  .object({
    onsetAge: z.number().int().min(0).optional(),
    durationMonths: z.number().int().min(0).optional(),
    functionalImpairment: z
      .object({
        social: z.number().min(0).max(9),
        occupational: z.number().min(0).max(9),
        other: z.number().min(0).max(9),
      })
      .optional(),
    priorTreatment: z.union([z.string(), z.boolean()]).optional(),
    traumaFlags: z.array(z.string()).optional(),
  })
  .optional()

// ─── CognitiveModel ───────────────────────────────────────────────────────────

const CognitiveModelSchema = z.object({
  coreBeliefs: z.array(z.string()),
  intermediateBeliefs: z.array(z.string()),
  automaticThoughts: z.array(z.string()),
  emotionalState: z.object({
    primary: z.string(),
    intensity: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]),
    secondary: z.string().optional(),
  }),
  triggers: z.array(z.string()),
  defenses: z.array(z.string()),
  values: z.array(z.string()),
  scid5: Scid5FieldsSchema,
})

// ─── PersonaData ──────────────────────────────────────────────────────────────

export const PersonaDataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  age: z.number().int().min(0),
  presentingProblem: z.string().min(1).max(2000),
  backstory: z.string().min(1).max(2000),
  difficultyLevel: DifficultyLevelSchema,
  conversationalStyle: ConversationalStyleSchema,
  recommendedApproaches: z.array(TherapeuticApproachSchema),
  cognitiveModel: CognitiveModelSchema,
  disorderProfile: z.array(z.string()),
  requiresTriggerWarning: z.boolean().optional(),
})

export type PersonaDataParsed = z.infer<typeof PersonaDataSchema>
