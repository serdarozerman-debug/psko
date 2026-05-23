/**
 * Normalize competency scores from a supervisor feedback blob.
 *
 * Extracts `competency_scores` (if present) into an array of
 * `{ domain, score }`. Scores are clamped to the valid CTS-R range [1, 6].
 */

export interface CompetencyScore {
  domain: string
  score: number
}

const MIN_SCORE = 1
const MAX_SCORE = 6

function clamp(n: number): number {
  if (n < MIN_SCORE) return MIN_SCORE
  if (n > MAX_SCORE) return MAX_SCORE
  return n
}

interface RawScore {
  domain?: unknown
  score?: unknown
}

interface RawFeedback {
  competency_scores?: unknown
}

export function normalizeCompetencyScores(feedback: unknown): CompetencyScore[] {
  if (!feedback || typeof feedback !== 'object') return []

  const raw = (feedback as RawFeedback).competency_scores
  if (!Array.isArray(raw)) return []

  const out: CompetencyScore[] = []
  for (const entry of raw as RawScore[]) {
    if (!entry || typeof entry !== 'object') continue
    const domain = typeof entry.domain === 'string' ? entry.domain : null
    const score = typeof entry.score === 'number' ? entry.score : null
    if (domain === null || score === null) continue
    out.push({ domain, score: clamp(score) })
  }
  return out
}
