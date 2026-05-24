'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type StudentAssignmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

interface StudentAssignmentDTO {
  id: string
  cohortId: string
  cohortName: string
  personaId: string
  approachId: string | null
  roleMode: 'THERAPIST' | 'CLIENT'
  dueAt: string | null
  status: StudentAssignmentStatus
  latestSessionId: string | null
}

interface PersonaSummary {
  id: string
  name: string
}

const STATUS_LABEL: Record<StudentAssignmentStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

const STATUS_CLASS: Record<StudentAssignmentStatus, string> = {
  NOT_STARTED: 'bg-slate-800 text-slate-300 border-slate-700',
  IN_PROGRESS: 'bg-blue-900/50 text-blue-300 border-blue-700',
  COMPLETED: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
}

function dueBadge(dueAt: string | null): { label: string; className: string } | null {
  if (!dueAt) return null
  const due = new Date(dueAt)
  const now = new Date()
  const msPerDay = 1000 * 60 * 60 * 24
  const diffDays = Math.floor((due.getTime() - now.getTime()) / msPerDay)
  const label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  if (diffDays < 0) {
    return {
      label: `Overdue · ${label}`,
      className: 'bg-red-900/50 text-red-300 border-red-700',
    }
  }
  if (diffDays < 3) {
    return {
      label: `Due ${label}`,
      className: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
    }
  }
  return {
    label: `Due ${label}`,
    className: 'bg-green-900/40 text-green-300 border-green-700',
  }
}

export function AssignedPersonas() {
  const [assignments, setAssignments] = useState<StudentAssignmentDTO[] | null>(null)
  const [personas, setPersonas] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [aRes, pRes] = await Promise.all([
          fetch('/api/student/assignments', { credentials: 'include' }),
          fetch('/api/personas', { credentials: 'include' }).catch(() => null),
        ])

        if (!aRes.ok) {
          throw new Error(`Failed to load assignments (${aRes.status})`)
        }
        const aData = (await aRes.json()) as StudentAssignmentDTO[]
        if (cancelled) return
        setAssignments(aData)

        if (pRes && pRes.ok) {
          const pData = (await pRes.json()) as PersonaSummary[] | { personas?: PersonaSummary[] }
          const list: PersonaSummary[] = Array.isArray(pData)
            ? pData
            : Array.isArray(pData?.personas)
              ? pData.personas
              : []
          if (cancelled) return
          const map: Record<string, string> = {}
          for (const p of list) {
            if (p && typeof p.id === 'string' && typeof p.name === 'string') {
              map[p.id] = p.name
            }
          }
          setPersonas(map)
        }
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load assignments')
        setAssignments([])
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section aria-labelledby="assigned-personas-heading">
      <h2 id="assigned-personas-heading" className="text-2xl font-bold mb-2">
        Assigned to you
      </h2>
      <p className="text-slate-400 mb-6">
        Required simulations from your instructors.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-800 bg-red-900/30 px-4 py-3 text-red-200 text-sm"
        >
          {error}
        </div>
      )}

      {assignments === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl bg-slate-900 border border-slate-800 p-5 h-40"
              aria-hidden="true"
            >
              <div className="h-4 w-1/2 bg-slate-800 rounded mb-3" />
              <div className="h-3 w-1/3 bg-slate-800 rounded mb-6" />
              <div className="h-8 w-24 bg-slate-800 rounded" />
            </div>
          ))}
          <span className="sr-only">Loading assignments…</span>
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-10 text-center">
          <p className="text-slate-300 font-medium">No assignments yet</p>
          <p className="text-slate-500 text-sm mt-1">
            When your instructor assigns a patient, it will show up here.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((a) => {
            const due = dueBadge(a.dueAt)
            const personaName = personas[a.personaId] ?? a.personaId
            const ctaLabel = a.status === 'IN_PROGRESS' ? 'Resume Session' : 'Start Session'
            return (
              <li
                key={a.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{personaName}</h3>
                    <p className="text-slate-400 text-sm truncate">{a.cohortName}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs border px-2 py-0.5 rounded-full ${STATUS_CLASS[a.status]}`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {due && (
                    <span
                      className={`text-xs border px-2 py-0.5 rounded-full ${due.className}`}
                    >
                      {due.label}
                    </span>
                  )}
                  <span className="text-xs border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                    {a.roleMode === 'CLIENT' ? '🎭 Client' : '🩺 Therapist'}
                  </span>
                </div>

                <div className="mt-auto pt-2">
                  <Link
                    href={`/dashboard?personaId=${encodeURIComponent(a.personaId)}&assignmentId=${encodeURIComponent(a.id)}`}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    aria-label={`${ctaLabel} for ${personaName}`}
                  >
                    {ctaLabel}
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default AssignedPersonas
