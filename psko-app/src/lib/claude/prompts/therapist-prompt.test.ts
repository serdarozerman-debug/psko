import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTherapistPrompt } from './therapist-prompt'
import { getPersonaById } from '@/lib/personas'

describe('buildTherapistPrompt', () => {
  test('references the persona disorder profile as the treatment focus', () => {
    const persona = getPersonaById('ayse-depression-beginner')!
    const prompt = buildTherapistPrompt(persona)
    assert.ok(prompt.includes(persona.presentingProblem), 'should include presenting problem as treatment focus')
  })

  test('instructs the AI to act as a psychologist, not as the persona', () => {
    const persona = getPersonaById('mert-anxiety-intermediate')!
    const prompt = buildTherapistPrompt(persona)
    assert.match(prompt.toLowerCase(), /psychologist|therapist/, 'should reference psychologist or therapist')
    assert.ok(!prompt.includes(`You are ${persona.name}`), 'must not instruct AI to be the patient persona')
  })

  test('includes a warm opening instruction for the therapist', () => {
    const persona = getPersonaById('zeynep-grief-beginner')!
    const prompt = buildTherapistPrompt(persona)
    assert.match(prompt.toLowerCase(), /open|welcome|greet|session/, 'should include opening instruction')
  })

  test('instructs the AI never to break the therapist character', () => {
    const persona = getPersonaById('selin-relationship-advanced')!
    const prompt = buildTherapistPrompt(persona)
    assert.ok(prompt.toLowerCase().includes('character'), 'should mention staying in character')
  })

  test('does not expose clinical assessment jargon to the student-as-client', () => {
    const persona = getPersonaById('can-burnout-intermediate')!
    const prompt = buildTherapistPrompt(persona)
    assert.doesNotMatch(prompt, /cognitive distortion|automatic thought|CTS-R/, 'must not expose assessment jargon')
  })
})
