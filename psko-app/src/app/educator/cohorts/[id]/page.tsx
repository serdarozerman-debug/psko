import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator } from '@/lib/auth'
import { getCohortById } from '@/lib/cohorts/queries'
import { JoinCodeChip } from '@/components/educator/cohorts/JoinCodeChip'
import { RegenerateCodeButton } from '@/components/educator/cohorts/RegenerateCodeButton'
import { RemoveMemberButton } from '@/components/educator/cohorts/RemoveMemberButton'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  INACTIVE: 'bg-slate-800 text-slate-400 border-slate-700',
  REMOVED: 'bg-red-900/40 text-red-300 border-red-800',
  PENDING: 'bg-amber-900/40 text-amber-300 border-amber-700',
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.INACTIVE
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-full ${style}`}
    >
      {status}
    </span>
  )
}

export default async function CohortDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const educator = await requireEducator(supabase, prisma)
  const cohort = await getCohortById(params.id, educator.id)

  if (!cohort) {
    notFound()
  }

  const activeCount = cohort.memberships.filter(
    (m) => m.status === 'ACTIVE',
  ).length

  return (
    <div className="space-y-8">
      <div className="text-sm">
        <Link
          href="/educator/cohorts"
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← All cohorts
        </Link>
      </div>

      <header className="space-y-3">
        <h1 className="text-2xl font-bold">{cohort.name}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <JoinCodeChip
            code={cohort.joinCode}
            enabled={cohort.joinCodeEnabled}
            showCopy
          />
          <RegenerateCodeButton cohortId={cohort.id} />
        </div>
        <p className="text-sm text-slate-400">
          {activeCount} active{' '}
          {activeCount === 1 ? 'member' : 'members'} · {cohort.memberships.length} total
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Roster</h2>
        {cohort.memberships.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400">No students enrolled yet.</p>
            <p className="text-slate-500 text-sm mt-1">
              Share the join code above to invite students.
            </p>
          </div>
        ) : (
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Email</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Joined</th>
                  <th className="text-right px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {cohort.memberships.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-3">{m.student.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.status !== 'REMOVED' && (
                        <RemoveMemberButton
                          cohortId={cohort.id}
                          studentId={m.student.id}
                          studentEmail={m.student.email}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
