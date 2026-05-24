'use client'

import { useState } from 'react'

interface Props {
  sessionId: string
  domain: string
  currentScore?: number
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6] as const

export function AnnotationEditor({ sessionId, domain, currentScore }: Props) {
  const [score, setScore] = useState<number | null>(currentScore ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(value: number) {
    setScore(value)
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/educator/sessions/${sessionId}/annotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, score: value }),
      })
      if (!res.ok) throw new Error('Failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setScore(currentScore ?? null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {SCORE_OPTIONS.map((v) => (
        <button
          key={v}
          type="button"
          disabled={saving}
          onClick={() => handleSave(v)}
          className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
            score === v
              ? 'bg-emerald-700 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
          } disabled:opacity-40`}
        >
          {v}
        </button>
      ))}
      {saved && <span className="text-xs text-emerald-400 ml-1">Saved</span>}
    </div>
  )
}
