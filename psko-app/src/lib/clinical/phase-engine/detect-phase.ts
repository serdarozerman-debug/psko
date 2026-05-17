import type { TherapeuticApproach, ProtocolPhase, PhaseGuidance } from '@/types'
import { getClinicalFramework } from '../frameworks'

/**
 * Determine the current protocol phase and next-move suggestion based on turn count.
 * Pure function — no API calls. Turn-count based for predictable, zero-cost detection.
 */
export function getPhaseForTurn(approach: TherapeuticApproach, turnCount: number): PhaseGuidance {
  const framework = getClinicalFramework(approach)
  const phases = framework?.phases ?? []

  if (phases.length === 0) {
    return {
      currentPhase: 0,
      phase: null,
      nextPhase: null,
      nextMove: 'Continue exploring the client\'s presenting concern.',
    }
  }

  // Find the highest phase whose triggerTurnMin is <= current turn count
  let activePhase: ProtocolPhase = phases[0]
  for (const phase of phases) {
    if (turnCount >= phase.triggerTurnMin) {
      activePhase = phase
    }
  }

  const nextPhaseIndex = activePhase.index + 1
  const nextPhase = phases.find((p) => p.index === nextPhaseIndex) ?? null

  // Build a contextual next-move suggestion from the active phase's techniques
  const technique = activePhase.techniques[turnCount % activePhase.techniques.length]
  const nextMove = buildNextMove(activePhase, technique, nextPhase, turnCount)

  return {
    currentPhase: activePhase.index,
    phase: activePhase,
    nextPhase,
    nextMove,
  }
}

function buildNextMove(
  phase: ProtocolPhase,
  technique: string,
  nextPhase: ProtocolPhase | null,
  turnCount: number
): string {
  // Near transition: hint that next phase is approaching
  if (nextPhase && turnCount >= nextPhase.triggerTurnMin - 2) {
    return `You are approaching the ${nextPhase.name} phase. Begin preparing to transition: ${nextPhase.techniques[0]}`
  }

  // Standard next-move from current phase techniques
  return technique
}

/**
 * Advance to the next phase if criteria are met.
 * Returns the new phase index (clamped to max available phase).
 */
export function advancePhase(approach: TherapeuticApproach, currentPhase: number): number {
  const framework = getClinicalFramework(approach)
  const phases = framework?.phases ?? []
  const maxPhase = Math.max(...phases.map((p) => p.index), 0)
  return Math.min(currentPhase + 1, maxPhase)
}
