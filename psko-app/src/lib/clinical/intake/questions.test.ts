import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { computePHQ9Score, computeGAD7Score, PHQ9_QUESTIONS, GAD7_QUESTIONS, INTAKE_QUESTIONS } from './questions'

describe('computePHQ9Score', () => {
  test('returns 0 for empty responses', () => {
    assert.strictEqual(computePHQ9Score({}), 0)
  })

  test('sums all 9 PHQ-9 items correctly', () => {
    const responses: Record<string, number> = {}
    for (const q of PHQ9_QUESTIONS) responses[q.id] = 3
    assert.strictEqual(computePHQ9Score(responses), 27)
  })

  test('ignores non-PHQ9 keys', () => {
    assert.strictEqual(computePHQ9Score({ gad7_1: 3, open_1: 'text' }), 0)
  })

  test('treats missing keys as 0', () => {
    assert.strictEqual(computePHQ9Score({ phq9_1: 2 }), 2)
  })

  test('coerces string numbers', () => {
    assert.strictEqual(computePHQ9Score({ phq9_1: '3', phq9_2: '2' }), 5)
  })

  test('returns max possible score of 27', () => {
    const all3: Record<string, number> = {}
    PHQ9_QUESTIONS.forEach((q) => { all3[q.id] = 3 })
    assert.ok(computePHQ9Score(all3) === 27)
  })
})

describe('computeGAD7Score', () => {
  test('returns 0 for empty responses', () => {
    assert.strictEqual(computeGAD7Score({}), 0)
  })

  test('sums all 7 GAD-7 items correctly', () => {
    const responses: Record<string, number> = {}
    for (const q of GAD7_QUESTIONS) responses[q.id] = 3
    assert.strictEqual(computeGAD7Score(responses), 21)
  })

  test('ignores non-GAD7 keys', () => {
    assert.strictEqual(computeGAD7Score({ phq9_1: 3, open_1: 'text' }), 0)
  })

  test('treats missing keys as 0', () => {
    assert.strictEqual(computeGAD7Score({ gad7_1: 2 }), 2)
  })

  test('coerces string numbers', () => {
    assert.strictEqual(computeGAD7Score({ gad7_1: '3', gad7_2: '1' }), 4)
  })
})

describe('INTAKE_QUESTIONS', () => {
  test('contains all PHQ-9 + GAD-7 + open questions', () => {
    assert.ok(INTAKE_QUESTIONS.length === 19) // 9 + 7 + 3
  })

  test('PHQ-9 questions come first', () => {
    const first = INTAKE_QUESTIONS[0]
    assert.strictEqual(first.type, 'phq9')
  })

  test('open questions come last', () => {
    const last = INTAKE_QUESTIONS[INTAKE_QUESTIONS.length - 1]
    assert.strictEqual(last.type, 'open')
  })
})
