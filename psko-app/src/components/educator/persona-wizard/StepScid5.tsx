'use client'

import { type PersonaFormData } from './types'

interface Props {
  data: Partial<PersonaFormData>
  onChange: (patch: Partial<PersonaFormData>) => void
}

const inputClass =
  'w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-600'
const labelClass = 'block text-sm text-slate-300 mb-1'

type Scid5 = NonNullable<NonNullable<PersonaFormData['cognitiveModel']>['scid5']>

export function StepScid5({ data, onChange }: Props) {
  const cm = data.cognitiveModel ?? {
    coreBeliefs: [],
    intermediateBeliefs: [],
    automaticThoughts: [],
    emotionalState: { primary: '', intensity: 3 as 1 | 2 | 3 | 4 | 5 },
    triggers: [],
    defenses: [],
    values: [],
  }
  const scid5: Scid5 = cm.scid5 ?? {}

  function patchScid5(patch: Partial<Scid5>) {
    onChange({
      cognitiveModel: {
        ...cm,
        scid5: { ...scid5, ...patch },
      },
    })
  }

  function handleTraumaInput(raw: string) {
    patchScid5({
      traumaFlags: raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        Optional SCID-5 structured clinical interview data. Leave blank if not applicable.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Onset age</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={scid5.onsetAge ?? ''}
            onChange={(e) =>
              patchScid5({ onsetAge: e.target.value ? parseInt(e.target.value, 10) : undefined })
            }
            placeholder="e.g. 22"
          />
        </div>

        <div>
          <label className={labelClass}>Duration (months)</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={scid5.durationMonths ?? ''}
            onChange={(e) =>
              patchScid5({
                durationMonths: e.target.value ? parseInt(e.target.value, 10) : undefined,
              })
            }
            placeholder="e.g. 18"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Functional impairment — Social (0–10)</label>
        <input
          type="number"
          min={0}
          max={10}
          className={inputClass}
          value={scid5.functionalImpairment?.social ?? ''}
          onChange={(e) =>
            patchScid5({
              functionalImpairment: {
                social: parseInt(e.target.value, 10) || 0,
                occupational: scid5.functionalImpairment?.occupational ?? 0,
                other: scid5.functionalImpairment?.other ?? 0,
              },
            })
          }
        />
      </div>

      <div>
        <label className={labelClass}>Functional impairment — Occupational (0–10)</label>
        <input
          type="number"
          min={0}
          max={10}
          className={inputClass}
          value={scid5.functionalImpairment?.occupational ?? ''}
          onChange={(e) =>
            patchScid5({
              functionalImpairment: {
                social: scid5.functionalImpairment?.social ?? 0,
                occupational: parseInt(e.target.value, 10) || 0,
                other: scid5.functionalImpairment?.other ?? 0,
              },
            })
          }
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={scid5.priorTreatment ?? false}
            onChange={(e) => patchScid5({ priorTreatment: e.target.checked })}
            className="accent-slate-400"
          />
          Prior treatment history
        </label>
      </div>

      <div>
        <label className={labelClass}>Trauma flags (comma-separated)</label>
        <input
          type="text"
          className={inputClass}
          value={(scid5.traumaFlags ?? []).join(', ')}
          onChange={(e) => handleTraumaInput(e.target.value)}
          placeholder="e.g. childhood abuse, domestic violence"
        />
      </div>
    </div>
  )
}
