import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'
import { getPersonaById } from '@/lib/personas'
import { generateFeedback } from '@/lib/claude/supervisor-agent'
import type { TherapeuticApproach, MessageData } from '@/types'

const EndSessionSchema = z.object({
  sessionId: z.string(),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = EndSessionSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { sessionId } = parsed.data

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!session) return Response.json({ error: 'Session not found' }, { status: 404 })
  if (session.endedAt) return Response.json({ error: 'Session already ended' }, { status: 400 })

  const persona = getPersonaById(session.personaId)
  if (!persona) return Response.json({ error: 'Persona not found' }, { status: 404 })

  const messages: MessageData[] = session.messages.map((m) => ({
    id: m.id,
    sessionId: m.sessionId,
    role: m.role as 'student' | 'patient',
    content: m.content,
    createdAt: m.createdAt,
  }))

  const feedback = await generateFeedback(
    persona,
    session.therapeuticApproach as TherapeuticApproach,
    messages
  )

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
      feedback: feedback as object,
    },
  })

  return Response.json({ session: updated, feedback })
}
