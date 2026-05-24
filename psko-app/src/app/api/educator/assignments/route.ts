import { NextResponse } from 'next/server'
import { z } from 'zod'
import { RoleMode } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'
import { requireEducator, mapAuthError } from '@/lib/auth'

const CreateAssignmentSchema = z.object({
  cohortId: z.string().min(1),
  personaId: z.string().min(1),
  roleMode: z.enum(['THERAPIST', 'CLIENT']).default('THERAPIST'),
  approachId: z.string().optional(),
  dueAt: z.string().datetime().optional(),
})

export async function GET(_req: Request) {
  const supabase = await createClient()
  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    return mapAuthError(err) ?? NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }

  const assignments = await prisma.assignment.findMany({
    where: { cohort: { instructorId: educator.id } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(assignments, { status: 200 })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    return mapAuthError(err) ?? NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateAssignmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { cohortId, personaId, roleMode, approachId, dueAt } = parsed.data
  const created = await prisma.assignment.create({
    data: {
      cohortId,
      personaId,
      roleMode: roleMode === 'CLIENT' ? RoleMode.CLIENT : RoleMode.THERAPIST,
      ...(approachId ? { approachId } : {}),
      ...(dueAt ? { dueAt: new Date(dueAt) } : {}),
      createdBy: educator.id,
    },
  })

  return NextResponse.json(created, { status: 201 })
}
