'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CohortBarChart } from '@/components/educator/reports/CohortBarChart'

interface StudentScore {
  studentId: string
  email: string | null
  scores: { sessionId: string; domain: string; score: number; assessor: string; date: string }[]
}

interface DomainAverage {
  domain: string
  average: number
}

interface CohortReportData {
  studentScores: StudentScore[]
  domainAverages: DomainAverage[]
}

export default function CohortReportPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<CohortReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/educator/cohorts/${id}/report`)
        if (!res.ok) throw new Error('Failed to load cohort report')
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
    return <p className="text-slate-400 animate-pulse">Loading cohort report…</p>
  }

  if (error || !data) {
    return <p className="text-red-400">{error ?? 'No data'}</p>
  }

  return (
    <div className="space-y-8">
      <div className="text-sm">
        <Link
          href={`/educator/cohorts/${id}`}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Cohort detail
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Cohort Report</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">Student Scores by Domain</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <CohortBarChart studentScores={data.studentScores} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Domain Averages</h2>
        {data.domainAverages.length === 0 ? (
          <p className="text-slate-500 text-sm">No scores recorded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.domainAverages.map((d) => (
              <div
                key={d.domain}
                className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center"
              >
                <p className="text-xs text-slate-400 uppercase tracking-wide">{d.domain}</p>
                <p className="text-2xl font-bold text-white mt-1">{d.average.toFixed(1)}</p>
                <p className="text-xs text-slate-500">/ 6</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Per-Student Breakdown</h2>
        {data.studentScores.length === 0 ? (
          <p className="text-slate-500 text-sm">No student data.</p>
        ) : (
          <div className="space-y-2">
            {data.studentScores.map((st) => (
              <Link
                key={st.studentId}
                href={`/educator/students/${st.studentId}`}
                className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 hover:border-slate-700 transition-colors"
              >
                <span className="text-sm text-white">
                  {st.email ?? st.studentId.slice(0, 8)}
                </span>
                <span className="text-xs text-slate-400">
                  {st.scores.length} score{st.scores.length !== 1 ? 's' : ''}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
