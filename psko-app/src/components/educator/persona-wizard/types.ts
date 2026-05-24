export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export type ConversationalStyle =
  | 'plain'
  | 'upset'
  | 'reserved'
  | 'verbose'
  | 'pleasing'
  | 'tangent'

export type TherapeuticApproach =
  | 'cbt'
  | 'psychodynamic'
  | 'humanistic'
  | 'act'
  | 'dbt'
  | 'motivational-interviewing'

export interface PersonaFormData {
  name: string
  age: number
  presentingProblem: string
  backstory: string
  difficultyLevel: DifficultyLevel
  conversationalStyle: ConversationalStyle
  recommendedApproaches: string[]
  disorderProfile: string[]
  requiresTriggerWarning: boolean
  cognitiveModel: {
    coreBeliefs: string[]
    intermediateBeliefs: string[]
    automaticThoughts: string[]
    emotionalState: {
      primary: string
      intensity: 1 | 2 | 3 | 4 | 5
      secondary?: string
    }
    triggers: string[]
    defenses: string[]
    values: string[]
    scid5?: {
      onsetAge?: number
      durationMonths?: number
      functionalImpairment?: { social: number; occupational: number; other: number }
      priorTreatment?: boolean
      traumaFlags?: string[]
    }
  }
}

export const APPROACH_OPTIONS: TherapeuticApproach[] = [
  'cbt',
  'psychodynamic',
  'humanistic',
  'act',
  'dbt',
  'motivational-interviewing',
]

export const CONVERSATIONAL_STYLES: ConversationalStyle[] = [
  'plain',
  'upset',
  'reserved',
  'verbose',
  'pleasing',
  'tangent',
]

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
]

export const DEFAULT_FORM_DATA: PersonaFormData = {
  name: '',
  age: 30,
  presentingProblem: '',
  backstory: '',
  difficultyLevel: 'beginner',
  conversationalStyle: 'plain',
  recommendedApproaches: [],
  disorderProfile: [],
  requiresTriggerWarning: false,
  cognitiveModel: {
    coreBeliefs: [],
    intermediateBeliefs: [],
    automaticThoughts: [],
    emotionalState: { primary: '', intensity: 3 },
    triggers: [],
    defenses: [],
    values: [],
  },
}
