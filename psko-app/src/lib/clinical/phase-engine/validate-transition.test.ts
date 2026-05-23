import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { validatePhaseTransition } from './validate-transition'
import type { TherapeuticApproach } from '@/types'

describe('validatePhaseTransition', () => {
  const approaches: TherapeuticApproach[] = ['cbt', 'psychodynamic', 'humanistic', 'act', 'dbt']

  test('allows staying in the same phase for every approach', () => {
    for (const approach of approaches) {
      const result = validatePhaseTransition(approach, 1, 1)
      assert.equal(result.valid, true, `${approach}: same-phase should be valid`)
    }
  })

  test('allows advancing to the next phase', () => {
    for (const approach of approaches) {
      const result = validatePhaseTransition(approach, 0, 1)
      assert.equal(result.valid, true, `${approach}: next-phase should be valid`)
    }
  })

  test('rejects backward jumps', () => {
    const result = validatePhaseTransition('cbt', 2, 1)
    assert.equal(result.valid, false)
    assert.match(result.reason ?? '', /backward|regress/i)
  })

  test('rejects skipping more than one phase ahead', () => {
    const result = validatePhaseTransition('cbt', 0, 2)
    assert.equal(result.valid, false)
    assert.match(result.reason ?? '', /skip|jump/i)
  })

  test('allows staying at terminal phase', () => {
    // CBT terminal phase index is 4 (5 phases: 0-4)
    const result = validatePhaseTransition('cbt', 4, 4)
    assert.equal(result.valid, true)
  })

  test('rejects advancing past terminal phase', () => {
    const result = validatePhaseTransition('cbt', 4, 5)
    assert.equal(result.valid, false)
  })

  test('rejects transition to clearly out-of-range phase', () => {
    const result = validatePhaseTransition('cbt', 4, 99)
    assert.equal(result.valid, false)
    assert.match(result.reason ?? '', /unknown|terminal|invalid/i)
  })

  test('rejects negative phase indices', () => {
    const result = validatePhaseTransition('cbt', 0, -1)
    assert.equal(result.valid, false)
  })

  test('rejects unknown approach', () => {
    const result = validatePhaseTransition('unknown' as TherapeuticApproach, 0, 1)
    assert.equal(result.valid, false)
    assert.match(result.reason ?? '', /unknown approach/i)
  })

  test('returns { valid, reason } shape on rejection', () => {
    const result = validatePhaseTransition('cbt', 3, 1)
    assert.equal(typeof result.valid, 'boolean')
    assert.equal(typeof result.reason, 'string')
  })

  test('reason is undefined when valid', () => {
    const result = validatePhaseTransition('cbt', 0, 1)
    assert.equal(result.valid, true)
    assert.equal(result.reason, undefined)
  })
})
