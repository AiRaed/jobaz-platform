'use client'

import { Check, Lightbulb, TrendingUp, User } from 'lucide-react'
import type { RouteInsightCards } from '@/lib/dashboard/careerOs/types'

type Props = {
  insights: RouteInsightCards
}

const CARDS: {
  key: keyof RouteInsightCards
  title: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
}[] = [
  { key: 'whyThisRoute', title: 'Why This Route', icon: Lightbulb, accent: 'border-cyan-500/20 bg-cyan-950/15' },
  { key: 'whatYouBring', title: 'What You Bring', icon: User, accent: 'border-violet-500/20 bg-violet-950/15' },
  { key: 'areasToImprove', title: 'Areas To Improve', icon: TrendingUp, accent: 'border-amber-500/20 bg-amber-950/15' },
]

const ICON_COLOR: Record<string, string> = {
  whyThisRoute: 'text-cyan-400',
  whatYouBring: 'text-violet-400',
  areasToImprove: 'text-amber-400',
}

export default function RouteInsightCardsSection({ insights }: Props) {
  const visible = CARDS.filter((c) => insights[c.key].length > 0)
  if (!visible.length) return null

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {visible.map(({ key, title, icon: Icon, accent }) => {
        const items = insights[key]
        return (
          <div key={key} className={`rounded-xl border p-3 h-full flex flex-col ${accent}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className={`w-3.5 h-3.5 shrink-0 ${ICON_COLOR[key]}`} />
              <h3 className="text-[11px] font-semibold text-slate-100 uppercase tracking-wide">{title}</h3>
            </div>
            <ul className="space-y-1.5 flex-1">
              {items.slice(0, 4).map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-xs text-slate-300 leading-snug">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
