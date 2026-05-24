'use client'

import type { PersonaFormData } from './types'
import { CONVERSATIONAL_STYLES, DIFFICULTY_LEVELS } from './types'

interface Props {
  data: Partial<PersonaFormData>
  onChange: (patch: Partial<PersonaFormData>) => void
}

const inputClass =
  'w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-600'
const labelClass = 'block text-sm text-slate-300 mb-1'

export function StepIdentity({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Name</label>
        <input
          type="text"
          className={inputClass}
          value={data.name ?? ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Maria Lopez"
        />
      </div>

      <div>
        <label className={labelClass}>Age</label>
        <input
          type="number"
          min={0}
          className={inputClass}
          value={data.age ?? ''}
          onChange={(e) => onChange({ age: parseInt(e.target.value, 10) || 0 })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Difficulty</label>
          <select
            className={inputClass}
            value={data.difficultyLevel ?? 'beginner'}
            onChange={(e) =>
              onChange({ difficultyLevel: e.target.value as PersonaFormData['difficultyLevel'] })
            }
          >
            {DIFFICULTY_LEVELS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Conversational Style</label>
          <select
            className={inputClass}
            value={data.conversationalStyle ?? 'plain'}
            onChange={(e) =>
              onChange({
                conversationalStyle: e.target.value as PersonaFormData['conversationalStyle'],
              })
            }
          >
            {CONVERSATIONAL_STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Presenting Problem</label>
        <textarea
          rows={3}
          className={inputClass}
          value={data.presentingProblem ?? ''}
          onChange={(e) => onChange({ presentingProblem: e.target.value })}
          placeholder="What brings the client in?"
        />
      </div>

      <div>
        <label className={labelClass}>Backstory</label>
        <textarea
          rows={4}
          className={inputClass}
          value={data.backstory ?? ''}
          onChange={(e) => onChange({ backstory: e.target.value })}
          placeholder="Relevant history, context, family, work…"
        />
      </div>
    </div>
  )
}
