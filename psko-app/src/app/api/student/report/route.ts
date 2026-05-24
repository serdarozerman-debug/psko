import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await prisma.sessionFeedbackScore.findMany({
    where: { session: { userId: user.id } },
    include: { session: { select: { endedAt: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const scores = rows.map((r) => ({
    sessionId: r.sessionId,
    domain: r.domain,
    score: r.score,
    assessor: r.assessor,
    date: r.session?.endedAt ?? r.createdAt,
  }))

  return NextResponse.json({ scores })
}
