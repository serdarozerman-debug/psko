/**
 * Pure data preparation for HybridFrameworkViewer.
 * Extracted from the component for unit-testability without DOM.
 */
import type { TherapeuticApproach, ApproachConfig, ProtocolPhase } from '@/types'
import { getClinicalFramework } from '@/lib/clinical/frameworks'

export interface FrameworkCardData {
  id: TherapeuticApproach
  name: string
  description: string
  phaseTimeline: Array<{ index: number; name: string }>
  keyTechniques: string[]
  recommendedWhen: string[]
}

const MAX_TECHNIQUES_PER_CARD = 4
const MAX_RECOMMENDED_WHEN = 3

/**
 * Derive view-model from approach IDs. Filters unknowns and dedupes.
 * Always returns 2–3 cards (or fewer if not enough valid approaches).
 */
export function buildFrameworkCards(approaches: TherapeuticApproach[]): FrameworkCardData[] {
  const seen = new Set<string>()
  const cards: FrameworkCardData[] = []

  for (const approach of approaches) {
    if (seen.has(approach)) continue
    const framework = getClinicalFramework(approach)
    if (!framework) continue
    seen.add(approach)
    cards.push(toCardData(framework))
    if (cards.length === 3) break
  }
  return cards
}

function toCardData(fw: ApproachConfig): FrameworkCardData {
  const phases = fw.phases ?? []
  const allTechniques = phases.flatMap((p: ProtocolPhase) => p.techniques)
  return {
    id: fw.id,
    name: fw.name,
    description: fw.description,
    phaseTimeline: phases.map((p) => ({ index: p.index, name: p.name })),
    keyTechniques: allTechniques.slice(0, MAX_TECHNIQUES_PER_CARD),
    recommendedWhen: fw.guidanceHints.slice(0, MAX_RECOMMENDED_WHEN),
  }
}
