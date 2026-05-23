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

// Stub — full MI module is a separate workstream (spec § Out of Scope)
export const motivationalInterviewing: ApproachConfig = {
  id: 'motivational-interviewing',
  name: 'Motivational Interviewing',
  description: 'A collaborative, goal-oriented method of communication that strengthens personal motivation for change.',
  systemPromptInstructions: 'Use motivational interviewing techniques: express empathy, develop discrepancy, roll with resistance, and support self-efficacy.',
  guidanceHints: ['Explore ambivalence', 'Reflect change talk', 'Avoid argumentation', 'Support autonomy'],
  supervisorCriteria: ['Empathic listening', 'Change talk elicitation', 'Resistance rolling', 'Self-efficacy support'],
  suggestedQuestions: [
    'What concerns you most about your current situation?',
    'On a scale of 1-10, how important is change to you right now?',
    'What would need to be different for you to consider making a change?',
  ],
}

export const approaches: Record<TherapeuticApproach, ApproachConfig> = {
  cbt,
  psychodynamic,
  humanistic,
  act,
  dbt,
  'motivational-interviewing': motivationalInterviewing,
}

export function getApproach(id: TherapeuticApproach): ApproachConfig {
  return approaches[id]
}
