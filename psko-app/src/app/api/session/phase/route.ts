import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { getPhaseForTurn } from '@/lib/clinical/phase-engine/detect-phase'
import { validatePhaseTransition } from '@/lib/clinical/phase-engine/validate-transition'
import type { TherapeuticApproach } from '@/types'

/**
 * GET /api/session/phase?sessionId=...
 *
 * Returns phase guidance for the current turn. Server is authoritative:
 *   - Computes the candidate phase from turnCount + approach
 *   - Validates it is a legal successor of session.currentPhase
 *   - If legal: persists (awaited) and returns advanced guidance
 *   - If blocked: returns the persisted currentPhase + { blocked: true, attempted }
 */
export async function GET(req: Request) {
  try {
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

    const approach = session.therapeuticApproach as TherapeuticApproach
    const guidance = getPhaseForTurn(approach, session.turnCount)

    // Phase unchanged — no validation or persistence needed
    if (guidance.currentPhase === session.currentPhase) {
      return Response.json(guidance)
    }

    // Validate transition before persisting
    const transition = validatePhaseTransition(
      approach,
      session.currentPhase,
      guidance.currentPhase
    )

    if (!transition.valid) {
      console.warn('[phase] blocked transition', {
        sessionId,
        userId: user.id,
        approach,
        from: session.currentPhase,
        attempted: guidance.currentPhase,
        reason: transition.reason,
      })
      // Recompute guidance pinned to the persisted phase so the UI shows
      // the still-current phase, not the rejected one.
      return Response.json({
        ...guidance,
        currentPhase: session.currentPhase,
        blocked: true,
        attempted: guidance.currentPhase,
        reason: transition.reason,
      })
    }

    // Legal advance — await persistence; surface 500 on failure
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { currentPhase: guidance.currentPhase },
      })
    } catch (err) {
      console.error('[phase] persistence failed', { sessionId, err })
      return Response.json({ error: 'Failed to persist phase' }, { status: 500 })
    }

    return Response.json(guidance)
  } catch (err) {
    console.error('[phase] unexpected error', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/session/phase — explicit phase transition (admin/recovery use).
 *
 * Body: { sessionId: string, toPhase: number }
 * Auth: user must be authenticated AND have admin role (app_metadata.role).
 * Validates via validatePhaseTransition; 409 on illegal jump.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (user.app_metadata as Record<string, unknown> | undefined)?.role
    if (role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin role required' }, { status: 403 })
    }

    const body = (await req.json().catch(() => null)) as
      | { sessionId?: string; toPhase?: number }
      | null
    if (!body?.sessionId || typeof body.toPhase !== 'number') {
      return Response.json({ error: 'sessionId and toPhase required' }, { status: 400 })
    }

    const session = await prisma.session.findUnique({
      where: { id: body.sessionId },
      select: { therapeuticApproach: true, currentPhase: true, endedAt: true },
    })
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 })
    if (session.endedAt) return Response.json({ error: 'Session already ended' }, { status: 400 })

    const approach = session.therapeuticApproach as TherapeuticApproach
    const transition = validatePhaseTransition(approach, session.currentPhase, body.toPhase)
    if (!transition.valid) {
      return Response.json(
        { error: 'Illegal phase transition', reason: transition.reason },
        { status: 409 }
      )
    }

    await prisma.session.update({
      where: { id: body.sessionId },
      data: { currentPhase: body.toPhase },
    })

    return Response.json({ sessionId: body.sessionId, currentPhase: body.toPhase })
  } catch (err) {
    console.error('[phase POST] unexpected error', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
