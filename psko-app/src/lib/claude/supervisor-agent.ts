import Anthropic from '@anthropic-ai/sdk'
import type { PersonaData, TherapeuticApproach, MessageData, SupervisorFeedback } from '@/types'
import { buildSupervisorPrompt } from './prompts/supervisor-prompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateFeedback(
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
