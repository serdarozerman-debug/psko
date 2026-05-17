import Anthropic from '@anthropic-ai/sdk'
import type { CaseFormulation, TherapeuticApproach } from '@/types'
import { computePHQ9Score, computeGAD7Score } from './questions'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Generate a case formulation and approach recommendation from intake responses.
 * Called once per session start when intake data is present.
 */
export async function buildCaseFormulation(
  responses: Record<string, string | number>,
  personaName: string,
  personaPresentingProblem: string
): Promise<CaseFormulation> {
  const phq9 = computePHQ9Score(responses)
  const gad7 = computeGAD7Score(responses)
  const openAnswers = {
    presenting: String(responses['open_1'] ?? ''),
    duration: String(responses['open_2'] ?? ''),
    impact: String(responses['open_3'] ?? ''),
  }

  const prompt = buildFormulationPrompt(phq9, gad7, openAnswers, personaName, personaPresentingProblem)

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from formulation agent')

  try {
    const jsonMatch = block.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in formulation response')
    return JSON.parse(jsonMatch[0]) as CaseFormulation
  } catch {
    // Fallback formulation if parsing fails
    return getDefaultFormulation(phq9, gad7, personaPresentingProblem)
  }
}

function buildFormulationPrompt(
  phq9: number,
  gad7: number,
  open: { presenting: string; duration: string; impact: string },
  personaName: string,
  presentingProblem: string
): string {
  const phq9Severity = phq9 <= 4 ? 'minimal' : phq9 <= 9 ? 'mild' : phq9 <= 14 ? 'moderate' : phq9 <= 19 ? 'moderately severe' : 'severe'
  const gad7Severity = gad7 <= 4 ? 'minimal' : gad7 <= 9 ? 'mild' : gad7 <= 14 ? 'moderate' : 'severe'

  return `You are a clinical psychology supervisor helping a trainee student prepare for a therapy session.

CLIENT: ${personaName}
PRESENTING PROBLEM (persona): "${presentingProblem}"

INTAKE SCREENING (educational context only — not clinical diagnosis):
- PHQ-9 score: ${phq9}/27 (${phq9Severity} depression indicators)
- GAD-7 score: ${gad7}/21 (${gad7Severity} anxiety indicators)

STUDENT'S INTAKE NOTES:
- What brings them to therapy: "${open.presenting || 'Not provided'}"
- Duration: "${open.duration || 'Not provided'}"
- Life impact: "${open.impact || 'Not provided'}"

Generate a brief case formulation to help the student prepare for this session. Focus on educational insight, not clinical diagnosis.

Respond ONLY with JSON in this format:
{
  "summary": "<2-3 sentence overview of the clinical picture for the student>",
  "primaryConcerns": ["<concern 1>", "<concern 2>"],
  "recommendedApproaches": [
    {"approachId": "cbt", "rationale": "<why CBT fits>", "priority": "first-line"},
    {"approachId": "humanistic", "rationale": "<why humanistic fits>", "priority": "second-line"}
  ],
  "contraindicatedApproaches": [
    {"approachId": "dbt", "reason": "<why less suitable here>"}
  ],
  "clinicalContext": "<1-2 sentence context to guide the session opening>"
}`
}

function getDefaultFormulation(phq9: number, gad7: number, presentingProblem: string): CaseFormulation {
  const approaches: TherapeuticApproach[] = phq9 > gad7 ? ['cbt', 'humanistic'] : ['cbt', 'act']
  return {
    summary: `The client presents with ${presentingProblem}. Screening suggests ${phq9 > 9 ? 'moderate depressive' : 'mild'} and ${gad7 > 9 ? 'moderate anxiety' : 'mild'} indicators. This is an educational simulation.`,
    primaryConcerns: [presentingProblem],
    recommendedApproaches: approaches.map((id, i) => ({
      approachId: id,
      rationale: `Suitable for the presenting pattern`,
      priority: i === 0 ? 'first-line' as const : 'second-line' as const,
    })),
    contraindicatedApproaches: [],
    clinicalContext: `Open with an empathic, non-judgmental tone. Allow the client to set the initial pace.`,
  }
}
