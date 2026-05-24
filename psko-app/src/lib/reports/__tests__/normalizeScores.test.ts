/**
 * Unit tests for src/lib/reports/normalizeScores.ts
 *
 * Tests run with node:test (not Jest).
 * RED phase: normalizeScores.ts does not exist yet — all tests fail with
 * MODULE_NOT_FOUND on import.
 *
 * normalizeCompetencyScores:
 *   Takes a supervisor feedback JSON blob and extracts `competency_scores`
 *   into an array of { domain: string, score: number }.
 *   Scores are clamped to the valid CTS-R range [1, 6].
 */

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { normalizeCompetencyScores } from '../normalizeScores'

describe('normalizeCompetencyScores', () => {
  // ── Happy path ──────────────────────────────────────────────────────────────

  test(
    'test_normalizeCompetencyScores_withValidFeedback_returnsScoreArray',
    () => {
      // Arrange
      const feedback = {
        competency_scores: [
          { domain: 'Agenda Setting', score: 4 },
          { domain: 'Feedback', score: 5 },
        ],
      }

      // Act
      const result = normalizeCompetencyScores(feedback)

      // Assert: two items, each with domain (string) and score (number)
      assert.equal(result.length, 2)

      assert.equal(typeof result[0].domain, 'string')
      assert.equal(typeof result[0].score, 'number')
      assert.equal(result[0].domain, 'Agenda Setting')
      assert.equal(result[0].score, 4)

      assert.equal(result[1].domain, 'Feedback')
      assert.equal(result[1].score, 5)
    },
  )

  // ── Edge cases ──────────────────────────────────────────────────────────────

  test(
    'test_normalizeCompetencyScores_withEmptyScores_returnsEmptyArray',
    () => {
      // Arrange
      const feedback = { competency_scores: [] }

      // Act
      const result = normalizeCompetencyScores(feedback)

      // Assert
      assert.deepEqual(result, [])
    },
  )

  test(
    'test_normalizeCompetencyScores_withMissingField_returnsEmptyArray',
    () => {
      // Arrange — no competency_scores key at all
      const feedback = {}

      // Act
      const result = normalizeCompetencyScores(feedback)

      // Assert
      assert.deepEqual(result, [])
    },
  )

  // ── Clamping behaviour ──────────────────────────────────────────────────────

  test(
    'test_normalizeCompetencyScores_clampsScoreToRange1to6',
    () => {
      // Arrange
      const feedback = {
        competency_scores: [
          { domain: 'X', score: 10 },  // above max → clamp to 6
          { domain: 'Y', score: 0 },   // below min → clamp to 1
        ],
      }

      // Act
      const result = normalizeCompetencyScores(feedback)

      // Assert: score 10 clamped to 6
      assert.equal(result[0].domain, 'X')
      assert.equal(result[0].score, 6)

      // Assert: score 0 clamped to 1
      assert.equal(result[1].domain, 'Y')
      assert.equal(result[1].score, 1)
    },
  )
})
