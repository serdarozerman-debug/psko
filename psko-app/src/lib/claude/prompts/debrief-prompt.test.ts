import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDebriefPrompt } from './debrief-prompt'
import { getPersonaById } from '@/lib/personas'
import type { MessageData } from '@/types'

const makeMessages = (pairs: Array<[string, string]>): MessageData[] =>
  pairs.flatMap(([studentMsg, patientMsg], i) => [
    {
      id: `s-${i}`,
      sessionId: 'sess-1',
      role: 'student' as const,
      content: studentMsg,
      createdAt: new Date(),
    },
    {
      id: `p-${i}`,
      sessionId: 'sess-1',
      role: 'patient' as const,
      content: patientMsg,
      createdAt: new Date(),
    },
  ])

describe('buildDebriefPrompt', () => {
  test('references the persona presenting problem in the prompt', () => {
    const persona = getPersonaById('ayse-depression-beginner')!
    const messages = makeMessages([['I feel lost', 'Tell me more about that feeling']])
    const prompt = buildDebriefPrompt(persona, messages)
    assert.ok(prompt.includes(persona.presentingProblem), 'should include presenting problem')
  })

  test('includes the session transcript', () => {
    const persona = getPersonaById('mert-anxiety-intermediate')!
    const messages = makeMessages([['hello', 'hello back'], ['how are you', 'I am fine']])
    const prompt = buildDebriefPrompt(persona, messages)
    assert.ok(prompt.includes('hello'), 'should include student message')
    assert.ok(prompt.includes('hello back'), 'should include AI response')
  })

  test('requests JSON output with the ClientDebrief shape', () => {
    const persona = getPersonaById('zeynep-grief-beginner')!
    const messages = makeMessages([['hi', 'welcome']])
    const prompt = buildDebriefPrompt(persona, messages)
    assert.ok(prompt.includes('experienceSummary'), 'should request experienceSummary field')
    assert.ok(prompt.includes('helpfulMoments'), 'should request helpfulMoments field')
    assert.ok(prompt.includes('reflectionPrompts'), 'should request reflectionPrompts field')
  })

  test('asks the AI to reflect on what the student-as-client may have felt', () => {
    const persona = getPersonaById('selin-relationship-advanced')!
    const messages = makeMessages([['I feel scared', 'That sounds really hard']])
    const prompt = buildDebriefPrompt(persona, messages)
    assert.match(prompt.toLowerCase(), /client|patient|student/, 'should reference student/client role')
    assert.match(prompt.toLowerCase(), /feel|emotion|experience/, 'should reference emotional experience')
  })

  test('instructs the AI to identify the therapeutic technique used', () => {
    const persona = getPersonaById('can-burnout-intermediate')!
    const messages = makeMessages([['I am exhausted', 'What does that exhaustion feel like?']])
    const prompt = buildDebriefPrompt(persona, messages)
    assert.match(prompt.toLowerCase(), /technique|approach|method/, 'should ask for technique identification')
  })
})
