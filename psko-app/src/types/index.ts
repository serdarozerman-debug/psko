export type TherapeuticApproach = 'cbt' | 'psychodynamic' | 'humanistic' | 'act' | 'dbt'
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
export type MessageRole = 'student' | 'patient'
export type ConversationalStyle = 'plain' | 'upset' | 'reserved' | 'verbose' | 'pleasing' | 'tangent'
/** THERAPIST = student plays the therapist; CLIENT = student plays the patient */
export type RoleMode = 'THERAPIST' | 'CLIENT'

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
  roleMode: RoleMode
  startedAt: Date
  endedAt?: Date
  turnCount: number
  feedback?: SupervisorFeedback | ClientDebrief
  persona?: PersonaData
  messages?: MessageData[]
}

/** Emotional experience debrief for CLIENT mode sessions */
export interface ClientDebrief {
  /** Discriminant: always 'client-debrief' so callers can narrow the union */
  type: 'client-debrief'
  /** Summary of the experience from the student-as-client perspective */
  experienceSummary: string
  /** What felt helpful during the session */
  helpfulMoments: string[]
  /** What felt challenging or unhelpful */
  challengingMoments: string[]
  /** Emotional themes that emerged */
  emotionalThemes: string[]
  /** Brief note on the therapeutic technique the AI therapist used */
  techniqueUsed: string
  /** Reflective prompts for the student to journal on */
  reflectionPrompts: string[]
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
