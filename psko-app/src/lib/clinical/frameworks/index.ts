import type { ApproachConfig, TherapeuticApproach } from '@/types'
import { cbtFramework } from './cbt'
import { psychodynamicFramework } from './psychodynamic'
import { actFramework } from './act'
import { dbtFramework } from './dbt'
import { humanisticFramework } from './humanistic'

// Stub — full MI framework module is a separate workstream (spec § Out of Scope)
const miFrameworkStub: ApproachConfig = {
  id: 'motivational-interviewing',
  name: 'Motivational Interviewing',
  description: 'A collaborative, goal-oriented method to strengthen personal motivation for change.',
  systemPromptInstructions: '',
  guidanceHints: [],
  supervisorCriteria: [],
  suggestedQuestions: [],
}

export const ALL_FRAMEWORKS: ApproachConfig[] = [
  cbtFramework,
  psychodynamicFramework,
  actFramework,
  dbtFramework,
  humanisticFramework,
  // MI stub included so dashboard approach-list rendering is consistent
  // for personas that list motivational-interviewing in recommendedApproaches.
  miFrameworkStub,
]

const FRAMEWORK_MAP: Record<TherapeuticApproach, ApproachConfig> = {
  cbt: cbtFramework,
  psychodynamic: psychodynamicFramework,
  act: actFramework,
  dbt: dbtFramework,
  humanistic: humanisticFramework,
  'motivational-interviewing': miFrameworkStub,
}

export function getClinicalFramework(approach: TherapeuticApproach): ApproachConfig | null {
  return FRAMEWORK_MAP[approach] ?? null
}

export { cbtFramework, psychodynamicFramework, actFramework, dbtFramework, humanisticFramework }
