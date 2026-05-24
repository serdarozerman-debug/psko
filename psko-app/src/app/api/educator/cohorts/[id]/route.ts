import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator, mapAuthError } from '@/lib/auth'

const UpdateCohortSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    joinCodeEnabled: z.boolean().optional(),
  })
  .refine((d) => d.name !== undefined || d.joinCodeEnabled !== undefined, {
    message: 'At least one field must be provided',
  })

type RouteContext = { params: { id: string } }

export async function GET(_request: Request, { params }: RouteContext) {
  const supabase = await createClient()

  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    const mapped = mapAuthError(err)
    if (mapped) return mapped
    throw err
  }

  const cohort = await prisma.cohort.findUnique({
    where: { id: params.id },
    include: {
      memberships: {
        orderBy: { joinedAt: 'asc' },
        include: {
          student: { select: { id: true, email: true, role: true } },
        },
      },
    },
  })

  if (!cohort || cohort.instructorId !== educator.id) {
    return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
  }

  return NextResponse.json(cohort, { status: 200 })
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = await createClient()

  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    const mapped = mapAuthError(err)
    if (mapped) return mapped
    throw err
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = UpdateCohortSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  // Ownership check — only owner can modify
  const existing = await prisma.cohort.findUnique({
    where: { id: params.id },
  })
  if (!existing || existing.instructorId !== educator.id) {
    return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
  }

  const updated = await prisma.cohort.update({
    where: { id: params.id },
    data: parsed.data,
  })

  return NextResponse.json(updated, { status: 200 })
}
