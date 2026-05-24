'use client'

import { useState } from 'react'

type JoinCodeChipProps = {
  code: string
  enabled?: boolean
  showCopy?: boolean
  size?: 'sm' | 'md'
}

export function JoinCodeChip({
  code,
  enabled = true,
  showCopy = true,
  size = 'md',
}: JoinCodeChipProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable; ignore
    }
  }

  const base =
    'inline-flex items-center gap-2 rounded-full border font-mono tracking-wider'
  const sizing =
    size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  const color = enabled
    ? 'bg-emerald-900/40 text-emerald-200 border-emerald-700'
    : 'bg-slate-800 text-slate-400 border-slate-700 line-through'

  return (
    <span className={`${base} ${sizing} ${color}`}>
      <span aria-label="Join code">{code}</span>
      {showCopy && enabled && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy join code"
          className="text-emerald-300 hover:text-white transition-colors text-xs underline-offset-2 hover:underline"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      )}
      {!enabled && (
        <span className="text-slate-500 text-xs italic">disabled</span>
      )}
    </span>
  )
}

export default JoinCodeChip
