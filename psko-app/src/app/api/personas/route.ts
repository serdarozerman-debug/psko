import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { personaLibrary } from '@/lib/personas'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/personas
 *
 * Returns the merged list of personas visible to the authenticated user:
 *   - All file-based library personas (always visible).
 *   - For educators: their own custom personas (createdBy = user.id).
 *   - For students: custom personas referenced by assignments in cohorts
 *     the student is an ACTIVE member of.
 */
export async function GET(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role =
    (user as { app_metadata?: { role?: string } }).app_metadata?.role ?? 'STUDENT'

  // Library personas — shape mirrors prior behaviour (library list view).
  const libraryPersonas = personaLibrary.map((p) => ({
    id: p.id,
    name: p.name,
    age: p.age,
    presentingProblem: p.presentingProblem,
    difficultyLevel: p.difficultyLevel,
    conversationalStyle: p.conversationalStyle,
    recommendedApproaches: p.recommendedApproaches,
    disorderProfile: p.disorderProfile,
    isCustom: false,
  }))

  let customPersonas: unknown[] = []

  if (role === 'EDUCATOR') {
    customPersonas = await prisma.persona.findMany({
      where: { createdBy: user.id, isCustom: true },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    // STUDENT — find active cohort memberships, then personas assigned via those cohorts.
    const memberships = await prisma.cohortMembership.findMany({
      where: { studentId: user.id, status: 'ACTIVE' },
      select: { cohortId: true },
    })

    const cohortIds = memberships.map((m) => m.cohortId)

    if (cohortIds.length > 0) {
      customPersonas = await prisma.persona.findMany({
        where: {
          isCustom: true,
          assignments: { some: { cohortId: { in: cohortIds } } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }
  }

  const personas = [...libraryPersonas, ...customPersonas]

  return NextResponse.json({ personas }, { status: 200 })
}
