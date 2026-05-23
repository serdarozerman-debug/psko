import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTherapistPrompt } from './therapist-prompt'
import { getPersonaById } from '@/lib/personas'

describe('buildTherapistPrompt', () => {
  test('references the persona disorder profile as the treatment focus', async () => {
    const persona = (await getPersonaById('ayse-depression-beginner'))!
    const prompt = buildTherapistPrompt(persona)
    assert.ok(prompt.includes(persona.presentingProblem), 'should include presenting problem as treatment focus')
  })

  test('instructs the AI to act as a psychologist, not as the persona', async () => {
    const persona = (await getPersonaById('mert-anxiety-intermediate'))!
    const prompt = buildTherapistPrompt(persona)
    assert.match(prompt.toLowerCase(), /psychologist|therapist/, 'should reference psychologist or therapist')
    assert.ok(!prompt.includes(`You are ${persona.name}`), 'must not instruct AI to be the patient persona')
  })

  test('includes a warm opening instruction for the therapist', async () => {
    const persona = (await getPersonaById('zeynep-grief-beginner'))!
    const prompt = buildTherapistPrompt(persona)
    assert.match(prompt.toLowerCase(), /open|welcome|greet|session/, 'should include opening instruction')
  })

  test('instructs the AI never to break the therapist character', async () => {
    const persona = (await getPersonaById('selin-relationship-advanced'))!
    const prompt = buildTherapistPrompt(persona)
    assert.ok(prompt.toLowerCase().includes('character'), 'should mention staying in character')
  })

  test('does not include CTS-R competency scoring instructions (those belong in therapist mode)', async () => {
    const persona = (await getPersonaById('can-burnout-intermediate'))!
    const prompt = buildTherapistPrompt(persona)
    // CTS-R scoring belongs only in supervisor/feedback prompts, not in the therapist system prompt
    assert.doesNotMatch(prompt, /CTS-R|competency score|score each|Agenda Setting/, 'must not include CTS-R scoring instructions')
    // Should not tell the AI to BE the patient persona
    assert.ok(!prompt.includes(`You are ${persona.name}`), 'must not instruct AI to role-play as the patient persona')
  })
})
