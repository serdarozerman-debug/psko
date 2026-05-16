'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PersonaData, ApproachConfig } from '@/types'

interface PersonaCardProps {
  persona: PersonaData
  approaches: ApproachConfig[]
  difficultyColors: Record<string, string>
}

export default function PersonaCard({ persona, approaches, difficultyColors }: PersonaCardProps) {
  const router = useRouter()
  const [selectedApproach, setSelectedApproach] = useState(persona.recommendedApproaches[0])
  const [loading, setLoading] = useState(false)

  async function startSession() {
    setLoading(true)
    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId: persona.id, therapeuticApproach: selectedApproach }),
      })
      const data = await res.json()
      if (data.sessionId) {
        router.push(`/session/${data.sessionId}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{persona.name}</h3>
          <p className="text-slate-400 text-sm">{persona.age} years old</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${difficultyColors[persona.difficultyLevel]}`}>
          {persona.difficultyLevel}
        </span>
      </div>

      {/* Presenting problem */}
      <p className="text-slate-300 text-sm leading-relaxed italic">
        &ldquo;{persona.presentingProblem}&rdquo;
      </p>

      {/* Approach selector */}
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Therapeutic Approach</label>
        <select
          value={selectedApproach}
          onChange={(e) => setSelectedApproach(e.target.value as typeof selectedApproach)}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {approaches.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}{persona.recommendedApproaches.includes(a.id) ? ' ★' : ''}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-600 mt-1">★ Recommended for this persona</p>
      </div>

      <button
        onClick={startSession}
        disabled={loading}
        className="mt-auto w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
      >
        {loading ? 'Starting...' : 'Start Session'}
      </button>
    </div>
  )
}
