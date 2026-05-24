import { prisma } from '@/lib/db/prisma'

/**
 * List assignments for every cohort owned by the given educator.
 *
 * Ownership is enforced by joining on `cohort.instructorId`, so educators only
 * see assignments tied to their own cohorts even if other educators created
 * assignments for shared persona ids.
 */
export function getAssignmentsForEducator(educatorId: string) {
  return prisma.assignment.findMany({
    where: { cohort: { instructorId: educatorId } },
    orderBy: { createdAt: 'desc' },
    include: {
      cohort: { select: { id: true, name: true } },
    },
  })
}

/**
 * Fetch a single assignment along with its cohort members and the sessions
 * that reference it. Returns null when the assignment doesn't exist OR when
 * its cohort isn't owned by the given educator (ownership enforcement).
 *
 * The returned shape is consumed by the progress route, which derives a
 * per-student `completed | in_progress | not_started` status from the
 * member/session join.
 */
export function getAssignmentProgress(assignmentId: string, educatorId: string) {
  return prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      cohort: {
        include: {
          memberships: {
            include: {
              student: { select: { id: true, email: true } },
            },
          },
          instructor: { select: { id: true } },
        },
      },
      sessions: {
        select: { id: true, userId: true, endedAt: true },
      },
    },
  }).then((assignment) => {
    if (!assignment) return null
    if (assignment.cohort.instructor.id !== educatorId) return null
    return assignment
  })
}
