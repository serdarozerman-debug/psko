import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { getPersonaById } from '@/lib/personas'
import { getApproach } from '@/lib/approaches'
import type { TherapeuticApproach, SupervisorFeedback, ClientDebrief, RoleMode } from '@/types'
import SimulationChat from '@/components/simulation/SimulationChat'
import FeedbackReport from '@/components/feedback/FeedbackReport'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const session = await prisma.session.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

  if (!session) notFound()

  const persona = getPersonaById(session.personaId)
  const approach = getApproach(session.therapeuticApproach as TherapeuticApproach)

  if (!persona || !approach) notFound()

  const roleMode = (session.roleMode ?? 'THERAPIST') as RoleMode
  const isEnded = !!session.endedAt
  const feedback = session.feedback as SupervisorFeedback | ClientDebrief | null

  if (isEnded && feedback) {
    return (
      <FeedbackReport
        session={session as Parameters<typeof FeedbackReport>[0]['session']}
        persona={persona}
        approach={approach}
        feedback={feedback}
        roleMode={roleMode}
      />
    )
  }

  return (
    <SimulationChat
      sessionId={session.id}
      persona={persona}
      approach={approach}
      initialMessages={session.messages.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role as 'student' | 'patient',
        content: m.content,
        createdAt: m.createdAt,
      }))}
      turnCount={session.turnCount}
      roleMode={roleMode}
    />
  )
}
