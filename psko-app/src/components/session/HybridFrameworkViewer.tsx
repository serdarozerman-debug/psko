/**
 * HybridFrameworkViewer — side-by-side comparison of 2-3 therapeutic approaches.
 * Read-only. No state. No selection. Pedagogical reference for post-session review.
 *
 * Responsive: 3 cols ≥1024px, 2 cols 768-1023px, 1 col <768px.
 * Turkish UI strings.
 */
import type { TherapeuticApproach } from '@/types'
import { buildFrameworkCards, type FrameworkCardData } from './HybridFrameworkViewer.data'

interface HybridFrameworkViewerProps {
  approaches: TherapeuticApproach[]
  /** Optional heading override; defaults to Turkish "Yaklaşım Karşılaştırması" */
  heading?: string
}

export function HybridFrameworkViewer({
  approaches,
  heading = 'Yaklaşım Karşılaştırması',
}: HybridFrameworkViewerProps) {
  const cards = buildFrameworkCards(approaches)

  if (cards.length === 0) {
    return (
      <section
        aria-label={heading}
        className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600"
      >
        <p>Karşılaştırılacak yaklaşım bulunamadı.</p>
      </section>
    )
  }

  return (
    <section
      aria-label={heading}
      className="rounded-lg border border-slate-200 bg-white p-6"
    >
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{heading}</h2>
      <div
        className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        {cards.map((card) => (
          <FrameworkCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  )
}

function FrameworkCard({ card }: { card: FrameworkCardData }) {
  return (
    <article
      role="listitem"
      tabIndex={0}
      aria-labelledby={`fw-${card.id}-name`}
      className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <header>
        <h3 id={`fw-${card.id}-name`} className="text-lg font-semibold text-slate-900">
          {card.name}
        </h3>
        <p className="mt-1 text-sm text-slate-600">{card.description}</p>
      </header>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Aşama Sırası
        </h4>
        <ol className="mt-2 flex flex-wrap gap-1.5" aria-label="Aşama sırası">
          {card.phaseTimeline.map((phase) => (
            <li
              key={phase.index}
              className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800"
            >
              <span className="mr-1 text-indigo-500">{phase.index + 1}.</span>
              {phase.name}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Temel Teknikler
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {card.keyTechniques.map((technique, i) => (
            <li key={i}>{technique}</li>
          ))}
        </ul>
      </div>

      {card.recommendedWhen.length > 0 && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Önerilen Durumlar
          </h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {card.recommendedWhen.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}

export default HybridFrameworkViewer
