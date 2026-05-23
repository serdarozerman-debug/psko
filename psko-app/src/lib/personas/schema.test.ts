/**
 * RED PHASE — Persona Schema (Zod) Tests
 * spec: 2026-05-23-persona-expansion
 * task: tests (enforcer-1)
 *
 * ALL tests in this file FAIL because src/lib/personas/schema.ts does not
 * exist yet.  The import below will throw MODULE_NOT_FOUND at module load time,
 * which is the correct "missing feature" failure reason (not a test typo).
 *
 * When the persona-loader task creates schema.ts and exports PersonaDataSchema,
 * tests 2-6 will then enter the green/red cycle independently.
 */

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

// ─── This import causes the entire file to fail with MODULE_NOT_FOUND until
//     src/lib/personas/schema.ts is created by the persona-loader task.
//     That is the intended RED state. ────────────────────────────────────────
import { PersonaDataSchema } from './schema'

// ─── Minimal valid persona fixture (no scid5) ─────────────────────────────────

const VALID_PERSONA_NO_SCID5 = {
  id: 'test-persona-beginner',
  name: 'Test',
  age: 30,
  presentingProblem: 'Test presenting problem.',
  backstory: 'Test backstory.',
  difficultyLevel: 'beginner',
  conversationalStyle: 'plain',
  recommendedApproaches: ['cbt'],
  disorderProfile: ['Test Disorder'],
  cognitiveModel: {
    coreBeliefs: ['I am not enough'],
    intermediateBeliefs: ['I must prove myself'],
    automaticThoughts: ['Nobody cares'],
    emotionalState: { primary: 'sad', intensity: 3 },
    triggers: ['Criticism'],
    defenses: ['Rationalization'],
    values: ['Honesty'],
  },
}

// ─── Valid persona fixture WITH scid5 ────────────────────────────────────────

const VALID_PERSONA_WITH_SCID5 = {
  ...VALID_PERSONA_NO_SCID5,
  cognitiveModel: {
    ...VALID_PERSONA_NO_SCID5.cognitiveModel,
    scid5: {
      onsetAge: 22,
      durationMonths: 18,
      functionalImpairment: { social: 5, occupational: 7, other: 3 },
      priorTreatment: 'No prior treatment',
      traumaFlags: ['tek-olay travma — iş kazası'],
    },
  },
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PersonaDataSchema', () => {
  test('test_PersonaDataSchema_validPersonaWithScid5_parsesWithoutError', () => {
    // FAIL: MODULE_NOT_FOUND — schema.ts does not exist yet.
    // Once schema.ts is created, this should PASS with a valid persona + scid5.
    const result = PersonaDataSchema.parse(VALID_PERSONA_WITH_SCID5)
    assert.strictEqual(result.id, VALID_PERSONA_WITH_SCID5.id)
    assert.ok(result.cognitiveModel.scid5, 'scid5 sub-object should be present after parse')
    assert.strictEqual(result.cognitiveModel.scid5!.onsetAge, 22)
  })

  test('test_PersonaDataSchema_validPersonaWithoutScid5_parsesWithoutError', () => {
    // FAIL: MODULE_NOT_FOUND — schema.ts does not exist yet.
    // scid5 is optional — a persona without it must still pass validation.
    const result = PersonaDataSchema.parse(VALID_PERSONA_NO_SCID5)
    assert.strictEqual(result.id, VALID_PERSONA_NO_SCID5.id)
    assert.strictEqual(
      result.cognitiveModel.scid5,
      undefined,
      'scid5 should be undefined when not provided',
    )
  })

  test('test_PersonaDataSchema_missingRequiredFieldName_throwsZodError', () => {
    // FAIL: MODULE_NOT_FOUND — schema.ts does not exist yet.
    // A persona without the required 'name' field must throw a ZodError.
    const { name: _, ...withoutName } = VALID_PERSONA_NO_SCID5
    assert.throws(
      () => PersonaDataSchema.parse(withoutName),
      (err: unknown) => {
        assert.ok(
          err instanceof Error && err.constructor.name === 'ZodError',
          `Expected ZodError, got ${(err as Error).constructor.name}`,
        )
        return true
      },
    )
  })

  test('test_PersonaDataSchema_invalidDifficultyLevel_throwsZodError', () => {
    // FAIL: MODULE_NOT_FOUND — schema.ts does not exist yet.
    // difficultyLevel must be one of: 'beginner' | 'intermediate' | 'advanced'
    const invalidPersona = { ...VALID_PERSONA_NO_SCID5, difficultyLevel: 'expert' }
    assert.throws(
      () => PersonaDataSchema.parse(invalidPersona),
      (err: unknown) => {
        assert.ok(
          err instanceof Error && err.constructor.name === 'ZodError',
          `Expected ZodError for invalid difficultyLevel, got ${(err as Error).constructor.name}`,
        )
        return true
      },
    )
  })

  test('test_PersonaDataSchema_invalidConversationalStyle_throwsZodError', () => {
    // FAIL: MODULE_NOT_FOUND — schema.ts does not exist yet.
    // conversationalStyle must be one of: 'plain' | 'verbose' | 'reserved' |
    //   'upset' | 'pleasing' | 'tangent'
    const invalidPersona = { ...VALID_PERSONA_NO_SCID5, conversationalStyle: 'aggressive' }
    assert.throws(
      () => PersonaDataSchema.parse(invalidPersona),
      (err: unknown) => {
        assert.ok(
          err instanceof Error && err.constructor.name === 'ZodError',
          `Expected ZodError for invalid conversationalStyle, got ${(err as Error).constructor.name}`,
        )
        return true
      },
    )
  })
})
