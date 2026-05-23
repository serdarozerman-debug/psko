'use client'

import { useEffect, useRef, useState } from 'react'
import type { PersonaData, ApproachConfig } from '@/types'
import PersonaCard from '@/components/simulation/PersonaCard'

interface TriggerWarningModalProps {
  personaName: string
  onConfirm: () => void
  onCancel: () => void
}

export default function TriggerWarningModal({
  personaName,
  onConfirm,
  onCancel,
}: TriggerWarningModalProps) {
  const confirmRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trigger-warning-title"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6">
        <h2
          id="trigger-warning-title"
          className="text-xl font-semibold text-white mb-3"
        >
          Sensitive Content Notice
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed mb-2">
          The persona <span className="font-medium text-white">{personaName}</span>{' '}
          contains trauma-related clinical content that some learners may find
          distressing, including depictions of psychological trauma, dissociation,
          or severe psychiatric symptoms.
        </p>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          You may step away at any time during the session. If this content is
          difficult for you personally, please choose another persona or speak
          with your supervisor before proceeding.
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            Return to Selection
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            I&rsquo;m ready to proceed
          </button>
        </div>
      </div>
    </div>
  )
}

interface PersonaSelectClientProps {
  persona: PersonaData
  approaches: ApproachConfig[]
  difficultyColors: Record<string, string>
}

export function PersonaSelectClient({
  persona,
  approaches,
  difficultyColors,
}: PersonaSelectClientProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const needsWarning = persona.requiresTriggerWarning === true
  const showAdvancedDebriefReminder = persona.difficultyLevel === 'advanced'

  if (!needsWarning || confirmed) {
    return (
      <div className="flex flex-col gap-2">
        <PersonaCard
          persona={persona}
          approaches={approaches}
          difficultyColors={difficultyColors}
        />
        {showAdvancedDebriefReminder && (
          <p className="text-xs text-amber-300/80 px-1">
            After your session with this persona, please reflect with your
            supervisor.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-white">{persona.name}</h3>
            <p className="text-slate-400 text-sm">{persona.age} years old</p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full border ${difficultyColors[persona.difficultyLevel]}`}
          >
            {persona.difficultyLevel}
          </span>
        </div>

        <div className="rounded-lg border border-amber-700/60 bg-amber-950/30 px-3 py-2">
          <p className="text-amber-200 text-xs font-medium mb-1">
            Sensitive content
          </p>
          <p className="text-amber-100/80 text-xs leading-relaxed">
            This persona contains trauma-related clinical material. Review the
            content notice before starting a session.
          </p>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed italic">
          &ldquo;{persona.presentingProblem}&rdquo;
        </p>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="mt-auto w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          Review &amp; Start Session
        </button>
      </div>

      {showAdvancedDebriefReminder && (
        <p className="text-xs text-amber-300/80 px-1">
          After your session with this persona, please reflect with your
          supervisor.
        </p>
      )}

      {showModal && (
        <TriggerWarningModal
          personaName={persona.name}
          onConfirm={() => {
            setShowModal(false)
            setConfirmed(true)
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
