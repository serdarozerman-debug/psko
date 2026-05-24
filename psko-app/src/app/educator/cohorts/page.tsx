import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator } from '@/lib/auth'
import { getCohortsForEducator } from '@/lib/cohorts/queries'
import { JoinCodeChip } from '@/components/educator/cohorts/JoinCodeChip'
import { CreateCohortForm } from '@/components/educator/cohorts/CreateCohortForm'

export const dynamic = 'force-dynamic'

export default async function CohortsListPage() {
  const supabase = await createClient()
  const educator = await requireEducator(supabase, prisma)
  const cohorts = await getCohortsForEducator(educator.id)

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cohorts</h1>
          <p className="text-sm text-slate-400 mt-1">
            Groups of students you supervise. Share the join code so students can enroll.
          </p>
        </div>
        <CreateCohortForm />
      </header>

      {cohorts.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-lg p-10 text-center">
          <p className="text-slate-400">No cohorts yet.</p>
          <p className="text-slate-500 text-sm mt-1">
            Create your first cohort to start inviting students.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {cohorts.map((cohort) => (
            <li key={cohort.id}>
              <Link
                href={`/educator/cohorts/${cohort.id}`}
                className="block bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 rounded-lg px-5 py-4 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-semibold truncate">{cohort.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cohort._count.memberships}{' '}
                      {cohort._count.memberships === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <JoinCodeChip
                      code={cohort.joinCode}
                      enabled={cohort.joinCodeEnabled}
                      showCopy={false}
                      size="sm"
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
