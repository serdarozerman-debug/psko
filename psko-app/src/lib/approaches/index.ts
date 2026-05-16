import type { TherapeuticApproach, ApproachConfig } from '@/types'
import { cbt } from './cbt'
import { psychodynamic } from './psychodynamic'
import { humanistic } from './humanistic'
import { act } from './act'
import { dbt } from './dbt'

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

export { cbt, psychodynamic, humanistic, act, dbt }
