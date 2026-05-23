import type { TherapeuticApproach } from '@/types'
import { getClinicalFramework } from '../frameworks'

export interface PhaseTransitionResult {
  valid: boolean
  reason?: string
}

/**
 * Validate whether a phase transition is legal for a given therapeutic approach.
 *
 * Rules:
 *   - Same phase: always valid (no movement)
 *   - Next phase (toPhase === fromPhase + 1): valid
 *   - Stay at terminal phase: valid (already covered by same-phase rule)
 *   - Backward jumps (toPhase < fromPhase): invalid
 *   - Skipping > 1 phase (toPhase > fromPhase + 1): invalid
 *   - Unknown approach: invalid
 *   - toPhase index outside framework phase range: invalid
 *   - Negative indices: invalid
 *
 * Pure function. No I/O. Cheap to call on every request.
 */
export function validatePhaseTransition(
  approach: TherapeuticApproach,
  fromPhase: number,
  toPhase: number
): PhaseTransitionResult {
  const framework = getClinicalFramework(approach)
  if (!framework || !framework.phases || framework.phases.length === 0) {
    return { valid: false, reason: `Unknown approach: ${approach}` }
  }

  if (!Number.isInteger(fromPhase) || !Number.isInteger(toPhase)) {
    return { valid: false, reason: 'Phase indices must be integers' }
  }

  if (fromPhase < 0 || toPhase < 0) {
    return { valid: false, reason: 'Phase indices cannot be negative' }
  }

  const phaseIndices = framework.phases.map((p) => p.index)
  const maxPhase = Math.max(...phaseIndices)

  if (!phaseIndices.includes(toPhase)) {
    return { valid: false, reason: `Unknown or invalid target phase ${toPhase} for ${approach}` }
  }

  // Same phase — always allowed (covers terminal stay)
  if (toPhase === fromPhase) {
    return { valid: true }
  }

  // Backward jump
  if (toPhase < fromPhase) {
    return { valid: false, reason: `Backward transition not allowed (${fromPhase} → ${toPhase})` }
  }

  // Skipping > 1 phase ahead
  if (toPhase > fromPhase + 1) {
    return {
      valid: false,
      reason: `Cannot skip phases (${fromPhase} → ${toPhase}); must advance one at a time`,
    }
  }

  // toPhase === fromPhase + 1 — legal single-step advance
  // But if fromPhase is already terminal, no advance possible
  if (fromPhase >= maxPhase) {
    return { valid: false, reason: `Already at terminal phase ${maxPhase}` }
  }

  return { valid: true }
}
