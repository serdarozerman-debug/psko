'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface DomainAverage {
  domain: string
  average: number
}

interface ScorePoint {
  domain: string
  score: number
}

interface Props {
  studentScores: ScorePoint[]
  cohortAverages: DomainAverage[]
}

export function CompetencyRadar({ studentScores, cohortAverages }: Props) {
  const domains = Array.from(new Set([
    ...studentScores.map((s) => s.domain),
    ...cohortAverages.map((a) => a.domain),
  ]))

  if (domains.length === 0) {
    return <p className="text-slate-500 text-sm">No competency data yet.</p>
  }

  // Average student scores per domain
  const studentByDomain = new Map<string, { sum: number; n: number }>()
  for (const s of studentScores) {
    const acc = studentByDomain.get(s.domain) ?? { sum: 0, n: 0 }
    acc.sum += s.score
    acc.n += 1
    studentByDomain.set(s.domain, acc)
  }

  const cohortMap = new Map(cohortAverages.map((a) => [a.domain, a.average]))

  const data = domains.map((d) => {
    const st = studentByDomain.get(d)
    return {
      domain: d,
      student: st ? +(st.sum / st.n).toFixed(2) : 0,
      cohort: +(cohortMap.get(d) ?? 0).toFixed(2),
    }
  })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="domain" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 6]} tick={{ fill: '#64748b', fontSize: 10 }} />
        <Radar
          name="Student"
          dataKey="student"
          stroke="#34d399"
          fill="#34d399"
          fillOpacity={0.2}
        />
        <Radar
          name="Cohort avg"
          dataKey="cohort"
          stroke="#60a5fa"
          fill="#60a5fa"
          fillOpacity={0.1}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  )
}
