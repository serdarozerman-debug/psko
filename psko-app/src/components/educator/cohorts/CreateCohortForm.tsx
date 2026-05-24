'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function CreateCohortForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name is required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/educator/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? 'Failed to create cohort')
        return
      }
      setName('')
      setOpen(false)
      startTransition(() => router.refresh())
    } catch {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
      >
        + New Cohort
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3"
    >
      <div>
        <label
          htmlFor="cohort-name"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Cohort name
        </label>
        <input
          id="cohort-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={255}
          autoFocus
          disabled={submitting}
          className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g. Clinical Psych 401 - Spring"
        />
      </div>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          {submitting ? 'Creating…' : 'Create'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setName('')
            setError(null)
          }}
          disabled={submitting}
          className="text-slate-400 hover:text-white text-sm px-3 py-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default CreateCohortForm
