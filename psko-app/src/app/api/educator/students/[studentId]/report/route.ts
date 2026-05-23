import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'
import { requireEducator } from '@/lib/auth/requireEducator'

function mapAuthError(err: unknown): NextResponse | null {
  const msg = err instanceof Error ? err.message : String(err)
  if (/forbidden/i.test(msg)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (/unauthenticated/i.test(msg)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}

interface ScoreRow {
  id: string
  sessionId: string
  domain: string
  score: number
  assessor: string
  createdAt: Date
  session?: { endedAt: Date | null } | null
}

export async function GET(
  _req: Request,
  ctx: { params: { studentId: string } },
) {
  try {
    const supabase = await createClient()
    const educator = await requireEducator(supabase, prisma)

    const studentId = ctx.params.studentId

    const student = await prisma.user.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Verify the student is in a cohort owned by this educator.
    const cohort = await prisma.cohort.findFirst({
      where: {
        instructorId: educator.id,
        memberships: { some: { studentId } },
      },
    })
    if (!cohort) {
      return NextResponse.json(
        { error: 'Student not found in any cohort you manage' },
        { status: 404 },
      )
    }

    const rows = (await prisma.sessionFeedbackScore.findMany({
      where: { session: { userId: studentId } },
      include: { session: { select: { endedAt: true } } },
      orderBy: { createdAt: 'asc' },
    })) as unknown as ScoreRow[]

    const scores = rows.map((r) => ({
      sessionId: r.sessionId,
      domain: r.domain,
      score: r.score,
      assessor: r.assessor,
      date: r.session?.endedAt ?? r.createdAt,
    }))

    // Cohort averages: mean score per domain across all members in this cohort.
    const cohortMemberRows = await prisma.cohort.findUnique({
      where: { id: cohort.id },
      include: { memberships: { select: { studentId: true } } },
    })
    const memberIds = cohortMemberRows?.memberships.map((m) => m.studentId) ?? []

    const cohortRows = memberIds.length
      ? ((await prisma.sessionFeedbackScore.findMany({
          where: { session: { userId: { in: memberIds } } },
        })) as unknown as ScoreRow[])
      : []

    const byDomain = new Map<string, { sum: number; n: number }>()
    for (const r of cohortRows) {
      const acc = byDomain.get(r.domain) ?? { sum: 0, n: 0 }
      acc.sum += r.score
      acc.n += 1
      byDomain.set(r.domain, acc)
    }
    const cohortAverages = Array.from(byDomain.entries()).map(([domain, v]) => ({
      domain,
      average: v.n === 0 ? 0 : v.sum / v.n,
    }))

    return NextResponse.json({ scores, cohortAverages })
  } catch (err) {
    const mapped = mapAuthError(err)
    if (mapped) return mapped
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[educator/students/report] error:', msg)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
