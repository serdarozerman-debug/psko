import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { personaLibrary } from '@/lib/personas'
import { approaches } from '@/lib/approaches'
import PersonaCard from '@/components/simulation/PersonaCard'

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-900/50 text-green-300 border-green-700',
  intermediate: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  advanced: 'bg-red-900/50 text-red-300 border-red-700',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const recentSessions = await prisma.session.findMany({
    where: { userId: user.id, endedAt: { not: null } },
    orderBy: { startedAt: 'desc' },
    take: 5,
  }).catch(() => [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold">PSKO</span>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{user.email}</span>
          <form action="/api/auth/signout" method="post">
            <button className="text-slate-400 hover:text-white text-sm transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* Persona Library */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Choose a Patient</h2>
          <p className="text-slate-400 mb-6">
            Select a persona to begin a simulation session. Each patient has a unique psychological profile.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personaLibrary.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                approaches={Object.values(approaches)}
                difficultyColors={DIFFICULTY_COLORS}
              />
            ))}
          </div>
        </section>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Recent Sessions</h2>
            <div className="space-y-3">
              {recentSessions.map((session) => {
                const persona = personaLibrary.find((p) => p.id === session.personaId)
                const approach = approaches[session.therapeuticApproach as keyof typeof approaches]
                const feedback = session.feedback as { overallScore?: number } | null
                return (
                  <Link
                    key={session.id}
                    href={`/session/${session.id}`}
                    className="flex items-center justify-between bg-slate-900 rounded-xl px-6 py-4 hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <span className="font-medium">{persona?.name ?? 'Unknown'}</span>
                      <span className="text-slate-400 mx-2">·</span>
                      <span className="text-slate-400 text-sm">{approach?.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {feedback?.overallScore !== undefined && (
                        <span className="text-blue-400 font-semibold">{feedback.overallScore}/100</span>
                      )}
                      <span className="text-slate-500 text-sm">
                        {new Date(session.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
