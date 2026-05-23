import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { buildFrameworkCards } from './HybridFrameworkViewer.data'
import type { TherapeuticApproach } from '@/types'

describe('HybridFrameworkViewer / buildFrameworkCards', () => {
  test('returns one card per valid approach', () => {
    const cards = buildFrameworkCards(['cbt', 'psychodynamic'])
    assert.equal(cards.length, 2)
    assert.equal(cards[0].id, 'cbt')
    assert.equal(cards[1].id, 'psychodynamic')
  })

  test('caps output at 3 cards even with more inputs', () => {
    const cards = buildFrameworkCards(['cbt', 'psychodynamic', 'act', 'dbt', 'humanistic'])
    assert.equal(cards.length, 3)
  })

  test('dedupes repeated approaches', () => {
    const cards = buildFrameworkCards(['cbt', 'cbt', 'psychodynamic'])
    assert.equal(cards.length, 2)
    assert.equal(cards[0].id, 'cbt')
    assert.equal(cards[1].id, 'psychodynamic')
  })

  test('skips unknown approaches', () => {
    const cards = buildFrameworkCards([
      'cbt',
      'nonsense' as TherapeuticApproach,
      'psychodynamic',
    ])
    assert.equal(cards.length, 2)
    assert.equal(cards.map((c) => c.id).join(','), 'cbt,psychodynamic')
  })

  test('each card exposes phaseTimeline, keyTechniques, recommendedWhen', () => {
    const [card] = buildFrameworkCards(['cbt'])
    assert.ok(card.name.length > 0)
    assert.ok(card.description.length > 0)
    assert.ok(Array.isArray(card.phaseTimeline))
    assert.ok(card.phaseTimeline.length > 0)
    assert.ok(card.phaseTimeline.every((p) => typeof p.index === 'number' && p.name))
    assert.ok(Array.isArray(card.keyTechniques))
    assert.ok(card.keyTechniques.length > 0)
    assert.ok(card.keyTechniques.length <= 4)
    assert.ok(Array.isArray(card.recommendedWhen))
    assert.ok(card.recommendedWhen.length <= 3)
  })

  test('returns empty array when given empty input', () => {
    const cards = buildFrameworkCards([])
    assert.deepEqual(cards, [])
  })

  test('handles all five known approaches in any pair', () => {
    const all: TherapeuticApproach[] = ['cbt', 'psychodynamic', 'humanistic', 'act', 'dbt']
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const cards = buildFrameworkCards([all[i], all[j]])
        assert.equal(cards.length, 2, `pair ${all[i]}+${all[j]} should yield 2 cards`)
      }
    }
  })
})
