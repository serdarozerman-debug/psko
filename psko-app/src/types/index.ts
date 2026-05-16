export type TherapeuticApproach = 'cbt' | 'psychodynamic' | 'humanistic' | 'act' | 'dbt'
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
export type MessageRole = 'student' | 'patient'
export type ConversationalStyle = 'plain' | 'upset' | 'reserved' | 'verbose' | 'pleasing' | 'tangent'

export interface CognitiveModel {
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
}

export interface PersonaData {
  id: string
  name: string
  age: number
  presentingProblem: string
  backstory: string
  difficultyLevel: DifficultyLevel
  conversationalStyle: ConversationalStyle
  recommendedApproaches: TherapeuticApproach[]
  cognitiveModel: CognitiveModel
  disorderProfile: string[]
}

export interface MessageData {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  createdAt: Date
}

export interface CompetencyScore {
  domain: string
  score: number
  comment: string
}

export interface SessionMoment {
  turn: number
  note: string
}

export interface SupervisorFeedback {
  overallScore: number
  competencyScores: CompetencyScore[]
  strengths: string[]
  areasForImprovement: string[]
  keyMoments: SessionMoment[]
  suggestedReadings: string[]
}

export interface SessionData {
  id: string
  userId: string
  personaId: string
  therapeuticApproach: TherapeuticApproach
  startedAt: Date
  endedAt?: Date
  turnCount: number
  feedback?: SupervisorFeedback
  persona?: PersonaData
  messages?: MessageData[]
}

export interface ApproachConfig {
  id: TherapeuticApproach
  name: string
  description: string
  systemPromptInstructions: string
  guidanceHints: string[]
  supervisorCriteria: string[]
  suggestedQuestions: string[]
}
