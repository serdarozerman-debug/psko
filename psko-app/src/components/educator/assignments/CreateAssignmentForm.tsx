'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  cohorts: { id: string; name: string }[]
  personas: { id: string; name: string }[]
}

export function CreateAssignmentForm({ cohorts, personas }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [cohortId, setCohortId] = useState('')
  const [personaId, setPersonaId] = useState('')
  const [roleMode, setRoleMode] = useState<'THERAPIST' | 'CLIENT'>('THERAPIST')
  const [dueAt, setDueAt] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium bg-white text-slate-950 rounded-md hover:bg-slate-200 transition-colors"
      >
        + New Assignment
      </button>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const res = await fetch('/api/educator/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cohortId,
        personaId,
        roleMode,
        ...(dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}),
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to create assignment')
      setSaving(false)
      return
    }

    setOpen(false)
    setCohortId('')
    setPersonaId('')
    setDueAt('')
    setSaving(false)
    router.refresh()
  }

  const inputClass =
    'w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-600'

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-slate-800 rounded-lg p-4 space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Cohort</label>
          <select
            className={inputClass}
            value={cohortId}
            onChange={(e) => setCohortId(e.target.value)}
            required
          >
            <option value="">Select cohort…</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Persona</label>
          <select
            className={inputClass}
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value)}
            required
          >
            <option value="">Select persona…</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Role Mode</label>
          <select
            className={inputClass}
            value={roleMode}
            onChange={(e) => setRoleMode(e.target.value as 'THERAPIST' | 'CLIENT')}
          >
            <option value="THERAPIST">Therapist</option>
            <option value="CLIENT">Client</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Due Date (optional)</label>
          <input
            type="date"
            className={inputClass}
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-white text-slate-950 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create Assignment'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
