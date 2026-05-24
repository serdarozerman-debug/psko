import { NextResponse } from 'next/server'
import { MembershipStatus } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireUser, mapAuthError } from '@/lib/auth'

type RouteContext = { params: { code: string } }

export async function POST(_request: Request, { params }: RouteContext) {
  const supabase = await createClient()

  let user
  try {
    user = await requireUser(supabase)
  } catch (err) {
    const mapped = mapAuthError(err)
    if (mapped) return mapped
    throw err
  }

  const code = params.code

  // Look up cohort by join code. findFirst (not findUnique) so we can
  // include the enabled-check semantics cleanly and return 404 vs 410.
  const cohort = await prisma.cohort.findFirst({
    where: { joinCode: code },
  })

  if (!cohort) {
    return NextResponse.json({ error: 'Join code not found' }, { status: 404 })
  }

  if (!cohort.joinCodeEnabled) {
    return NextResponse.json(
      { error: 'Join code is no longer active' },
      { status: 410 },
    )
  }

  const membership = await prisma.cohortMembership.upsert({
    where: { cohortId_studentId: { cohortId: cohort.id, studentId: user.id } },
    create: { cohortId: cohort.id, studentId: user.id, status: MembershipStatus.ACTIVE },
    update: { status: MembershipStatus.ACTIVE },
  })

  return NextResponse.json(membership, { status: 200 })
}
