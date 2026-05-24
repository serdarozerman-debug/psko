import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator } from '@/lib/auth'

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

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    return mapAuthError(err) ?? NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }

  const cohort = await prisma.cohort.findUnique({
    where: { id: params.id },
    select: { id: true, instructorId: true },
  })

  if (!cohort) {
    return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
  }

  if (cohort.instructorId !== educator.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const memberships = await prisma.cohortMembership.findMany({
    where: { cohortId: cohort.id },
    orderBy: { joinedAt: 'asc' },
    include: {
      student: { select: { id: true, email: true } },
    },
  })

  const header = 'student_id,email,name,status,joined_at'
  const rows = memberships.map((m) => {
    const studentId = csvEscape(m.studentId)
    const email = csvEscape(m.student.email ?? '')
    const name = csvEscape('')
    const status = csvEscape(m.status)
    const joinedAt = csvEscape(m.joinedAt.toISOString())
    return `${studentId},${email},${name},${status},${joinedAt}`
  })

  const BOM = '﻿'
  const body = BOM + [header, ...rows].join('\n')

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cohort-${cohort.id}.csv"`,
    },
  })
}
