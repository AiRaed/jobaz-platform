'use client'

import { Briefcase, Clock, PoundSterling, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CAREER_PATH_PREVIEW } from '@/lib/uk-career-assistant/liveIntelligence'

type Props = {
  pathIds?: string[]
  visible: boolean
}

const DEMAND_COLOR = {
  emerald: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  cyan: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
  violet: 'text-violet-300 border-violet-500/30 bg-violet-500/10',
  blue: 'text-blue-300 border-blue-500/30 bg-blue-500/10',
  amber: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
}

export default function UkCareerPathPreview({ pathIds, visible }: Props) {
  if (!visible) return null

  const ids = pathIds?.length ? pathIds : CAREER_PATH_PREVIEW.slice(0, 3).map((p) => p.id)
  const cards = ids
    .map((id) => CAREER_PATH_PREVIEW.find((p) => p.id === id || p.id.replace(/-/g, '_') === id.replace(/-/g, '_')))
    .filter(Boolean) as typeof CAREER_PATH_PREVIEW

  const display = cards.length > 0 ? cards : CAREER_PATH_PREVIEW.slice(0, 3)

  return (
    <section className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-slate-100">Career Path Preview</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {display.slice(0, 3).map((path, i) => (
          <article
            key={path.id}
            className="uk-ca-panel rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-violet-950/20 p-4 hover:border-violet-500/30 hover:shadow-[0_0_24px_rgba(139,92,246,0.12)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <h4 className="text-sm font-semibold text-slate-100 mb-2">{path.title}</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                <PoundSterling className="w-3 h-3" />
                {path.salary}
              </span>
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full border',
                  DEMAND_COLOR[path.demandTone]
                )}
              >
                <TrendingUp className="w-2.5 h-2.5 inline mr-0.5" />
                {path.demand}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="w-3 h-3" />
                {path.timeToReady}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mb-1">Improvements needed</p>
            <div className="flex flex-wrap gap-1">
              {path.improvements.map((imp) => (
                <span
                  key={imp}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-slate-600/40 text-slate-400"
                >
                  {imp}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
