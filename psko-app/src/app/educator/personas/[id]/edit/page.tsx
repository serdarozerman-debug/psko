import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator } from '@/lib/auth'
import { WizardShell } from '@/components/educator/persona-wizard/WizardShell'
import type { PersonaFormData } from '@/components/educator/persona-wizard/types'

export const dynamic = 'force-dynamic'

export default async function EditPersonaPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch {
    notFound()
  }

  const persona = await prisma.persona.findUnique({ where: { id: params.id } })

  if (!persona || persona.createdBy !== educator.id) {
    notFound()
  }

  const initial: Partial<PersonaFormData> = {
    name: persona.name,
    age: persona.age ?? undefined,
    presentingProblem: persona.presentingProblem ?? '',
    backstory: persona.backstory ?? '',
    difficultyLevel: (persona.difficultyLevel as PersonaFormData['difficultyLevel']) ?? 'beginner',
    conversationalStyle:
      (persona.conversationalStyle as PersonaFormData['conversationalStyle']) ?? 'plain',
    recommendedApproaches: Array.isArray(persona.recommendedApproaches)
      ? (persona.recommendedApproaches as string[])
      : [],
    disorderProfile: Array.isArray(persona.disorderProfile)
      ? (persona.disorderProfile as string[])
      : [],
    cognitiveModel:
      persona.cognitiveModel != null
        ? (persona.cognitiveModel as PersonaFormData['cognitiveModel'])
        : undefined,
  }

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link
          href="/educator/personas"
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Personas
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-bold">Edit Persona</h1>
        <p className="text-slate-400 text-sm mt-1">{persona.name}</p>
      </header>

      <WizardShell
        personaId={persona.id}
        initial={initial}
        visibility={(persona.visibility as 'private' | 'institution') ?? 'private'}
      />
    </div>
  )
}
