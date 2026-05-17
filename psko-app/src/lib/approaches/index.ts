import type { TherapeuticApproach, ApproachConfig } from '@/types'
import { cbt as cbtBase } from './cbt'
import { psychodynamic as psychodynamicBase } from './psychodynamic'
import { humanistic as humanisticBase } from './humanistic'
import { act as actBase } from './act'
import { dbt as dbtBase } from './dbt'
import {
  cbtFramework,
  psychodynamicFramework,
  humanisticFramework,
  actFramework,
  dbtFramework,
} from '@/lib/clinical/frameworks'

// Merge base approach (prompts, hints, supervisor criteria) with clinical framework
// (protocol phases). The framework is the source of truth for `phases`; everything
// else comes from the base module. This is what the session UI consumes.
export const cbt: ApproachConfig = { ...cbtBase, phases: cbtFramework.phases }
export const psychodynamic: ApproachConfig = { ...psychodynamicBase, phases: psychodynamicFramework.phases }
export const humanistic: ApproachConfig = { ...humanisticBase, phases: humanisticFramework.phases }
export const act: ApproachConfig = { ...actBase, phases: actFramework.phases }
export const dbt: ApproachConfig = { ...dbtBase, phases: dbtFramework.phases }

export const approaches: Record<TherapeuticApproach, ApproachConfig> = {
  cbt,
  psychodynamic,
  humanistic,
  act,
  dbt,
}

export function getApproach(id: TherapeuticApproach): ApproachConfig {
  return approaches[id]
}
