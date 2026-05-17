import { z } from 'zod'
import { RoleMode } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'
import { getPersonaById } from '@/lib/personas'
import { getOpeningStatement } from '@/lib/claude/patient-agent'
import { buildCaseFormulation } from '@/lib/clinical/intake/formulation'
import type { TherapeuticApproach, CaseFormulation } from '@/types'

const StartSessionSchema = z.object({
  personaId: z.string(),
  therapeuticApproach: z.enum(['cbt', 'psychodynamic', 'humanistic', 'act', 'dbt']),
  roleMode: z.enum(['THERAPIST', 'CLIENT']).default('THERAPIST'),
  /** Optional: pre-session intake answers */
  intakeResponses: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = StartSessionSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { personaId, therapeuticApproach, roleMode, intakeResponses } = parsed.data
  const persona = getPersonaById(personaId)
  if (!persona) {
    return Response.json({ error: 'Persona not found' }, { status: 404 })
  }

  try {
    // Upsert user in DB
    await prisma.user.upsert({
      where: { email: user.email! },
      update: {},
      create: { id: user.id, email: user.email! },
    })

    // Optional: build case formulation from intake answers
    let formulation: CaseFormulation | null = null
    if (intakeResponses && Object.keys(intakeResponses).length > 0) {
      formulation = await buildCaseFormulation(
        intakeResponses,
        persona.name,
        persona.presentingProblem
      ).catch(() => null)
    }

    // Use Prisma's generated RoleMode enum directly to avoid type mismatches
    const prismaRoleMode = roleMode === 'CLIENT' ? RoleMode.CLIENT : RoleMode.THERAPIST

    const openingStatement = await getOpeningStatement(
      persona,
      therapeuticApproach as TherapeuticApproach,
      roleMode as 'CLIENT' | 'THERAPIST',
      formulation?.clinicalContext
    )

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        personaId,
        therapeuticApproach,
        roleMode: prismaRoleMode,
      },
    })

    // Store intake response if present
    if (formulation && intakeResponses) {
      await prisma.intakeResponse.create({
        data: {
          sessionId: session.id,
          responses: intakeResponses as object,
          formulation: formulation as object,
          recommendedApproach: therapeuticApproach,
        },
      }).catch(() => {/* non-critical */})
    }

    // The AI's message role is always 'patient' structurally (student = human, patient = AI).
    // roleMode on the session determines the AI's *character* (psychologist vs patient persona).
    const message = await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'patient',
        content: openingStatement,
      },
    })

    return Response.json({ sessionId: session.id, openingMessage: message })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[session/start] error:', message)
    return Response.json({ error: 'Session creation failed', detail: message }, { status: 500 })
  }
}
