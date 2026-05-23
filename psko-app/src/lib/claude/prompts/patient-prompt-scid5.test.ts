/**
 * RED PHASE — Patient Prompt SCID-5 Injection Tests
 * spec: 2026-05-23-persona-expansion
 * task: tests (enforcer-1)
 *
 * Failing tests (must see RED before implementation):
 *   - test 1: FAIL — 'CLINICAL CONTEXT (SCID-5):' header not yet injected
 *   - test 3: FAIL — traumaFlags not yet injected into prompt
 *   - test 5: FAIL — prompt with scid5 is not longer (block not added yet)
 *
 * Regression guards (expected to PASS already — verify green):
 *   - test 2: buildPatientPrompt without scid5 must NOT include 'CLINICAL CONTEXT'
 *   - test 4: disorderProfile values must NOT appear in any prompt (existing behavior)
 */

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPatientPrompt } from './patient-prompt'
import type { PersonaData } from '@/types'

// ─── Fixtures ────────────────────────────────────────────────────────────────

/**
 * Minimal persona that satisfies PersonaData WITHOUT scid5.
 * Matches the existing 5-persona structure so buildPatientPrompt
 * can be called with no changes needed in the function signature.
 */
const BASE_PERSONA: PersonaData = {
  id: 'test-base-persona',
  name: 'Test Kişi',
  age: 28,
  presentingProblem: 'Sürekli endişeleniyorum ve uyuyamıyorum.',
  backstory: 'Test backstory.',
  difficultyLevel: 'beginner',
  conversationalStyle: 'plain',
  recommendedApproaches: ['cbt'],
  disorderProfile: ['Test Bozukluğu DSM-5 Etiketi'],
  cognitiveModel: {
    coreBeliefs: ['Yeterliyim'],
    intermediateBeliefs: ['Çalışırsam başarırım'],
    automaticThoughts: ['Her şey yolunda gidecek'],
    emotionalState: { primary: 'sad', intensity: 3 },
    triggers: ['Başarısızlık'],
    defenses: ['Rasyonalizasyon'],
    values: ['Dürüstlük'],
  },
}

/**
 * Same persona WITH cognitiveModel.scid5 populated.
 * This is the shape the schema task will add to the CognitiveModel interface.
 * TypeScript will complain until the schema task extends the interface —
 * the cast via `as unknown as PersonaData` keeps the tests compilable now
 * so failures are runtime failures (feature missing), not type errors.
 */
const PERSONA_WITH_SCID5 = {
  ...BASE_PERSONA,
  cognitiveModel: {
    ...BASE_PERSONA.cognitiveModel,
    scid5: {
      onsetAge: 24,
      durationMonths: 14,
      functionalImpairment: { social: 5, occupational: 7, other: 2 },
      priorTreatment: 'No prior treatment',
      traumaFlags: ['tek-olay travma — iş kazası', 'travma sonrası güven sorunları'],
    },
  },
} as unknown as PersonaData

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildPatientPrompt SCID-5 injection', () => {
  test('test_buildPatientPrompt_withScid5_includesClinicaContextHeader', () => {
    // FAIL: buildPatientPrompt() does not yet inject a SCID-5 block.
    // The string 'CLINICAL CONTEXT (SCID-5):' will not appear in the output
    // until the prompt-update task implements conditional injection.
    const prompt = buildPatientPrompt(PERSONA_WITH_SCID5, 'cbt')
    assert.ok(
      prompt.includes('CLINICAL CONTEXT (SCID-5):'),
      'buildPatientPrompt() with a persona that has cognitiveModel.scid5 must include ' +
        "'CLINICAL CONTEXT (SCID-5):' block in its output (AC-4 / FR-5).",
    )
  })

  test('test_buildPatientPrompt_withoutScid5_doesNotIncludeClinicalContextHeader', () => {
    // PASS (regression guard): buildPatientPrompt today never outputs
    // 'CLINICAL CONTEXT' because that block has not been added yet.
    // This test MUST continue to pass after the prompt-update task lands —
    // the block must be absent when scid5 is not present (AC-4).
    const prompt = buildPatientPrompt(BASE_PERSONA, 'cbt')
    assert.ok(
      !prompt.includes('CLINICAL CONTEXT'),
      'buildPatientPrompt() without scid5 must NOT include any CLINICAL CONTEXT section. ' +
        'Behavior must be byte-identical to current output (AC-4 regression guard).',
    )
  })

  test('test_buildPatientPrompt_withScid5TraumaFlags_includesFlagsInPrompt', () => {
    // FAIL: traumaFlags are not injected into the prompt yet.
    // After prompt-update task: the 'Relevant history flags:' line must appear.
    const prompt = buildPatientPrompt(PERSONA_WITH_SCID5, 'cbt')
    assert.ok(
      prompt.includes('tek-olay travma — iş kazası'),
      'buildPatientPrompt() must include traumaFlags values in the SCID-5 block. ' +
        "Expected 'tek-olay travma — iş kazası' to appear in prompt output (FR-5).",
    )
  })

  test('test_buildPatientPrompt_disorderProfileValue_neverAppearsInOutput', () => {
    // PASS (regression guard): disorderProfile is not currently injected by
    // buildPatientPrompt(). This test locks that behavior permanently (AC-8 / FR-15).
    // If this test ever FAILS after implementation changes, that is a critical bug.
    const prompt = buildPatientPrompt(BASE_PERSONA, 'cbt')
    assert.ok(
      !prompt.includes('Test Bozukluğu DSM-5 Etiketi'),
      "disorderProfile value 'Test Bozukluğu DSM-5 Etiketi' must never appear in " +
        'buildPatientPrompt() output (AC-8 / FR-15).',
    )
  })

  test('test_buildPatientPrompt_withScid5_outputIsLongerThanWithoutScid5', () => {
    // FAIL: since the SCID-5 block is not injected yet, both prompts are the
    // same length. This assertion will fail until the injection is implemented.
    const promptWithout = buildPatientPrompt(BASE_PERSONA, 'cbt')
    const promptWith = buildPatientPrompt(PERSONA_WITH_SCID5, 'cbt')

    assert.ok(
      promptWith.length > promptWithout.length,
      `buildPatientPrompt() with scid5 (${promptWith.length} chars) must produce a ` +
        `longer prompt than without scid5 (${promptWithout.length} chars). ` +
        'The SCID-5 block adds content when the sub-object is present (FR-5).',
    )
  })
})
