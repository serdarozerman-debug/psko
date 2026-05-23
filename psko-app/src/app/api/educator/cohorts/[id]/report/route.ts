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
  session?: { userId: string; endedAt: Date | null } | null
}

interface MembershipRow {
  studentId: string
  status: string
  student?: { id: string; email: string | null } | null
}

export async function GET(
  _req: Request,
  ctx: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const educator = await requireEducator(supabase, prisma)

    const cohortId = ctx.params.id

    const cohort = (await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        memberships: {
          include: { student: { select: { id: true, email: true } } },
        },
      },
    })) as unknown as
      | { id: string; instructorId: string; memberships: MembershipRow[] }
      | null

    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
    }
    if (cohort.instructorId !== educator.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const memberIds = cohort.memberships
      .filter((m) => m.status === 'ACTIVE')
      .map((m) => m.studentId)

    const scoreRows = memberIds.length
      ? ((await prisma.sessionFeedbackScore.findMany({
          where: { session: { userId: { in: memberIds } } },
          include: { session: { select: { userId: true, endedAt: true } } },
          orderBy: { createdAt: 'asc' },
        })) as unknown as ScoreRow[])
      : []

    // Group scores by studentId.
    const byStudent = new Map<string, ScoreRow[]>()
    for (const r of scoreRows) {
      const uid = r.session?.userId
      if (!uid) continue
      const list = byStudent.get(uid) ?? []
      list.push(r)
      byStudent.set(uid, list)
    }

    const studentScores = Array.from(byStudent.entries()).map(([studentId, rows]) => {
      const membership = cohort.memberships.find((m) => m.studentId === studentId)
      return {
        studentId,
        email: membership?.student?.email ?? null,
        scores: rows.map((r) => ({
          sessionId: r.sessionId,
          domain: r.domain,
          score: r.score,
          assessor: r.assessor,
          date: r.session?.endedAt ?? r.createdAt,
        })),
      }
    })

    // Domain averages across all member scores.
    const byDomain = new Map<string, { sum: number; n: number }>()
    for (const r of scoreRows) {
      const acc = byDomain.get(r.domain) ?? { sum: 0, n: 0 }
      acc.sum += r.score
      acc.n += 1
      byDomain.set(r.domain, acc)
    }
    const domainAverages = Array.from(byDomain.entries()).map(([domain, v]) => ({
      domain,
      average: v.n === 0 ? 0 : v.sum / v.n,
    }))

    return NextResponse.json({ studentScores, domainAverages })
  } catch (err) {
    const mapped = mapAuthError(err)
    if (mapped) return mapped
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[educator/cohorts/report] error:', msg)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
