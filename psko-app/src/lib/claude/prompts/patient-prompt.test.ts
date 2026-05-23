import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPatientPrompt } from './patient-prompt'
import { getPersonaById, personaLibrary } from '@/lib/personas'

describe('buildPatientPrompt', () => {
  test('includes the persona name in the prompt', async () => {
    const persona = (await getPersonaById('ayse-depression-beginner'))!
    const prompt = buildPatientPrompt(persona, 'cbt')
    assert.ok(prompt.includes('Ayşe'), 'prompt should include persona name')
  })

  test('includes the presenting problem', async () => {
    const persona = (await getPersonaById('mert-anxiety-intermediate'))!
    const prompt = buildPatientPrompt(persona, 'act')
    assert.ok(prompt.includes(persona.presentingProblem), 'prompt should include presenting problem')
  })

  test('includes the approach-specific instructions', async () => {
    const persona = (await getPersonaById('zeynep-grief-beginner'))!
    const prompt = buildPatientPrompt(persona, 'humanistic')
    assert.ok(prompt.includes('Person-Centered'), 'prompt should include approach name')
  })

  test('never exposes the term "cognitive distortions" (anti-jargon check)', async () => {
    const persona = (await getPersonaById('ayse-depression-beginner'))!
    const prompt = buildPatientPrompt(persona, 'cbt')
    assert.ok(prompt.includes('clinical terminology'), 'should contain anti-jargon rule')
  })

  test('includes core beliefs', async () => {
    const persona = (await getPersonaById('selin-relationship-advanced'))!
    const prompt = buildPatientPrompt(persona, 'psychodynamic')
    assert.ok(prompt.includes('I am fundamentally unlovable'), 'should include core belief')
  })
})

describe('personaLibrary', () => {
  test('has 18 personas', () => {
    assert.strictEqual(personaLibrary.length, 18)
  })

  test('each persona has required fields', () => {
    for (const persona of personaLibrary) {
      assert.ok(persona.id, 'id should be truthy')
      assert.ok(persona.name, 'name should be truthy')
      assert.ok(persona.cognitiveModel.coreBeliefs.length > 0, 'should have core beliefs')
      assert.ok(persona.cognitiveModel.automaticThoughts.length > 0, 'should have automatic thoughts')
      assert.ok(['beginner', 'intermediate', 'advanced'].includes(persona.difficultyLevel), 'valid difficulty')
      assert.ok(['plain', 'upset', 'reserved', 'verbose', 'pleasing', 'tangent'].includes(persona.conversationalStyle), 'valid style')
    }
  })

  test('each persona has at least one recommended approach', () => {
    for (const persona of personaLibrary) {
      assert.ok(persona.recommendedApproaches.length > 0, 'should have recommended approaches')
    }
  })
})
