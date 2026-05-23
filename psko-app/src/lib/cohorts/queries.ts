import type { MembershipStatus } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

/** List cohorts owned by an educator, with member counts. */
export function getCohortsForEducator(educatorId: string) {
  return prisma.cohort.findMany({
    where: { instructorId: educatorId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { memberships: true } },
    },
  })
}

/**
 * Fetch a single cohort scoped to an educator. Returns null if the cohort
 * does not exist OR is owned by a different educator (ownership enforcement).
 * Includes memberships with nested student info.
 */
export function getCohortById(id: string, educatorId: string) {
  return prisma.cohort.findFirst({
    where: { id, instructorId: educatorId },
    include: {
      memberships: {
        orderBy: { joinedAt: 'asc' },
        include: {
          student: {
            select: { id: true, email: true, role: true },
          },
        },
      },
    },
  })
}

/** List the roster (memberships + student details) for a cohort. */
export function getCohortRoster(cohortId: string) {
  return prisma.cohortMembership.findMany({
    where: { cohortId },
    orderBy: { joinedAt: 'asc' },
    include: {
      student: {
        select: { id: true, email: true, role: true },
      },
    },
  })
}

/**
 * Upsert a cohort membership and force its status to the supplied value.
 * Used to set ACTIVE on join and REMOVED on removal.
 */
export function setMembershipStatus(
  cohortId: string,
  studentId: string,
  status: MembershipStatus,
) {
  return prisma.cohortMembership.upsert({
    where: { cohortId_studentId: { cohortId, studentId } },
    create: { cohortId, studentId, status },
    update: { status },
  })
}
