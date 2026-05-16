'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { PersonaData, ApproachConfig, MessageData, RoleMode } from '@/types'

interface SimulationChatProps {
  sessionId: string
  persona: PersonaData
  approach: ApproachConfig
  initialMessages: MessageData[]
  turnCount: number
  roleMode?: RoleMode
}

const MAX_TURNS = 60

export default function SimulationChat({
  sessionId, persona, approach, initialMessages, turnCount: initialTurnCount, roleMode = 'THERAPIST',
}: SimulationChatProps) {
  const isClientMode = roleMode === 'CLIENT'
  // In CLIENT mode the AI is the therapist, in THERAPIST mode the AI is the patient
  const aiLabel = isClientMode ? 'Psychologist' : persona.name
  const inputPlaceholder = isClientMode
    ? 'Share what\'s on your mind as the client...'
    : 'Type your response as the therapist...'
  const router = useRouter()
  const [messages, setMessages] = useState<MessageData[]>(initialMessages)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [turnCount, setTurnCount] = useState(initialTurnCount)
  const [ending, setEnding] = useState(false)
  const [showHints, setShowHints] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || streaming || turnCount >= MAX_TURNS) return

    const userMsg: MessageData = {
      id: crypto.randomUUID(),
      sessionId,
      role: 'student',
      content: input.trim(),
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setStreaming(true)
    setStreamingText('')

    const res = await fetch('/api/session/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, content: userMsg.content }),
    })

    if (!res.body) { setStreaming(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      full += chunk
      setStreamingText(full)
    }

    const patientMsg: MessageData = {
      id: crypto.randomUUID(),
      sessionId,
      role: 'patient',
      content: full,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, patientMsg])
    setStreamingText('')
    setStreaming(false)
    setTurnCount((t) => t + 1)
  }

  async function endSession() {
    setEnding(true)
    const res = await fetch('/api/session/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      setEnding(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div>
          <span className="font-semibold">{persona.name}</span>
          <span className="text-slate-400 text-sm ml-3">{approach.name}</span>
          <span className={`text-xs ml-3 px-2 py-0.5 rounded-full border ${
            isClientMode
              ? 'text-purple-300 border-purple-700 bg-purple-900/30'
              : 'text-blue-300 border-blue-700 bg-blue-900/30'
          }`}>
            {isClientMode ? '🎭 Client Mode' : '🩺 Therapist Mode'}
          </span>
          <span className="text-slate-600 text-xs ml-3">{turnCount}/{MAX_TURNS} turns</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowHints((h) => !h)}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </button>
          <button
            onClick={endSession}
            disabled={ending}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
          >
            {ending ? 'Generating feedback...' : 'End Session'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[70%]">
                  {msg.role !== 'student' && (
                    <p className="text-xs text-slate-500 mb-1 ml-1">{aiLabel}</p>
                  )}
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'student'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[70%] bg-slate-800 text-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed">
                  {streamingText}
                  <span className="inline-block w-1 h-4 bg-slate-400 ml-1 animate-pulse" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="border-t border-slate-800 px-6 py-4 flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={turnCount >= MAX_TURNS ? 'Session limit reached' : inputPlaceholder}
              disabled={streaming || ending || turnCount >= MAX_TURNS}
              className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={streaming || ending || !input.trim() || turnCount >= MAX_TURNS}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Send
            </button>
          </form>
        </div>

        {/* Guidance Panel — only shown in THERAPIST mode */}
        {showHints && !isClientMode && (
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

            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Suggested Questions
              </h3>
              <ul className="space-y-2">
                {approach.suggestedQuestions.map((q, i) => (
                  <li
                    key={i}
                    className="text-slate-400 text-xs italic leading-relaxed cursor-pointer hover:text-slate-200 transition-colors bg-slate-900 rounded-lg p-3"
                    onClick={() => setInput(q)}
                  >
                    &ldquo;{q}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
