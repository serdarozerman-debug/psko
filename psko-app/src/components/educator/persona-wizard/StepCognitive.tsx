'use client'

import { type PersonaFormData } from './types'

interface Props {
  data: Partial<PersonaFormData>
  onChange: (patch: Partial<PersonaFormData>) => void
}

const inputClass =
  'w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-600'
const labelClass = 'block text-sm text-slate-300 mb-1'

const INTENSITY_LABELS = ['', 'Minimal', 'Mild', 'Moderate', 'Marked', 'Severe']

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = (e.currentTarget.value ?? '').trim()
      if (val && !values.includes(val)) {
        onChange([...values, val])
        e.currentTarget.value = ''
      }
    }
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex flex-wrap gap-1 mb-1">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-slate-700 text-slate-200 rounded-full"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-slate-400 hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className={inputClass}
        placeholder={placeholder ?? 'Type and press Enter'}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

export function StepCognitive({ data, onChange }: Props) {
  const cm = data.cognitiveModel ?? {
    coreBeliefs: [],
    intermediateBeliefs: [],
    automaticThoughts: [],
    emotionalState: { primary: '', intensity: 3 as 1 | 2 | 3 | 4 | 5 },
    triggers: [],
    defenses: [],
    values: [],
  }

  function patchCm(patch: Partial<typeof cm>) {
    onChange({ cognitiveModel: { ...cm, ...patch } })
  }

  const intensity = (cm.emotionalState?.intensity ?? 3) as 1 | 2 | 3 | 4 | 5

  return (
    <div className="space-y-4">
      <TagInput
        label="Core beliefs"
        values={cm.coreBeliefs ?? []}
        onChange={(v) => patchCm({ coreBeliefs: v })}
        placeholder="e.g. I am unlovable"
      />

      <TagInput
        label="Intermediate beliefs"
        values={cm.intermediateBeliefs ?? []}
        onChange={(v) => patchCm({ intermediateBeliefs: v })}
        placeholder="e.g. If I fail, I am worthless"
      />

      <TagInput
        label="Automatic thoughts"
        values={cm.automaticThoughts ?? []}
        onChange={(v) => patchCm({ automaticThoughts: v })}
        placeholder="e.g. Nobody cares"
      />

      <div>
        <label className={labelClass}>Primary emotional state</label>
        <input
          type="text"
          className={inputClass}
          value={cm.emotionalState?.primary ?? ''}
          onChange={(e) =>
            patchCm({
              emotionalState: { ...(cm.emotionalState ?? { primary: '', intensity: 3 as 1 | 2 | 3 | 4 | 5 }), primary: e.target.value },
            })
          }
          placeholder="e.g. Anxiety"
        />
      </div>

      <div>
        <label className={labelClass}>
          Intensity — {intensity}/5 {INTENSITY_LABELS[intensity] ? `(${INTENSITY_LABELS[intensity]})` : ''}
        </label>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={intensity}
          onChange={(e) =>
            patchCm({
              emotionalState: {
                ...(cm.emotionalState ?? { primary: '', intensity: 3 as 1 | 2 | 3 | 4 | 5 }),
                intensity: parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 | 5,
              },
            })
          }
          className="w-full accent-slate-400"
        />
      </div>

      <TagInput
        label="Triggers"
        values={cm.triggers ?? []}
        onChange={(v) => patchCm({ triggers: v })}
        placeholder="e.g. Criticism"
      />

      <TagInput
        label="Defense mechanisms"
        values={cm.defenses ?? []}
        onChange={(v) => patchCm({ defenses: v })}
        placeholder="e.g. Rationalization"
      />

      <TagInput
        label="Core values"
        values={cm.values ?? []}
        onChange={(v) => patchCm({ values: v })}
        placeholder="e.g. Family"
      />
    </div>
  )
}
