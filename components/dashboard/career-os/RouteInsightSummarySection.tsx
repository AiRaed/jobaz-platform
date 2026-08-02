'use client'

import type { RouteInsightCards } from '@/lib/dashboard/careerOs/types'
import PlanSectionHeader from '@/components/plan-ui/PlanSectionHeader'
import { PLAN_SECTION_STYLES } from '@/lib/plan-ui/planVisualSystem'
import { cn } from '@/lib/utils'

type Props = {
  insights: RouteInsightCards
}

/** Quiet secondary insight cards. Display only. */
export default function RouteInsightSummarySection({ insights }: Props) {
  const cards = [
    { title: 'Why this route', items: insights.whyThisRoute },
    { title: 'What you bring', items: insights.whatYouBring },
    { title: 'Areas to improve', items: insights.areasToImprove },
  ].filter((c) => c.items.length > 0)

  if (cards.length === 0) return null

  const muted = PLAN_SECTION_STYLES.muted

  return (
    <section className="space-y-2.5">
      <PlanSectionHeader accent="muted" title="More context" />
      <div className="space-y-2">
        {cards.map((card) => (
          <div key={card.title} className={cn('rounded-xl border px-3.5 py-3', muted.border, muted.panel)}>
            <h4 className="text-[11px] font-semibold text-slate-700 dark:text-slate-500 mb-1.5">
              {card.title}
            </h4>
            <ul className="space-y-1">
              {card.items.slice(0, 2).map((item) => (
                <li
                  key={item}
                  className="text-[11px] text-slate-600 dark:text-slate-500/90 leading-snug line-clamp-2"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
