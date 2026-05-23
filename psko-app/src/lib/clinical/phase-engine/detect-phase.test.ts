import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { getPhaseForTurn, advancePhase } from './detect-phase'
import type { TherapeuticApproach } from '@/types'

const approaches: TherapeuticApproach[] = ['cbt', 'psychodynamic', 'humanistic', 'act', 'dbt']

describe('detect-phase / getPhaseForTurn', () => {
  test('returns phase 0 at turn 0 for every approach', () => {
    for (const approach of approaches) {
      const g = getPhaseForTurn(approach, 0)
      assert.equal(g.currentPhase, 0, `${approach}: turn 0 should be phase 0`)
      assert.ok(g.phase, `${approach}: phase object should be defined`)
      assert.ok(typeof g.nextMove === 'string' && g.nextMove.length > 0)
    }
  })

  test('progresses through phases as turn count increases', () => {
    for (const approach of approaches) {
      const early = getPhaseForTurn(approach, 0).currentPhase
      const late = getPhaseForTurn(approach, 100).currentPhase
      assert.ok(late >= early, `${approach}: late phase should be >= early`)
    }
  })

  test('clamps to terminal phase for very large turn counts', () => {
    for (const approach of approaches) {
      const a = getPhaseForTurn(approach, 100).currentPhase
      const b = getPhaseForTurn(approach, 10_000).currentPhase
      assert.equal(a, b, `${approach}: should be terminal for both`)
    }
  })

  test('nextPhase is null at the terminal phase', () => {
    const g = getPhaseForTurn('cbt', 10_000)
    assert.equal(g.nextPhase, null)
  })

  test('handles unknown approach gracefully', () => {
    const g = getPhaseForTurn('unknown' as TherapeuticApproach, 5)
    assert.equal(g.currentPhase, 0)
    assert.equal(g.phase, null)
    assert.equal(g.nextPhase, null)
    assert.ok(g.nextMove.length > 0)
  })

  test('handles negative turn counts by returning phase 0', () => {
    const g = getPhaseForTurn('cbt', -1)
    assert.equal(g.currentPhase, 0)
  })

  test('returns string nextMove for every turn from 0 to 30', () => {
    for (let turn = 0; turn <= 30; turn++) {
      const g = getPhaseForTurn('cbt', turn)
      assert.equal(typeof g.nextMove, 'string')
      assert.ok(g.nextMove.length > 0)
    }
  })
})

describe('detect-phase / advancePhase', () => {
  test('advances by one within range', () => {
    assert.equal(advancePhase('cbt', 0), 1)
    assert.equal(advancePhase('cbt', 2), 3)
  })

  test('clamps to max phase for the approach', () => {
    // CBT has phases 0-4
    assert.equal(advancePhase('cbt', 4), 4)
    assert.equal(advancePhase('cbt', 100), 4)
  })

  test('returns 0 for unknown approach', () => {
    assert.equal(advancePhase('unknown' as TherapeuticApproach, 0), 0)
  })
})
