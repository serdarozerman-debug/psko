import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: 'text-emerald-400',
  intermediate: 'text-amber-400',
  advanced: 'text-red-400',
}

export default async function PersonasPage() {
  const supabase = await createClient()
  let educator
  try {
    educator = await requireEducator(supabase, prisma)
  } catch {
    notFound()
  }

  const personas = await prisma.persona.findMany({
    where: { isCustom: true, createdBy: educator.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Custom Personas</h1>
        <Link
          href="/educator/personas/new"
          className="px-4 py-2 text-sm rounded-md bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          + New persona
        </Link>
      </div>

      {personas.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-lg p-10 text-center">
          <p className="text-slate-400">No custom personas yet.</p>
          <p className="text-slate-500 text-sm mt-1">
            Create a persona to use in assignments.
          </p>
          <Link
            href="/educator/personas/new"
            className="mt-4 inline-block px-4 py-2 text-sm rounded-md bg-slate-700 hover:bg-slate-600 text-white"
          >
            Create first persona
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <p className="text-xs text-slate-400">Age {p.age ?? '?'}</p>
                </div>
                <span
                  className={`text-xs font-medium shrink-0 ${
                    DIFFICULTY_COLOR[p.difficultyLevel ?? 'beginner'] ?? ''
                  }`}
                >
                  {p.difficultyLevel}
                </span>
              </div>

              {p.presentingProblem && (
                <p className="text-sm text-slate-400 line-clamp-2">{p.presentingProblem}</p>
              )}

              {Array.isArray(p.disorderProfile) && p.disorderProfile.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(p.disorderProfile as string[]).slice(0, 3).map((d) => (
                    <span
                      key={d}
                      className="px-1.5 py-0.5 text-xs bg-slate-800 text-slate-300 rounded"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/educator/personas/${p.id}/edit`}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Edit
                </Link>
                <span className="text-slate-700">·</span>
                <span className="text-xs text-slate-600">
                  {p.visibility === 'institution' ? 'Shared' : 'Private'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
