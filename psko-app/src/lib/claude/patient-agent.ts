import Anthropic from '@anthropic-ai/sdk'
import type { PersonaData, TherapeuticApproach, MessageData, RoleMode } from '@/types'
import { buildPatientPrompt } from './prompts/patient-prompt'
import { buildTherapistPrompt } from './prompts/therapist-prompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Streams the AI response for a session turn.
 * - THERAPIST mode: AI plays the patient persona
 * - CLIENT mode: AI plays the psychologist
 */
export function streamPatientResponse(
  persona: PersonaData,
  approach: TherapeuticApproach,
  history: MessageData[],
  studentMessage: string,
  roleMode: RoleMode = 'THERAPIST'
): ReturnType<typeof anthropic.messages.stream> {
  const systemPrompt =
    roleMode === 'CLIENT'
      ? buildTherapistPrompt(persona)
      : buildPatientPrompt(persona, approach)

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

/**
 * Generates the opening message for a new session.
 * - THERAPIST mode: AI (patient) introduces itself
 * - CLIENT mode: AI (therapist) opens with a warm welcome
 */
export async function getOpeningStatement(
  persona: PersonaData,
  approach: TherapeuticApproach,
  roleMode: RoleMode = 'THERAPIST'
): Promise<string> {
  const systemPrompt =
    roleMode === 'CLIENT'
      ? buildTherapistPrompt(persona)
      : buildPatientPrompt(persona, approach)

  const openingPrompt =
    roleMode === 'CLIENT'
      ? '[SESSION START — please open the session as the therapist: welcome the client and invite them to share what brought them in]'
      : '[SESSION START — please begin by introducing yourself and sharing what brought you here]'

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 256,
    system: systemPrompt,
    messages: [{ role: 'user', content: openingPrompt }],
  })

  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}
