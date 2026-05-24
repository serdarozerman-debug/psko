import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator, mapAuthError } from '@/lib/auth'

const AnnotateBodySchema = z.object({
  domain: z.string().min(1),
  score: z.number().int().min(1).max(6),
})

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } },
) {
  const supabase = await createClient()
  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    return mapAuthError(err) ?? NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }

  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    select: { userId: true },
  })

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Verify the session's user is in a cohort taught by this educator
  const cohort = await prisma.cohort.findFirst({
    where: {
      instructorId: educator.id,
      memberships: { some: { studentId: session.userId } },
    },
  })
  if (!cohort) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = AnnotateBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  const { domain, score } = parsed.data

  // Upsert: update existing 'instructor' score for this domain, or create new one
  const existing = await prisma.sessionFeedbackScore.findFirst({
    where: { sessionId: params.sessionId, domain, assessor: 'instructor' },
  })

  if (existing) {
    const updated = await prisma.sessionFeedbackScore.update({
      where: { id: existing.id },
      data: { score },
    })
    return NextResponse.json(updated, { status: 200 })
  }

  const created = await prisma.sessionFeedbackScore.create({
    data: {
      sessionId: params.sessionId,
      domain,
      score,
      assessor: 'instructor',
    },
  })
  return NextResponse.json(created, { status: 201 })
}
