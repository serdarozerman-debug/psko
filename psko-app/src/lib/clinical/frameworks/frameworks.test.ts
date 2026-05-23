import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { getClinicalFramework, ALL_FRAMEWORKS } from './index'
import { getPhaseForTurn } from '../phase-engine/detect-phase'
import { INTAKE_QUESTIONS } from '../intake/questions'

describe('Clinical Framework Library', () => {
  test('all 5 approaches have a framework defined', () => {
    const ids = ALL_FRAMEWORKS.map((f) => f.id)
    assert.ok(ids.includes('cbt'), 'cbt missing')
    assert.ok(ids.includes('psychodynamic'), 'psychodynamic missing')
    assert.ok(ids.includes('act'), 'act missing')
    assert.ok(ids.includes('dbt'), 'dbt missing')
    assert.ok(ids.includes('humanistic'), 'humanistic missing')
  })

  test('each framework has at least 4 protocol phases', () => {
    for (const fw of ALL_FRAMEWORKS) {
      assert.ok(
        (fw.phases?.length ?? 0) >= 4,
        `${fw.id} has fewer than 4 phases (got ${fw.phases?.length ?? 0})`
      )
    }
  })

  test('each phase has required fields', () => {
    for (const fw of ALL_FRAMEWORKS) {
      for (const phase of fw.phases ?? []) {
        assert.ok(phase.name, `${fw.id} phase ${phase.index} missing name`)
        assert.ok(phase.objective, `${fw.id} phase ${phase.index} missing objective`)
        assert.ok(phase.techniques.length > 0, `${fw.id} phase ${phase.index} has no techniques`)
        assert.ok(phase.watchFor.length > 0, `${fw.id} phase ${phase.index} has no watchFor`)
        assert.ok(typeof phase.triggerTurnMin === 'number', `${fw.id} phase ${phase.index} missing triggerTurnMin`)
      }
    }
  })

  test('getClinicalFramework returns correct framework', () => {
    const cbt = getClinicalFramework('cbt')
    assert.ok(cbt !== null, 'cbt framework not found')
    assert.strictEqual(cbt?.id, 'cbt')
  })

  test('phase triggerTurnMin increases monotonically', () => {
    for (const fw of ALL_FRAMEWORKS) {
      const phases = fw.phases ?? []
      for (let i = 1; i < phases.length; i++) {
        assert.ok(
          phases[i].triggerTurnMin >= phases[i - 1].triggerTurnMin,
          `${fw.id}: phase ${i} triggerTurnMin (${phases[i].triggerTurnMin}) < phase ${i - 1} (${phases[i - 1].triggerTurnMin})`
        )
      }
    }
  })
})

describe('Phase Engine', () => {
  test('getPhaseForTurn returns phase 0 at turn 0', async () => {
    // getPhaseForTurn imported statically above
    const result = getPhaseForTurn('cbt', 0)
    assert.strictEqual(result.currentPhase, 0)
    assert.ok(result.phase !== null, 'phase should not be null at turn 0')
  })

  test('getPhaseForTurn advances phase as turns increase', async () => {
    // getPhaseForTurn imported statically above
    const early = getPhaseForTurn('cbt', 0)
    const later = getPhaseForTurn('cbt', 20)
    assert.ok(later.currentPhase >= early.currentPhase, 'phase should not decrease')
  })

  test('getPhaseForTurn returns nextMove string', async () => {
    // getPhaseForTurn imported statically above
    const result = getPhaseForTurn('cbt', 5)
    assert.ok(result.nextMove.length > 0, 'nextMove should not be empty')
  })
})

describe('Intake Questions', () => {
  test('PHQ-9 block has 9 questions', async () => {
    // INTAKE_QUESTIONS imported statically above
    const phq9 = INTAKE_QUESTIONS.filter((q) => q.type === 'phq9')
    assert.strictEqual(phq9.length, 9)
  })

  test('GAD-7 block has 7 questions', async () => {
    // INTAKE_QUESTIONS imported statically above
    const gad7 = INTAKE_QUESTIONS.filter((q) => q.type === 'gad7')
    assert.strictEqual(gad7.length, 7)
  })

  test('all questions have non-empty text', async () => {
    // INTAKE_QUESTIONS imported statically above
    for (const q of INTAKE_QUESTIONS) {
      assert.ok(q.text.length > 0, `Question ${q.id} has empty text`)
    }
  })
})
