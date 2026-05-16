import type { PersonaData, TherapeuticApproach, MessageData } from '@/types'
import { getApproach } from '@/lib/approaches'

export function buildSupervisorPrompt(
  persona: PersonaData,
  approach: TherapeuticApproach,
  messages: MessageData[]
): string {
  const approachConfig = getApproach(approach)
  const transcript = messages
    .map((m) => `[${m.role === 'student' ? 'THERAPIST' : 'CLIENT'}]: ${m.content}`)
    .join('\n\n')

  return `You are an experienced clinical psychology supervisor evaluating a trainee's therapy session.

SESSION CONTEXT:
- Client: ${persona.name}, ${persona.age} years old
- Presenting problem: ${persona.presentingProblem}
- Therapeutic approach used: ${approachConfig.name}

EVALUATION CRITERIA FOR ${approachConfig.name.toUpperCase()}:
${approachConfig.supervisorCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

CTS-R COMPETENCY DOMAINS TO SCORE (score each 1-6):
1. Agenda Setting & Adherence
2. Feedback (checking client understanding)
3. Collaboration
4. Pacing & Efficient Use of Time
5. Interpersonal Effectiveness
6. Eliciting Appropriate Emotional Expression
7. Eliciting Key Cognitions
8. Guided Discovery
9. Conceptual Integration

SCORING SCALE:
1 = Poor — significant problems, major areas missed
2 = Borderline — some competence but important gaps
3 = Satisfactory — adequate performance with some limitations
4 = Good — competent with only minor limitations
5 = Very Good — consistently competent
6 = Excellent — exceptional performance

TRANSCRIPT:
${transcript}

INSTRUCTIONS:
Analyze the transcript carefully and provide structured feedback in the following JSON format only (no other text):

{
  "overallScore": <number 0-100>,
  "competencyScores": [
    {"domain": "Agenda Setting & Adherence", "score": <1-6>, "comment": "<specific observation from transcript>"},
    {"domain": "Feedback", "score": <1-6>, "comment": "<specific observation>"},
    {"domain": "Collaboration", "score": <1-6>, "comment": "<specific observation>"},
    {"domain": "Pacing & Efficient Use of Time", "score": <1-6>, "comment": "<specific observation>"},
    {"domain": "Interpersonal Effectiveness", "score": <1-6>, "comment": "<specific observation>"},
    {"domain": "Eliciting Appropriate Emotional Expression", "score": <1-6>, "comment": "<specific observation>"},
    {"domain": "Eliciting Key Cognitions", "score": <1-6>, "comment": "<specific observation>"},
    {"domain": "Guided Discovery", "score": <1-6>, "comment": "<specific observation>"},
    {"domain": "Conceptual Integration", "score": <1-6>, "comment": "<specific observation>"}
  ],
  "strengths": ["<specific strength with example from transcript>", ...],
  "areasForImprovement": ["<specific, actionable improvement>", ...],
  "keyMoments": [
    {"turn": <message index>, "note": "<what happened and why it matters>"},
    ...
  ],
  "suggestedReadings": ["<title or resource relevant to areas for improvement>", ...]
}`
}
