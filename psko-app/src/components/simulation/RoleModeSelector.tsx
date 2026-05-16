'use client'

import type { RoleMode } from '@/types'

interface RoleModeSelectorProps {
  personaName: string
  onSelect: (mode: RoleMode) => void
  onClose: () => void
  loading?: boolean
}

const MODES: Array<{
  value: RoleMode
  icon: string
  label: string
  description: string
  hint: string
}> = [
  {
    value: 'THERAPIST',
    icon: '🩺',
    label: 'Therapist Mode',
    description: 'You play the psychologist. PSKO plays the patient.',
    hint: 'Practice clinical techniques and receive competency feedback.',
  },
  {
    value: 'CLIENT',
    icon: '🎭',
    label: 'Client Mode',
    description: 'You play the patient. PSKO plays the psychologist.',
    hint: 'Experience therapy from the inside and reflect on your emotional response.',
  },
]

export default function RoleModeSelector({
  personaName,
  onSelect,
  onClose,
  loading = false,
}: RoleModeSelectorProps) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Choose your role"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white">Choose Your Role</h2>
          <p className="text-slate-400 text-sm mt-1">
            Session with <span className="text-white font-medium">{personaName}</span>
          </p>
        </div>

        {/* Mode cards */}
        <div className="space-y-3">
          {MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => !loading && onSelect(mode.value)}
              disabled={loading}
              className="w-full text-left bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 hover:border-slate-500 rounded-xl p-4 transition-all group"
              aria-label={`Start as ${mode.label}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5" aria-hidden="true">{mode.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {mode.label}
                  </div>
                  <div className="text-slate-300 text-sm mt-0.5">{mode.description}</div>
                  <div className="text-slate-500 text-xs mt-1.5 italic">{mode.hint}</div>
                </div>
                <span className="text-slate-500 group-hover:text-slate-300 transition-colors mt-1" aria-hidden="true">→</span>
              </div>
            </button>
          ))}
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          disabled={loading}
          className="w-full text-slate-500 hover:text-slate-300 text-sm transition-colors py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
