'use client'

import type { PersonaFormData } from './types'
import { APPROACH_OPTIONS } from './types'

interface Props {
  data: Partial<PersonaFormData>
  onChange: (patch: Partial<PersonaFormData>) => void
}

const inputClass =
  'w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-600'
const labelClass = 'block text-sm text-slate-300 mb-1'

export function StepClinical({ data, onChange }: Props) {
  const approaches = data.recommendedApproaches ?? []

  const toggleApproach = (value: string) => {
    const next = approaches.includes(value)
      ? approaches.filter((a) => a !== value)
      : [...approaches, value]
    onChange({ recommendedApproaches: next })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Disorder Profile (comma-separated)</label>
        <input
          type="text"
          className={inputClass}
          value={(data.disorderProfile ?? []).join(', ')}
          onChange={(e) =>
            onChange({
              disorderProfile: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="e.g. MDD, GAD"
        />
      </div>

      <div>
        <label className={labelClass}>Recommended Approaches</label>
        <div className="grid grid-cols-2 gap-2">
          {APPROACH_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900 border border-slate-800 rounded-md px-3 py-2 cursor-pointer hover:border-slate-700"
            >
              <input
                type="checkbox"
                checked={approaches.includes(opt)}
                onChange={() => toggleApproach(opt)}
                className="accent-slate-400"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={data.requiresTriggerWarning ?? false}
            onChange={(e) => onChange({ requiresTriggerWarning: e.target.checked })}
            className="accent-slate-400"
          />
          Requires trigger warning
        </label>
      </div>
    </div>
  )
}
