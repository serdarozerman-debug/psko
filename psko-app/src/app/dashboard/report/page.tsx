'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendLineChart } from '@/components/educator/reports/TrendLineChart'

interface ScorePoint {
  sessionId: string
  domain: string
  score: number
  assessor: string
  date: string
}

export default function StudentSelfReportPage() {
  const [scores, setScores] = useState<ScorePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/student/report')
        if (!res.ok) throw new Error('Failed to load report')
        const data = await res.json()
        setScores(data.scores ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <p className="text-slate-400 animate-pulse">Loading your report…</p>
  }

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  return (
    <div className="space-y-8">
      <div className="text-sm">
        <Link
          href="/dashboard"
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold">My Progress</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">Score Trends</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <TrendLineChart scores={scores} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Session History</h2>
        {scores.length === 0 ? (
          <p className="text-slate-500 text-sm">
            Complete a simulation session to see your scores here.
          </p>
        ) : (
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-left px-4 py-2 font-medium">Domain</th>
                  <th className="text-left px-4 py-2 font-medium">Score</th>
                  <th className="text-left px-4 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {scores.map((s, i) => (
                  <tr key={`${s.sessionId}-${s.domain}-${i}`} className="hover:bg-slate-900/40">
                    <td className="px-4 py-2 text-slate-400">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{s.domain}</td>
                    <td className="px-4 py-2">{s.score}/6</td>
                    <td className="px-4 py-2 text-slate-400">{s.assessor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
