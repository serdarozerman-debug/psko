import Anthropic from '@anthropic-ai/sdk'
import type { PersonaData, TherapeuticApproach, MessageData } from '@/types'
import { buildPatientPrompt } from './prompts/patient-prompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export function streamPatientResponse(
  persona: PersonaData,
  approach: TherapeuticApproach,
  history: MessageData[],
  studentMessage: string
): ReturnType<typeof anthropic.messages.stream> {
  const systemPrompt = buildPatientPrompt(persona, approach)

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({
      role: m.role === 'student' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
    { role: 'user' as const, content: studentMessage },
  ]

  return anthropic.messages.stream({
    model: 'claude-opus-4-5',
    max_tokens: 512,
    system: systemPrompt,
    messages,
  })
}

export async function getOpeningStatement(
  persona: PersonaData,
  approach: TherapeuticApproach
): Promise<string> {
  const systemPrompt = buildPatientPrompt(persona, approach)

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 256,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: '[SESSION START — please begin by introducing yourself and sharing what brought you here]',
      },
    ],
  })

  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}
