import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator, mapAuthError } from '@/lib/auth'
import { generateJoinCode } from '@/lib/cohorts/joinCode'

type RouteContext = { params: { id: string } }

export async function POST(_request: Request, { params }: RouteContext) {
  const supabase = await createClient()

  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    const mapped = mapAuthError(err)
    if (mapped) return mapped
    throw err
  }

  // Ownership check — refuse to regenerate someone else's cohort code
  const existing = await prisma.cohort.findUnique({
    where: { id: params.id },
  })
  if (!existing || existing.instructorId !== educator.id) {
    return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
  }

  const newCode = generateJoinCode()

  const updated = await prisma.cohort.update({
    where: { id: params.id },
    data: { joinCode: newCode },
  })

  return NextResponse.json(updated, { status: 200 })
}
