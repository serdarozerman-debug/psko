import type { ApproachConfig, TherapeuticApproach } from '@/types'
import { cbtFramework } from './cbt'
import { psychodynamicFramework } from './psychodynamic'
import { actFramework } from './act'
import { dbtFramework } from './dbt'
import { humanisticFramework } from './humanistic'

export const ALL_FRAMEWORKS: ApproachConfig[] = [
  cbtFramework,
  psychodynamicFramework,
  actFramework,
  dbtFramework,
  humanisticFramework,
]

const FRAMEWORK_MAP: Record<TherapeuticApproach, ApproachConfig> = {
  cbt: cbtFramework,
  psychodynamic: psychodynamicFramework,
  act: actFramework,
  dbt: dbtFramework,
  humanistic: humanisticFramework,
}

export function getClinicalFramework(approach: TherapeuticApproach): ApproachConfig | null {
  return FRAMEWORK_MAP[approach] ?? null
}

export { cbtFramework, psychodynamicFramework, actFramework, dbtFramework, humanisticFramework }
