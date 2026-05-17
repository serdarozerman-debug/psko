import type { IntakeQuestion } from '@/types'

/**
 * PHQ-9 (Patient Health Questionnaire-9) — depression screening
 * Over the last 2 weeks, how often have you been bothered by the following?
 * Scale: 0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day
 *
 * Note: These questions are for EDUCATIONAL purposes only.
 * Not for clinical diagnosis.
 */
export const PHQ9_QUESTIONS: IntakeQuestion[] = [
  {
    id: 'phq9_1',
    type: 'phq9',
    text: 'Little interest or pleasure in doing things',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'phq9_2',
    type: 'phq9',
    text: 'Feeling down, depressed, or hopeless',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'phq9_3',
    type: 'phq9',
    text: 'Trouble falling or staying asleep, or sleeping too much',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'phq9_4',
    type: 'phq9',
    text: 'Feeling tired or having little energy',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'phq9_5',
    type: 'phq9',
    text: 'Poor appetite or overeating',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'phq9_6',
    type: 'phq9',
    text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'phq9_7',
    type: 'phq9',
    text: 'Trouble concentrating on things, such as reading or watching television',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'phq9_8',
    type: 'phq9',
    text: 'Moving or speaking so slowly that other people could have noticed, or being fidgety / restless',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'phq9_9',
    type: 'phq9',
    text: 'Thoughts that you would be better off dead, or of hurting yourself in some way',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
]

/**
 * GAD-7 (Generalised Anxiety Disorder-7) — anxiety screening
 * Over the last 2 weeks, how often have you been bothered by the following?
 */
export const GAD7_QUESTIONS: IntakeQuestion[] = [
  {
    id: 'gad7_1',
    type: 'gad7',
    text: 'Feeling nervous, anxious, or on edge',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'gad7_2',
    type: 'gad7',
    text: 'Not being able to stop or control worrying',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'gad7_3',
    type: 'gad7',
    text: 'Worrying too much about different things',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'gad7_4',
    type: 'gad7',
    text: 'Trouble relaxing',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'gad7_5',
    type: 'gad7',
    text: 'Being so restless that it is hard to sit still',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'gad7_6',
    type: 'gad7',
    text: 'Becoming easily annoyed or irritable',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
  {
    id: 'gad7_7',
    type: 'gad7',
    text: 'Feeling afraid, as if something awful might happen',
    scaleMax: 3,
    scaleLabels: ['Not at all', 'Nearly every day'],
  },
]

/**
 * Open-ended clinical context questions
 */
export const OPEN_QUESTIONS: IntakeQuestion[] = [
  {
    id: 'open_1',
    type: 'open',
    text: 'In a few sentences, what brings you to therapy today?',
  },
  {
    id: 'open_2',
    type: 'open',
    text: 'How long have these difficulties been affecting you?',
  },
  {
    id: 'open_3',
    type: 'open',
    text: 'How are these difficulties affecting your daily life — work, relationships, or self-care?',
  },
]

/** All intake questions in presentation order: PHQ-9 → GAD-7 → Open */
export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  ...PHQ9_QUESTIONS,
  ...GAD7_QUESTIONS,
  ...OPEN_QUESTIONS,
]

/** Compute PHQ-9 total score from a responses map */
export function computePHQ9Score(responses: Record<string, string | number>): number {
  return PHQ9_QUESTIONS.reduce((sum, q) => sum + (Number(responses[q.id]) || 0), 0)
}

/** Compute GAD-7 total score from a responses map */
export function computeGAD7Score(responses: Record<string, string | number>): number {
  return GAD7_QUESTIONS.reduce((sum, q) => sum + (Number(responses[q.id]) || 0), 0)
}
