'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  cohortId: string
  studentId: string
  studentEmail: string
}

export function RemoveMemberButton({ cohortId, studentId, studentEmail }: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  async function handleClick() {
    const confirmed = window.confirm(`Remove ${studentEmail} from this cohort?`)
    if (!confirmed) return

    setPending(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/educator/cohorts/${cohortId}/members/${studentId}`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? 'Failed to remove member')
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
    <div className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
      >
        {pending ? 'Removing…' : 'Remove'}
      </button>
      {error && (
        <span className="text-xs text-red-400" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export default RemoveMemberButton
