'use client'

import { useState } from 'react'
import type { CaseFormulation, TherapeuticApproach, PersonaData, ApproachConfig } from '@/types'
import { PHQ9_QUESTIONS, GAD7_QUESTIONS, OPEN_QUESTIONS } from '@/lib/clinical/intake/questions'

interface IntakeFlowProps {
  persona: PersonaData
  approaches: ApproachConfig[]
  onComplete: (approach: TherapeuticApproach, responses: Record<string, string | number>) => void
  onSkip: () => void
}

type Step = 'phq9' | 'gad7' | 'open' | 'result'

const STEP_TITLES: Record<Step, string> = {
  phq9: 'Mood Assessment',
  gad7: 'Anxiety Assessment',
  open: 'Clinical Context',
  result: 'Case Formulation',
}

const SCALE_LABELS = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']

export default function IntakeFlow({ persona, approaches, onComplete, onSkip }: IntakeFlowProps) {
  const [step, setStep] = useState<Step>('phq9')
  const [responses, setResponses] = useState<Record<string, string | number>>({})
  const [formulation, setFormulation] = useState<CaseFormulation | null>(null)
  const [recommendedApproach, setRecommendedApproach] = useState<TherapeuticApproach>('cbt')
  const [selectedApproach, setSelectedApproach] = useState<TherapeuticApproach>('cbt')
  const [loading, setLoading] = useState(false)

  const setResponse = (id: string, value: string | number) =>
    setResponses((prev) => ({ ...prev, [id]: value }))

  async function analyzeIntake() {
    setLoading(true)
    try {
      const res = await fetch('/api/intake/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId: persona.id, responses }),
      })
      if (res.ok) {
        const data = await res.json()
        setFormulation(data.formulation)
        setRecommendedApproach(data.recommendedApproach)
        setSelectedApproach(data.recommendedApproach)
      }
    } catch {/* fallback to persona defaults */
      setSelectedApproach(persona.recommendedApproaches[0] ?? 'cbt')
    } finally {
      setLoading(false)
      setStep('result')
    }
  }

  const stepQuestions =
    step === 'phq9' ? PHQ9_QUESTIONS :
    step === 'gad7' ? GAD7_QUESTIONS :
    OPEN_QUESTIONS

  const stepComplete = stepQuestions.every((q) => responses[q.id] !== undefined && responses[q.id] !== '')

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-5 my-4">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-white">{STEP_TITLES[step]}</h2>
            <button onClick={onSkip} className="text-slate-500 hover:text-slate-300 text-sm">
              Skip intake
            </button>
          </div>
          <p className="text-slate-400 text-sm">
            {step === 'result'
              ? `Preparing session with ${persona.name}`
              : `Intake for ${persona.name} · ${step === 'phq9' ? 'PHQ-9' : step === 'gad7' ? 'GAD-7' : 'Open questions'}`}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            ⚠️ Educational only — not a clinical assessment
          </p>
        </div>

        {/* Steps progress */}
        <div className="flex gap-1">
          {(['phq9', 'gad7', 'open', 'result'] as Step[]).map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${
              step === s ? 'bg-blue-500' :
              ['phq9', 'gad7', 'open', 'result'].indexOf(step) > i ? 'bg-blue-800' : 'bg-slate-700'
            }`} />
          ))}
        </div>

        {/* Questions */}
        {step !== 'result' && (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {stepQuestions.map((q) => (
              <div key={q.id}>
                <p className="text-slate-200 text-sm mb-2">{q.text}</p>
                {q.type === 'open' ? (
                  <textarea
                    value={String(responses[q.id] ?? '')}
                    onChange={(e) => setResponse(q.id, e.target.value)}
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Type your answer..."
                  />
                ) : (
                  <div className="grid grid-cols-4 gap-1">
                    {SCALE_LABELS.map((label, val) => (
                      <button
                        key={val}
                        onClick={() => setResponse(q.id, val)}
                        className={`text-xs py-2 px-1 rounded-lg border transition-colors ${
                          responses[q.id] === val
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <span className="block font-semibold">{val}</span>
                        <span className="block leading-tight mt-0.5">{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Result screen */}
        {step === 'result' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-slate-400 text-sm">Generating case formulation…</p>
              </div>
            ) : formulation ? (
              <>
                <div className="bg-slate-800 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Case Formulation</h3>
                  <p className="text-slate-200 text-sm leading-relaxed">{formulation.summary}</p>
                </div>
                {formulation.primaryConcerns.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formulation.primaryConcerns.map((c, i) => (
                      <span key={i} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded-full">{c}</span>
                    ))}
                  </div>
                )}
                <div className="bg-slate-800 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recommended Approach</h3>
                  <select
                    value={selectedApproach}
                    onChange={(e) => setSelectedApproach(e.target.value as TherapeuticApproach)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {approaches.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}{a.id === recommendedApproach ? ' ★ Recommended' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">Formulation not available — please select an approach below.</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step !== 'phq9' && step !== 'result' && (
            <button
              onClick={() => setStep(step === 'gad7' ? 'phq9' : 'gad7')}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-sm transition-colors"
            >
              Back
            </button>
          )}
          {step === 'phq9' && (
            <button
              onClick={() => setStep('gad7')}
              disabled={!stepComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Next →
            </button>
          )}
          {step === 'gad7' && (
            <button
              onClick={() => setStep('open')}
              disabled={!stepComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Next →
            </button>
          )}
          {step === 'open' && (
            <button
              onClick={analyzeIntake}
              disabled={!stepComplete || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Generate Formulation →
            </button>
          )}
          {step === 'result' && !loading && (
            <button
              onClick={() => onComplete(selectedApproach, responses)}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Start Session
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
