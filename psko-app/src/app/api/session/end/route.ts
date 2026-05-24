import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'
import { getPersonaById } from '@/lib/personas'
import { generateFeedback } from '@/lib/claude/supervisor-agent'
import { normalizeCompetencyScores } from '@/lib/reports/normalizeScores'
import type { TherapeuticApproach, MessageData, RoleMode } from '@/types'

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

  const persona = await getPersonaById(session.personaId, prisma)
  if (!persona) return Response.json({ error: 'Persona not found' }, { status: 404 })

  const messages: MessageData[] = session.messages.map((m) => ({
    id: m.id,
    sessionId: m.sessionId,
    role: m.role as 'student' | 'patient',
    content: m.content,
    createdAt: m.createdAt,
  }))

  try {
    const feedback = await generateFeedback(
      persona,
      session.therapeuticApproach as TherapeuticApproach,
      messages,
      session.roleMode as RoleMode
    )

    const competencyScores = normalizeCompetencyScores(feedback)
    const overallScoreRaw = (feedback as { overall_score?: unknown })?.overall_score
    const overallScore = typeof overallScoreRaw === 'number' ? overallScoreRaw : null

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        feedback: feedback as object,
        ...(overallScore !== null ? { overallScore } : {}),
      },
    })

    if (competencyScores.length > 0) {
      await prisma.sessionFeedbackScore.createMany({
        data: competencyScores.map((s) => ({
          sessionId,
          domain: s.domain,
          score: s.score,
          assessor: 'ai',
        })),
      })
    }

    // AGS grade passback (FR-6, AC-14). If this session was launched via LTI
    // and carries a lineitem URL, forward the score to lti-service which owns
    // the LMS access token. Fire-and-forget — AGS failures must not break the
    // student-facing session-end response.
    const ltiLineItemUrl = (session as { ltiLineItemUrl?: string | null }).ltiLineItemUrl
    const ltiServiceUrl = process.env.LTI_SERVICE_URL
    const internalSecret = process.env.LTI_INTERNAL_SECRET ?? process.env.ADMIN_SECRET
    if (ltiLineItemUrl && ltiServiceUrl && internalSecret && overallScore !== null) {
      void fetch(`${ltiServiceUrl}/ags/score`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-internal-secret': internalSecret,
        },
        body: JSON.stringify({
          ltiLineItemUrl,
          userId: user.id,
          score: overallScore,
          scoreMaximum: 100,
        }),
      }).catch((err) => {
        console.error('[session/end] ags forward failed:', err)
      })
    }

    return Response.json({ session: updated, feedback })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[session/end] error:', msg)
    return Response.json({ error: 'Failed to end session', detail: msg }, { status: 500 })
  }
}
