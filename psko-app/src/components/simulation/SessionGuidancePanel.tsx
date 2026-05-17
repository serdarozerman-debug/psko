'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PhaseGuidance, ApproachConfig } from '@/types'

interface SessionGuidancePanelProps {
  sessionId: string
  approach: ApproachConfig
  turnCount: number
}

export default function SessionGuidancePanel({ sessionId, approach, turnCount }: SessionGuidancePanelProps) {
  const [guidance, setGuidance] = useState<PhaseGuidance | null>(null)
  const [useStatic, setUseStatic] = useState(false)

  const fetchGuidance = useCallback(async () => {
    try {
      const res = await fetch(`/api/session/phase?sessionId=${sessionId}`)
      if (res.ok) {
        setGuidance(await res.json())
        setUseStatic(false)
      } else {
        setUseStatic(true)
      }
    } catch {
      setUseStatic(true)
    }
  }, [sessionId])

  // Fetch on mount and whenever turnCount changes (every new message)
  useEffect(() => { fetchGuidance() }, [fetchGuidance, turnCount])

  // ── Static fallback (no phases defined for this approach) ──────────────────
  if (useStatic || (!guidance?.phase && approach.guidanceHints)) {
    return (
      <div className="w-80 border-l border-slate-800 overflow-y-auto p-5 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {approach.name} — Technique Hints
          </h3>
          <ul className="space-y-2">
            {approach.guidanceHints.map((hint, i) => (
              <li key={i} className="text-slate-300 text-xs leading-relaxed bg-slate-900 rounded-lg p-3">
                {hint}
              </li>
            ))}
          </ul>
        </div>
        <SuggestedQuestions questions={approach.suggestedQuestions} />
      </div>
    )
  }

  if (!guidance) {
    return (
      <div className="w-80 border-l border-slate-800 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { phase, nextPhase, nextMove } = guidance
  const totalPhases = approach.phases?.length ?? 0
  const progressPct = totalPhases > 0 ? ((guidance.currentPhase + 1) / totalPhases) * 100 : 0

  return (
    <div className="w-80 border-l border-slate-800 overflow-y-auto p-5 space-y-5">
      {/* Protocol phase header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {approach.name}
          </h3>
          {totalPhases > 0 && (
            <span className="text-xs text-slate-500">
              Phase {guidance.currentPhase + 1}/{totalPhases}
            </span>
          )}
        </div>
        {totalPhases > 0 && (
          <div className="bg-slate-700 rounded-full h-1 mb-3">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Active phase */}
      {phase && (
        <div className="bg-slate-900 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-blue-400 text-xs font-bold shrink-0 mt-0.5">NOW</span>
            <div>
              <p className="text-white text-sm font-semibold">{phase.name}</p>
              <p className="text-slate-400 text-xs leading-relaxed mt-0.5">{phase.objective}</p>
            </div>
          </div>
        </div>
      )}

      {/* Next move */}
      {nextMove && (
        <div className="bg-blue-950/50 border border-blue-800 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">
            Next Move
          </h4>
          <p className="text-blue-100 text-sm leading-relaxed">{nextMove}</p>
        </div>
      )}

      {/* Techniques for active phase */}
      {phase && phase.techniques.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Techniques for this phase
          </h4>
          <ul className="space-y-2">
            {phase.techniques.map((t, i) => (
              <li key={i} className="text-slate-300 text-xs leading-relaxed bg-slate-900 rounded-lg p-3">
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Watch for */}
      {phase && phase.watchFor.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
            Watch for
          </h4>
          <ul className="space-y-1.5">
            {phase.watchFor.map((w, i) => (
              <li key={i} className="text-amber-300/80 text-xs leading-relaxed flex gap-2">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next phase preview */}
      {nextPhase && (
        <div className="border border-slate-700 rounded-xl p-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Coming up</p>
          <p className="text-slate-400 text-xs font-medium">{nextPhase.name}</p>
        </div>
      )}
    </div>
  )
}

function SuggestedQuestions({ questions }: { questions: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Suggested Questions
      </h3>
      <ul className="space-y-2">
        {questions.map((q, i) => (
          <li key={i} className="text-slate-400 text-xs italic leading-relaxed bg-slate-900 rounded-lg p-3">
            &ldquo;{q}&rdquo;
          </li>
        ))}
      </ul>
    </div>
  )
}
