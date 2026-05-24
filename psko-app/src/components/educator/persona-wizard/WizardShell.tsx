'use client'

import { useReducer, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepIdentity } from './StepIdentity'
import { StepClinical } from './StepClinical'
import { StepCognitive } from './StepCognitive'
import { StepScid5 } from './StepScid5'
import { LivePreview } from './LivePreview'
import { DEFAULT_FORM_DATA, type PersonaFormData } from './types'

const STEPS = ['Identity', 'Clinical', 'Cognitive', 'SCID-5'] as const

type Action =
  | { type: 'patch'; payload: Partial<PersonaFormData> }
  | { type: 'reset' }

function reducer(state: PersonaFormData, action: Action): PersonaFormData {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.payload }
    case 'reset':
      return DEFAULT_FORM_DATA
    default:
      return state
  }
}

interface Props {
  personaId?: string
  initial?: Partial<PersonaFormData>
  visibility?: 'private' | 'institution'
}

export function WizardShell({ personaId, initial, visibility = 'private' }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [state, dispatch] = useReducer(reducer, { ...DEFAULT_FORM_DATA, ...initial })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onChange = (patch: Partial<PersonaFormData>) =>
    dispatch({ type: 'patch', payload: patch })

  const isEdit = Boolean(personaId)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const url = isEdit
        ? `/api/educator/personas/${personaId}`
        : '/api/educator/personas'
      const method = isEdit ? 'PUT' : 'POST'

      const body = {
        name: state.name,
        age: state.age,
        presentingProblem: state.presentingProblem,
        backstory: state.backstory,
        difficultyLevel: state.difficultyLevel,
        conversationalStyle: state.conversationalStyle,
        recommendedApproaches: state.recommendedApproaches,
        disorderProfile: state.disorderProfile,
        cognitiveModel: state.cognitiveModel,
        visibility,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Request failed (${res.status})`)
      }

      router.push('/educator/personas')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: wizard */}
      <div className="space-y-6">
        {/* Step tabs */}
        <nav className="flex gap-1">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                i === step
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="mr-1 opacity-50">{i + 1}.</span>
              {label}
            </button>
          ))}
        </nav>

        {/* Step content */}
        <div>
          {step === 0 && <StepIdentity data={state} onChange={onChange} />}
          {step === 1 && <StepClinical data={state} onChange={onChange} />}
          {step === 2 && <StepCognitive data={state} onChange={onChange} />}
          {step === 3 && <StepScid5 data={state} onChange={onChange} />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 text-sm rounded-md border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-4 py-2 text-sm rounded-md bg-slate-700 hover:bg-slate-600 text-white"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !state.name || !state.presentingProblem}
              className="px-4 py-2 text-sm rounded-md bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create persona'}
            </button>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
      </div>

      {/* Right: live preview */}
      <div className="hidden lg:block">
        <LivePreview data={state} />
      </div>
    </div>
  )
}
