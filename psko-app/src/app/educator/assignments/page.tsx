import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { requireEducator } from '@/lib/auth'
import { CreateAssignmentForm } from '@/components/educator/assignments/CreateAssignmentForm'

export const dynamic = 'force-dynamic'

export default async function AssignmentsPage() {
  const supabase = await createClient()
  const educator = await requireEducator(supabase, prisma)

  const assignments = await prisma.assignment.findMany({
    where: { cohort: { instructorId: educator.id } },
    include: {
      cohort: { select: { id: true, name: true } },
      persona: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const cohorts = await prisma.cohort.findMany({
    where: { instructorId: educator.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const personas = await prisma.persona.findMany({
    where: {
      OR: [
        { isCustom: false },
        { createdBy: educator.id },
      ],
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assignments</h1>
      </header>

      <CreateAssignmentForm cohorts={cohorts} personas={personas} />

      {assignments.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-400">No assignments yet.</p>
          <p className="text-slate-500 text-sm mt-1">
            Use the form above to create one.
          </p>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Persona</th>
                <th className="text-left px-4 py-2 font-medium">Cohort</th>
                <th className="text-left px-4 py-2 font-medium">Role</th>
                <th className="text-left px-4 py-2 font-medium">Due</th>
                <th className="text-left px-4 py-2 font-medium">Created</th>
                <th className="text-right px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-900/40">
                  <td className="px-4 py-3">{a.persona?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/educator/cohorts/${a.cohort?.id}`}
                      className="text-slate-300 hover:text-white"
                    >
                      {a.cohort?.name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-full bg-slate-800 text-slate-300 border-slate-700">
                      {a.roleMode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/educator/assignments/${a.id}`}
                      className="text-sm text-slate-400 hover:text-white"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
