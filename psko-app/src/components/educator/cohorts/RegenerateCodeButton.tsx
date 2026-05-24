'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function RegenerateCodeButton({ cohortId }: { cohortId: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  async function handleClick() {
    const confirmed = window.confirm(
      'Generate a new join code? The previous code will stop working immediately.',
    )
    if (!confirmed) return

    setPending(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/educator/cohorts/${cohortId}/regenerate-code`,
        { method: 'POST' },
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? 'Failed to regenerate code')
        return
      }
      startTransition(() => router.refresh())
    } catch {
      setError('Network error')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 disabled:opacity-50 px-3 py-1.5 rounded-md transition-colors"
      >
        {pending ? 'Regenerating…' : 'Regenerate code'}
      </button>
      {error && (
        <span className="text-xs text-red-400" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export default RegenerateCodeButton
