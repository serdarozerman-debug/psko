import type { PersonaData, MessageData } from '@/types'

/**
 * Builds the feedback prompt for CLIENT mode sessions.
 * Asks Claude to generate an emotional experience debrief for the student
 * who acted as the patient/client during the session.
 */
export function buildDebriefPrompt(persona: PersonaData, messages: MessageData[]): string {
  const transcript = messages
    .map((m) => `[${m.role === 'student' ? 'CLIENT (student)' : 'THERAPIST (PSKO)'}]: ${m.content}`)
    .join('\n\n')

  return `You are a clinical psychology educator reviewing a session in which a psychology student took on the role of the client/patient.

SESSION CONTEXT:
The student was exploring the experience of a client presenting with: "${persona.presentingProblem}"

TRANSCRIPT:
${transcript}

YOUR TASK:
Generate a compassionate, educational debrief for the student who was in the client role. Focus on:
1. What emotional experience this type of client might have had
2. What felt helpful or unhelpful in how the AI therapist responded
3. Emotional themes that emerged through the session
4. The therapeutic technique or approach used by the AI therapist
5. Reflective prompts to help the student integrate this experience

IMPORTANT:
- Be warm, non-judgmental, and educationally focused
- Normalize any difficult emotions the student may have experienced
- Frame the debrief as a learning opportunity, not a critique
- Reference specific moments from the transcript where relevant

Respond ONLY with a JSON object in this exact format (no other text):

{
  "type": "client-debrief",
  "experienceSummary": "<2-3 sentence summary of the emotional experience this session likely evoked for the student as client>",
  "helpfulMoments": ["<specific thing the therapist did that was helpful>", ...],
  "challengingMoments": ["<specific moment or pattern that may have felt difficult or unhelpful>", ...],
  "emotionalThemes": ["<dominant emotional theme that emerged>", ...],
  "techniqueUsed": "<brief description of the main therapeutic approach/technique the AI therapist used in this session>",
  "reflectionPrompts": [
    "<a reflective question for the student to journal on>",
    "<another reflective question>",
    "<a third reflective question>"
  ]
}`
}
