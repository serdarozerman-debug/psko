import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'
import { getPersonaById } from '@/lib/personas'
import { getOpeningStatement } from '@/lib/claude/patient-agent'
import type { TherapeuticApproach, RoleMode } from '@/types'

const StartSessionSchema = z.object({
  personaId: z.string(),
  therapeuticApproach: z.enum(['cbt', 'psychodynamic', 'humanistic', 'act', 'dbt']),
  roleMode: z.enum(['THERAPIST', 'CLIENT']).default('THERAPIST'),
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

  const { personaId, therapeuticApproach, roleMode } = parsed.data
  const persona = getPersonaById(personaId)
  if (!persona) {
    return Response.json({ error: 'Persona not found' }, { status: 404 })
  }

  // Upsert user in DB
  await prisma.user.upsert({
    where: { email: user.email! },
    update: {},
    create: { id: user.id, email: user.email! },
  })

  const openingStatement = await getOpeningStatement(
    persona,
    therapeuticApproach as TherapeuticApproach,
    roleMode as RoleMode
  )

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      personaId,
      therapeuticApproach,
      roleMode: roleMode as RoleMode,
    },
  })

  const aiRole = roleMode === 'CLIENT' ? 'therapist' : 'patient'

  const message = await prisma.message.create({
    data: {
      sessionId: session.id,
      role: aiRole,
      content: openingStatement,
    },
  })

  return Response.json({ sessionId: session.id, openingMessage: message })
}
