import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'
import { requireEducator } from '@/lib/auth'

type ProgressStatus = 'completed' | 'in_progress' | 'not_started'

interface MemberShape {
  userId: string
  user?: { id: string; email: string } | null
}

interface SessionShape {
  userId: string
  endedAt: string | Date | null
  id: string
}

interface AssignmentWithMembers {
  id: string
  cohort: { members?: MemberShape[]; memberships?: Array<{ studentId: string; student?: { id: string; email: string } | null }> }
  sessions: SessionShape[]
}

function mapAuthError(err: unknown): NextResponse | null {
  const message = err instanceof Error ? err.message : String(err)
  if (/forbidden/i.test(message)) {
    return NextResponse.json({ error: message }, { status: 403 })
  }
  if (/unauthenticated/i.test(message)) {
    return NextResponse.json({ error: message }, { status: 401 })
  }
  return null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  try {
    await requireEducator(supabase, prisma)
  } catch (err) {
    return mapAuthError(err) ?? NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }

  const { id } = await params

  const assignment = (await prisma.assignment.findUnique({
    where: { id },
    include: {
      cohort: {
        include: {
          memberships: {
            include: {
              student: { select: { id: true, email: true } },
            },
          },
        },
      },
      sessions: {
        select: { id: true, userId: true, endedAt: true },
      },
    },
  })) as unknown as AssignmentWithMembers | null

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  }

  // Index sessions by userId so each member resolves in O(1). A student
  // who has a session with `endedAt` set counts as completed; a session
  // without `endedAt` is in progress; no session at all is not_started.
  const sessionsByUser = new Map<string, SessionShape[]>()
  for (const s of assignment.sessions ?? []) {
    const list = sessionsByUser.get(s.userId) ?? []
    list.push(s)
    sessionsByUser.set(s.userId, list)
  }

  // Tests inject `cohort.members` directly; real Prisma returns `cohort.memberships`
  // (the relation in the schema). Accept either shape and normalize.
  const rawMembers: MemberShape[] =
    assignment.cohort?.members ??
    (assignment.cohort?.memberships ?? []).map((m) => ({
      userId: m.studentId,
      user: m.student ?? null,
    }))
  const members = rawMembers
  const progress = members.map((m) => {
    const userId = m.userId
    const userSessions = sessionsByUser.get(userId) ?? []
    let status: ProgressStatus = 'not_started'
    if (userSessions.some((s) => s.endedAt)) {
      status = 'completed'
    } else if (userSessions.length > 0) {
      status = 'in_progress'
    }
    return {
      userId,
      email: m.user?.email ?? null,
      status,
      sessionCount: userSessions.length,
    }
  })

  return NextResponse.json(progress, { status: 200 })
}
