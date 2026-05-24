import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator, mapAuthError } from '@/lib/auth'

// Partial-update schema — allow any subset of mutable persona fields.
const UpdatePersonaSchema = z
  .object({
    name: z.string().min(1).optional(),
    age: z.number().int().min(0).optional(),
    presentingProblem: z.string().min(1).max(2000).optional(),
    backstory: z.string().min(1).max(2000).optional(),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    conversationalStyle: z
      .enum(['plain', 'upset', 'reserved', 'verbose', 'pleasing', 'tangent'])
      .optional(),
    recommendedApproaches: z.array(z.string()).optional(),
    cognitiveModel: z.unknown().optional(),
    disorderProfile: z.array(z.string()).optional(),
    visibility: z.enum(['private', 'institution']).optional(),
  })
  .strict()

// Use Promise<> params so tests can pass Promise.resolve({id}); at runtime
// in Next.js 14, params is a plain object and await on it is a no-op.
type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, ctx: RouteContext) {
  const supabase = await createClient()

  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    const mapped = mapAuthError(err)
    if (mapped) return mapped
    throw err
  }

  const { id } = await ctx.params
  const persona = await prisma.persona.findUnique({ where: { id } })

  if (!persona) {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
  }

  // Educator can view their own custom persona, or any non-custom (library) persona.
  if (persona.isCustom && persona.createdBy !== educator.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(persona, { status: 200 })
}

export async function PUT(request: Request, ctx: RouteContext) {
  const supabase = await createClient()

  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    const mapped = mapAuthError(err)
    if (mapped) return mapped
    throw err
  }

  const { id } = await ctx.params

  const persona = await prisma.persona.findUnique({ where: { id } })
  if (!persona) {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
  }

  if (persona.createdBy !== educator.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = UpdatePersonaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid update body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  // Filter undefined keys so Prisma only updates provided fields.
  const data: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) data[k] = v
  }

  const updated = await prisma.persona.update({
    where: { id },
    data,
  })

  return NextResponse.json(updated, { status: 200 })
}

// Alias PATCH to PUT for callers expecting REST PATCH semantics.
export const PATCH = PUT

export async function DELETE(_request: Request, ctx: RouteContext) {
  const supabase = await createClient()

  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch (err) {
    const mapped = mapAuthError(err)
    if (mapped) return mapped
    throw err
  }

  const { id } = await ctx.params

  const persona = await prisma.persona.findUnique({ where: { id } })
  if (!persona) {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
  }

  if (persona.createdBy !== educator.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // If any sessions reference this persona, refuse hard delete (409 Conflict).
  const sessionCount = await prisma.session.count({ where: { personaId: id } })
  if (sessionCount > 0) {
    return NextResponse.json(
      { error: 'Persona has active sessions and cannot be deleted' },
      { status: 409 },
    )
  }

  await prisma.persona.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
