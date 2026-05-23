import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator } from '@/lib/auth'
import { generateJoinCode } from '@/lib/cohorts/joinCode'

const CreateCohortSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
})

function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

function isAuthError(err: unknown): { status: number; message: string } | null {
  if (!(err instanceof Error)) return null
  if (/forbidden/i.test(err.message)) return { status: 403, message: 'Forbidden' }
  if (/unauthenticated/i.test(err.message)) return { status: 401, message: 'Unauthenticated' }
  return null
}

export async function GET(_request: Request) {
  const supabase = await createClient()

  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    const mapped = isAuthError(err)
    if (mapped) return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    throw err
  }

  const cohorts = await prisma.cohort.findMany({
    where: { instructorId: educator.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(cohorts, { status: 200 })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    const mapped = isAuthError(err)
    if (mapped) return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    throw err
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateCohortSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const joinCode = generateJoinCode()

  const cohort = await prisma.cohort.create({
    data: {
      name: parsed.data.name,
      instructorId: educator.id,
      joinCode,
      joinCodeEnabled: true,
    },
  })

  return NextResponse.json(cohort, { status: 201 })
}
