import Link from 'next/link'
import type { PersonaData, ApproachConfig, SupervisorFeedback } from '@/types'

interface FeedbackReportProps {
  session: { id: string; startedAt: Date; endedAt: Date | null; turnCount: number }
  persona: PersonaData
  approach: ApproachConfig
  feedback: SupervisorFeedback
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 6) * 100
  const color = score >= 5 ? 'bg-green-500' : score >= 3 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold w-6 text-right">{score}</span>
    </div>
  )
}

export default function FeedbackReport({ session, persona, approach, feedback }: FeedbackReportProps) {
  const scoreColor =
    feedback.overallScore >= 70 ? 'text-green-400' :
    feedback.overallScore >= 40 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Session Feedback</h1>
            <p className="text-slate-400 mt-1">
              {persona.name} · {approach.name} · {session.turnCount} turns
            </p>
            <p className="text-slate-600 text-sm mt-0.5">
              {new Date(session.startedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <span className={`text-5xl font-bold ${scoreColor}`}>{feedback.overallScore}</span>
            <p className="text-slate-500 text-sm">/100</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl px-5 py-3 text-yellow-300 text-xs">
          ⚠️ This is AI-generated educational feedback based on CTS-R criteria. It is a training tool, not a clinical assessment. Always consult your clinical supervisor.
        </div>

        {/* Competency Scores */}
        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="font-semibold mb-4">CTS-R Competency Scores</h2>
          <div className="space-y-4">
            {feedback.competencyScores.map((cs) => (
              <div key={cs.domain}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-300">{cs.domain}</span>
                </div>
                <ScoreBar score={cs.score} />
                <p className="text-xs text-slate-500 mt-1">{cs.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        {feedback.strengths.length > 0 && (
          <div className="bg-slate-900 rounded-xl p-6">
            <h2 className="font-semibold mb-3 text-green-400">Strengths</h2>
            <ul className="space-y-2">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="text-slate-300 text-sm flex gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {feedback.areasForImprovement.length > 0 && (
          <div className="bg-slate-900 rounded-xl p-6">
            <h2 className="font-semibold mb-3 text-yellow-400">Areas for Improvement</h2>
            <ul className="space-y-2">
              {feedback.areasForImprovement.map((a, i) => (
                <li key={i} className="text-slate-300 text-sm flex gap-2">
                  <span className="text-yellow-500 mt-0.5">→</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Moments */}
        {feedback.keyMoments.length > 0 && (
          <div className="bg-slate-900 rounded-xl p-6">
            <h2 className="font-semibold mb-3">Key Session Moments</h2>
            <div className="space-y-3">
              {feedback.keyMoments.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-600 text-xs mt-0.5 w-12 shrink-0">Turn {m.turn}</span>
                  <p className="text-slate-300 text-sm">{m.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Readings */}
        {feedback.suggestedReadings.length > 0 && (
          <div className="bg-slate-900 rounded-xl p-6">
            <h2 className="font-semibold mb-3">Suggested Readings</h2>
            <ul className="space-y-1">
              {feedback.suggestedReadings.map((r, i) => (
                <li key={i} className="text-blue-400 text-sm">· {r}</li>
              ))}
            </ul>
          </div>
        )}

        <Link
          href="/dashboard"
          className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
