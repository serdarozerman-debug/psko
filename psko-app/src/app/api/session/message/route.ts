import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'
import { getPersonaById } from '@/lib/personas'
import { streamPatientResponse } from '@/lib/claude/patient-agent'
import type { TherapeuticApproach, MessageData } from '@/types'

const MessageSchema = z.object({
  sessionId: z.string(),
  content: z.string().min(1).max(2000),
})

const MAX_TURNS = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = MessageSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { sessionId, content } = parsed.data

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: user.id, endedAt: null },
  })
  if (!session) return Response.json({ error: 'Session not found' }, { status: 404 })
  if (session.turnCount >= MAX_TURNS) {
    return Response.json({ error: 'Session turn limit reached' }, { status: 400 })
  }

  const persona = getPersonaById(session.personaId)
  if (!persona) return Response.json({ error: 'Persona not found' }, { status: 404 })

  // Save student message
  await prisma.message.create({
    data: { sessionId, role: 'student', content },
  })

  // Get history
  const history = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  })

  const historyData: MessageData[] = history.map((m) => ({
    id: m.id,
    sessionId: m.sessionId,
    role: m.role as 'student' | 'patient',
    content: m.content,
    createdAt: m.createdAt,
  }))

  // Stream AI response (patient in THERAPIST mode, therapist in CLIENT mode)
  let stream
  try {
    stream = streamPatientResponse(
      persona,
      session.therapeuticApproach as TherapeuticApproach,
      historyData,
      content,
      session.roleMode as 'THERAPIST' | 'CLIENT'
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[session/message] stream error:', msg)
    return Response.json({ error: 'Failed to start AI response', detail: msg }, { status: 500 })
  }

  let fullResponse = ''

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text
            fullResponse += text
            controller.enqueue(new TextEncoder().encode(text))
          }
        }

        // Save AI response after stream completes
        await prisma.message.create({
          data: { sessionId, role: 'patient', content: fullResponse },
        })
        await prisma.session.update({
          where: { id: sessionId },
          data: { turnCount: { increment: 1 } },
        })
      } catch (err) {
        console.error('[session/message] stream read error:', err)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
