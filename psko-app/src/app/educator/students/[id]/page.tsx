'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { TrendLineChart } from '@/components/educator/reports/TrendLineChart'
import { CompetencyRadar } from '@/components/educator/reports/CompetencyRadar'

interface ScorePoint {
  sessionId: string
  domain: string
  score: number
  assessor: string
  date: string
}

interface DomainAverage {
  domain: string
  average: number
}

interface ReportData {
  scores: ScorePoint[]
  cohortAverages: DomainAverage[]
}

export default function StudentReportPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/educator/students/${id}/report`)
        if (!res.ok) throw new Error('Failed to load report')
        setData(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return <p className="text-slate-400 animate-pulse">Loading report…</p>
  }

  if (error || !data) {
    return <p className="text-red-400">{error ?? 'No data'}</p>
  }

  return (
    <div className="space-y-8">
      <div className="text-sm">
        <Link
          href="/educator/cohorts"
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Cohorts
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Student Report</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">Score Trends</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <TrendLineChart scores={data.scores} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Competency vs Cohort</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <CompetencyRadar
            studentScores={data.scores}
            cohortAverages={data.cohortAverages}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">All Scores</h2>
        {data.scores.length === 0 ? (
          <p className="text-slate-500 text-sm">No scores recorded yet.</p>
        ) : (
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-left px-4 py-2 font-medium">Domain</th>
                  <th className="text-left px-4 py-2 font-medium">Score</th>
                  <th className="text-left px-4 py-2 font-medium">Assessor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.scores.map((s, i) => (
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
