import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireUser } from '@/lib/auth'
import { verifyDeepLinkToken } from '@/lib/deeplink'

export async function POST(
  _req: Request,
  { params }: { params: { token: string } },
) {
  const supabase = await createClient()

  let user
  try {
    user = await requireUser(supabase)
  } catch {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const payload = await verifyDeepLinkToken(params.token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: payload.assignmentId },
    select: { id: true, cohortId: true },
  })

  if (!assignment || assignment.cohortId !== payload.cohortId) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  await prisma.cohortMembership.upsert({
    where: {
      cohortId_studentId: {
        cohortId: payload.cohortId,
        studentId: user.id,
      },
    },
    create: {
      cohortId: payload.cohortId,
      studentId: user.id,
      status: 'ACTIVE',
    },
    update: {
      status: 'ACTIVE',
    },
  })

  return NextResponse.json(
    {
      assignmentId: payload.assignmentId,
      cohortId: payload.cohortId,
      message: 'Joined successfully',
    },
    { status: 200 },
  )
}
