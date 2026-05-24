import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator, mapAuthError } from '@/lib/auth'
import { PersonaDataSchema } from '@/lib/personas/schema'

export async function GET(_request: Request) {
  const supabase = await createClient()

  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    const mapped = mapAuthError(err)
    if (mapped) return mapped
    throw err
  }

  const personas = await prisma.persona.findMany({
    where: { createdBy: educator.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(personas, { status: 200 })
}

export async function POST(request: Request) {
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

  const parsed = PersonaDataSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid persona data', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const data = parsed.data

  const persona = await prisma.persona.create({
    data: {
      name: data.name,
      age: data.age,
      presentingProblem: data.presentingProblem,
      backstory: data.backstory,
      difficultyLevel: data.difficultyLevel,
      conversationalStyle: data.conversationalStyle,
      recommendedApproaches: data.recommendedApproaches,
      cognitiveModel: data.cognitiveModel,
      disorderProfile: data.disorderProfile,
      createdBy: educator.id,
      isCustom: true,
      visibility: 'private',
    },
  })

  return NextResponse.json(persona, { status: 201 })
}
