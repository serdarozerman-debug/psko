'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ScorePoint {
  sessionId: string
  domain: string
  score: number
  assessor: string
  date: string
}

interface Props {
  scores: ScorePoint[]
}

const COLORS = [
  '#34d399', // emerald
  '#60a5fa', // blue
  '#f59e0b', // amber
  '#f87171', // red
  '#a78bfa', // violet
  '#fb923c', // orange
]

export function TrendLineChart({ scores }: Props) {
  if (scores.length === 0) {
    return <p className="text-slate-500 text-sm">No score data yet.</p>
  }

  const domains = Array.from(new Set(scores.map((s) => s.domain)))

  // Group scores by date, then pivot domains as columns
  const byDate = new Map<string, Record<string, number>>()
  for (const s of scores) {
    const key = new Date(s.date).toLocaleDateString()
    const row = byDate.get(key) ?? {}
    row[s.domain] = s.score
    byDate.set(key, row)
  }

  const data = Array.from(byDate.entries()).map(([date, row]) => ({
    date,
    ...row,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis domain={[1, 6]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Legend />
        {domains.map((d, i) => (
          <Line
            key={d}
            type="monotone"
            dataKey={d}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
