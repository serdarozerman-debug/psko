import Anthropic from '@anthropic-ai/sdk'
import type { PersonaData, TherapeuticApproach, MessageData, SupervisorFeedback, ClientDebrief, RoleMode } from '@/types'
import { buildSupervisorPrompt } from './prompts/supervisor-prompt'
import { buildDebriefPrompt } from './prompts/debrief-prompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Generates mode-appropriate feedback after a session ends.
 * - THERAPIST mode: returns SupervisorFeedback (CTS-R competency scores)
 * - CLIENT mode: returns ClientDebrief (emotional experience summary)
 */
export async function generateFeedback(
  persona: PersonaData,
  approach: TherapeuticApproach,
  messages: MessageData[],
  roleMode: RoleMode = 'THERAPIST'
): Promise<SupervisorFeedback | ClientDebrief> {
  if (roleMode === 'CLIENT') {
    return generateClientDebrief(persona, messages)
  }
  return generateTherapistFeedback(persona, approach, messages)
}

async function generateTherapistFeedback(
  persona: PersonaData,
  approach: TherapeuticApproach,
  messages: MessageData[]
): Promise<SupervisorFeedback> {
  if (messages.length < 2) {
    return getMinimalFeedback()
  }

  const prompt = buildSupervisorPrompt(persona, approach, messages)

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from supervisor agent')

  try {
    const jsonMatch = block.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in supervisor response')
    return JSON.parse(jsonMatch[0]) as SupervisorFeedback
  } catch {
    throw new Error('Failed to parse supervisor feedback: ' + block.text.slice(0, 200))
  }
}

async function generateClientDebrief(
  persona: PersonaData,
  messages: MessageData[]
): Promise<ClientDebrief> {
  if (messages.length < 2) {
    return getMinimalDebrief()
  }

  const prompt = buildDebriefPrompt(persona, messages)

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from debrief agent')

  try {
    const jsonMatch = block.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in debrief response')
    return JSON.parse(jsonMatch[0]) as ClientDebrief
  } catch {
    throw new Error('Failed to parse client debrief: ' + block.text.slice(0, 200))
  }
}

function getMinimalFeedback(): SupervisorFeedback {
  return {
    overallScore: 0,
    competencyScores: [],
    strengths: [],
    areasForImprovement: ['Session was too short to evaluate. Aim for at least 5 exchanges.'],
    keyMoments: [],
    suggestedReadings: [],
  }
}

function getMinimalDebrief(): ClientDebrief {
  return {
    type: 'client-debrief',
    experienceSummary: 'The session was too brief to generate a meaningful debrief. Try having at least 3-5 exchanges.',
    helpfulMoments: [],
    challengingMoments: [],
    emotionalThemes: [],
    techniqueUsed: 'Session too short to identify technique',
    reflectionPrompts: [
      'What did you notice in yourself during this short exchange?',
      'What would you have liked the therapist to ask you?',
    ],
  }
}
