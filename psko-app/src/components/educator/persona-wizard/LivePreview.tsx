'use client'

import { type PersonaFormData } from './types'

interface Props {
  data: Partial<PersonaFormData>
}

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: 'text-emerald-400',
  intermediate: 'text-amber-400',
  advanced: 'text-red-400',
}

export function LivePreview({ data }: Props) {
  const name = data.name || 'Unnamed Persona'
  const age = data.age != null ? `${data.age} y/o` : ''
  const difficulty = data.difficultyLevel ?? 'beginner'
  const style = data.conversationalStyle ?? 'plain'
  const approaches = data.recommendedApproaches ?? []
  const disorders = data.disorderProfile ?? []
  const cm = data.cognitiveModel
  const coreBeliefs = cm?.coreBeliefs ?? []
  const triggers = cm?.triggers ?? []
  const primaryEmotion = cm?.emotionalState?.primary ?? ''
  const intensity = cm?.emotionalState?.intensity ?? 3

  return (
    <div className="sticky top-4 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4 text-sm">
      <h3 className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Live Preview</h3>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-white">{name}</span>
          {age && <span className="text-slate-400 text-xs">{age}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-medium ${DIFFICULTY_COLOR[difficulty] ?? ''}`}>
            {difficulty}
          </span>
          <span className="text-xs text-slate-400">· {style}</span>
        </div>
      </div>

      {data.presentingProblem && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Presenting problem</p>
          <p className="text-slate-300 text-xs leading-relaxed">{data.presentingProblem}</p>
        </div>
      )}

      {disorders.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Disorders</p>
          <div className="flex flex-wrap gap-1">
            {disorders.map((d) => (
              <span
                key={d}
                className="px-1.5 py-0.5 text-xs bg-slate-800 text-slate-300 rounded"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {primaryEmotion && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Emotional state</p>
          <p className="text-slate-300 text-xs">
            {primaryEmotion} — intensity {intensity}/5
          </p>
        </div>
      )}

      {coreBeliefs.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Core beliefs</p>
          <ul className="space-y-0.5">
            {coreBeliefs.slice(0, 3).map((b) => (
              <li key={b} className="text-xs text-slate-400 before:content-['·'] before:mr-1">
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {triggers.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Triggers</p>
          <div className="flex flex-wrap gap-1">
            {triggers.map((t) => (
              <span
                key={t}
                className="px-1.5 py-0.5 text-xs bg-slate-800 text-amber-400 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {approaches.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Approaches</p>
          <div className="flex flex-wrap gap-1">
            {approaches.map((a) => (
              <span
                key={a}
                className="px-1.5 py-0.5 text-xs bg-slate-800 text-emerald-400 rounded"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.backstory && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Backstory</p>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-4">{data.backstory}</p>
        </div>
      )}
    </div>
  )
}
