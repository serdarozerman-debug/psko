import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'
import { requireUser, mapAuthError } from '@/lib/auth'

export type StudentAssignmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export interface StudentAssignmentDTO {
  id: string
  cohortId: string
  cohortName: string
  personaId: string
  approachId: string | null
  roleMode: 'THERAPIST' | 'CLIENT'
  dueAt: string | null
  status: StudentAssignmentStatus
  latestSessionId: string | null
}

export async function GET() {
  const supabase = await createClient()
  let user
  try {
    user = await requireUser(supabase)
  } catch (err) {
    return mapAuthError(err) ?? NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }

  const memberships = await prisma.cohortMembership.findMany({
    where: { studentId: user.id, status: 'ACTIVE' },
    include: {
      cohort: {
        include: {
          assignments: true,
        },
      },
    },
  })

  // Flatten assignments and deduplicate by id
  const assignmentMap = new Map<
    string,
    { assignment: (typeof memberships)[number]['cohort']['assignments'][number]; cohortName: string }
  >()
  for (const m of memberships) {
    for (const a of m.cohort.assignments) {
      if (!assignmentMap.has(a.id)) {
        assignmentMap.set(a.id, { assignment: a, cohortName: m.cohort.name })
      }
    }
  }

  const assignmentIds = Array.from(assignmentMap.keys())
  // Pull this student's sessions for those assignments to derive status
  const sessions = assignmentIds.length
    ? await prisma.session.findMany({
        where: {
          userId: user.id,
          assignmentId: { in: assignmentIds },
          deletedAt: null,
        },
        orderBy: { startedAt: 'desc' },
        select: { id: true, assignmentId: true, endedAt: true, startedAt: true },
      })
    : []

  const sessionByAssignment = new Map<
    string,
    { id: string; endedAt: Date | null }
  >()
  for (const s of sessions) {
    if (!s.assignmentId) continue
    // first one wins -> most recent (already ordered desc)
    if (!sessionByAssignment.has(s.assignmentId)) {
      sessionByAssignment.set(s.assignmentId, { id: s.id, endedAt: s.endedAt })
    }
  }

  const dtos: StudentAssignmentDTO[] = Array.from(assignmentMap.values()).map(
    ({ assignment, cohortName }) => {
      const latest = sessionByAssignment.get(assignment.id) ?? null
      let status: StudentAssignmentStatus = 'NOT_STARTED'
      if (latest) {
        status = latest.endedAt ? 'COMPLETED' : 'IN_PROGRESS'
      }
      return {
        id: assignment.id,
        cohortId: assignment.cohortId,
        cohortName,
        personaId: assignment.personaId,
        approachId: assignment.approachId ?? null,
        roleMode: assignment.roleMode === 'CLIENT' ? 'CLIENT' : 'THERAPIST',
        dueAt: assignment.dueAt ? assignment.dueAt.toISOString() : null,
        status,
        latestSessionId: latest?.id ?? null,
      }
    },
  )

  // Sort: overdue first, then by dueAt asc, undated last
  dtos.sort((a, b) => {
    if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt)
    if (a.dueAt) return -1
    if (b.dueAt) return 1
    return 0
  })

  return NextResponse.json(dtos, { status: 200 })
}
