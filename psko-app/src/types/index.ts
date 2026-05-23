export type TherapeuticApproach = 'cbt' | 'psychodynamic' | 'humanistic' | 'act' | 'dbt' | 'motivational-interviewing'
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
export type MessageRole = 'student' | 'patient'
export type ConversationalStyle = 'plain' | 'upset' | 'reserved' | 'verbose' | 'pleasing' | 'tangent'
/** THERAPIST = student plays the therapist; CLIENT = student plays the patient */
export type RoleMode = 'THERAPIST' | 'CLIENT'

// ─── Clinical Intelligence Engine Types ────────────────────────────────────

/** A single phase in a therapeutic approach protocol */
export interface ProtocolPhase {
  /** 0-based index */
  index: number
  /** Short label shown in the guidance panel */
  name: string
  /** Clinical objective for this phase */
  objective: string
  /** Specific techniques to suggest to the student */
  techniques: string[]
  /** Things to watch for / diagnostic cues */
  watchFor: string[]
  /** Earliest turn count to consider transitioning to this phase */
  triggerTurnMin: number
}

/** A single question in the intake questionnaire */
export interface IntakeQuestion {
  id: string
  /** PHQ-9, GAD-7, or custom */
  type: 'phq9' | 'gad7' | 'open' | 'scale'
  text: string
  /** For scale questions (0–3 or 0–10) */
  scaleMax?: number
  scaleLabels?: [string, string]
}

/** Claude-generated case formulation from intake answers */
export interface CaseFormulation {
  summary: string
  primaryConcerns: string[]
  /** Approach ID → short clinical rationale */
  recommendedApproaches: Array<{
    approachId: TherapeuticApproach
    rationale: string
    priority: 'first-line' | 'second-line'
  }>
  contraindicatedApproaches: Array<{
    approachId: TherapeuticApproach
    reason: string
  }>
  /** Key clinical anchors to inject into the session system prompt */
  clinicalContext: string
}

/** Stored intake response record */
export interface IntakeResponseData {
  id: string
  sessionId: string
  responses: Record<string, string | number>
  formulation: CaseFormulation
  recommendedApproach: TherapeuticApproach
  createdAt: Date
}

/** Real-time phase guidance returned by the phase API */
export interface PhaseGuidance {
  currentPhase: number
  phase: ProtocolPhase | null
  nextPhase: ProtocolPhase | null
  /** Contextual suggestion for the student's very next move */
  nextMove: string
}

export interface Scid5Fields {
  onsetAge?: number
  durationMonths?: number
  functionalImpairment?: {
    social: number      // 0–9 scale
    occupational: number
    other: number
  }
  priorTreatment?: boolean
  traumaFlags?: string[]
}

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
  scid5?: Scid5Fields
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
  requiresTriggerWarning?: boolean
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
  currentPhase: number
  startedAt: Date
  endedAt?: Date
  turnCount: number
  feedback?: SupervisorFeedback | ClientDebrief
  persona?: PersonaData
  messages?: MessageData[]
  intakeResponse?: IntakeResponseData
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
  /** Phase-by-phase clinical protocol (optional — used by phase engine) */
  phases?: ProtocolPhase[]
}
