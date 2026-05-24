'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface StudentScore {
  studentId: string
  email: string | null
  scores: { domain: string; score: number }[]
}

interface Props {
  studentScores: StudentScore[]
}

const COLORS = [
  '#34d399',
  '#60a5fa',
  '#f59e0b',
  '#f87171',
  '#a78bfa',
  '#fb923c',
]

export function CohortBarChart({ studentScores }: Props) {
  if (studentScores.length === 0) {
    return <p className="text-slate-500 text-sm">No student scores to display.</p>
  }

  // Collect all domains
  const domains = [
    ...new Set(studentScores.flatMap((s) => s.scores.map((sc) => sc.domain))),
  ]

  // Average score per domain per student
  const data = studentScores.map((st) => {
    const row: Record<string, string | number> = {
      name: st.email?.split('@')[0] ?? st.studentId.slice(0, 8),
    }
    for (const d of domains) {
      const matching = st.scores.filter((sc) => sc.domain === d)
      row[d] =
        matching.length > 0
          ? +(matching.reduce((a, b) => a + b.score, 0) / matching.length).toFixed(2)
          : 0
    }
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, studentScores.length * 50)}>
      <BarChart data={data} layout="vertical" margin={{ left: 60, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis type="number" domain={[0, 6]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          width={80}
        />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Legend />
        {domains.map((d, i) => (
          <Bar key={d} dataKey={d} fill={COLORS[i % COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
