import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { getPhaseForTurn } from '@/lib/clinical/phase-engine/detect-phase'
import type { TherapeuticApproach } from '@/types'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  if (!sessionId) return Response.json({ error: 'sessionId required' }, { status: 400 })

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { therapeuticApproach: true, turnCount: true, currentPhase: true, endedAt: true },
  })
  if (!session) return Response.json({ error: 'Session not found' }, { status: 404 })
  if (session.endedAt) return Response.json({ error: 'Session already ended' }, { status: 400 })

  const guidance = getPhaseForTurn(
    session.therapeuticApproach as TherapeuticApproach,
    session.turnCount
  )

  // Persist phase if it changed (fire-and-forget, no await)
  if (guidance.currentPhase !== session.currentPhase) {
    prisma.session.update({
      where: { id: sessionId },
      data: { currentPhase: guidance.currentPhase },
    }).catch(() => {/* non-critical */})
  }

  return Response.json(guidance)
}
