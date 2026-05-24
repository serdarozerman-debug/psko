import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator } from '@/lib/auth'
import { mintDeepLinkToken } from '@/lib/deeplink'

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

export async function POST(
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

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      cohortId: true,
      cohort: { select: { instructorId: true } },
    },
  })

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  }

  if (assignment.cohort.instructorId !== educator.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = await mintDeepLinkToken({
    assignmentId: assignment.id,
    cohortId: assignment.cohortId,
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = `${baseUrl}/session/join/${token}`

  return NextResponse.json({ token, url }, { status: 200 })
}
