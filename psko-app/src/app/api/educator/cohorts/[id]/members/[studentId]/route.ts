import { NextResponse } from 'next/server'
import { MembershipStatus } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator } from '@/lib/auth'

function mapAuthError(err: unknown) {
  if (err instanceof Error) {
    if (/forbidden/i.test(err.message)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (/unauthenticated/i.test(err.message)) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
  }
  return null
}

type RouteContext = { params: { id: string; studentId: string } }

export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabase = await createClient()

  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    const mapped = mapAuthError(err)
    if (mapped) return mapped
    throw err
  }

  // Ownership check — educator must own the cohort
  const cohort = await prisma.cohort.findUnique({
    where: { id: params.id },
  })
  if (!cohort || cohort.instructorId !== educator.id) {
    return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
  }

  const membership = await prisma.cohortMembership.findUnique({
    where: { cohortId_studentId: { cohortId: params.id, studentId: params.studentId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
  }

  const updated = await prisma.cohortMembership.update({
    where: { cohortId_studentId: { cohortId: params.id, studentId: params.studentId } },
    // Soft-delete: schema uses INACTIVE (not REMOVED) — see prisma/schema.prisma MembershipStatus enum
    data: { status: MembershipStatus.INACTIVE },
  })

  return NextResponse.json(updated, { status: 200 })
}
