import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getPersonaById } from '@/lib/personas'
import { buildCaseFormulation } from '@/lib/clinical/intake/formulation'
import { INTAKE_QUESTIONS } from '@/lib/clinical/intake/questions'

const AnalyzeIntakeSchema = z.object({
  personaId: z.string(),
  responses: z.record(z.union([z.string(), z.number()])),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = AnalyzeIntakeSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { personaId, responses } = parsed.data
  const persona = getPersonaById(personaId)
  if (!persona) return Response.json({ error: 'Persona not found' }, { status: 404 })

  try {
    const formulation = await buildCaseFormulation(
      responses,
      persona.name,
      persona.presentingProblem
    )

    // Determine top recommended approach
    const firstLine = formulation.recommendedApproaches.find((a) => a.priority === 'first-line')
    const recommendedApproach = firstLine?.approachId
      ?? persona.recommendedApproaches[0]
      ?? 'cbt'

    return Response.json({
      formulation,
      recommendedApproach,
      questions: INTAKE_QUESTIONS,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[intake/analyze] error:', msg)
    return Response.json({ error: 'Formulation failed', detail: msg }, { status: 500 })
  }
}
