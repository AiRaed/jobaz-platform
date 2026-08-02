'use client'

import Link from 'next/link'
import { ArrowRight, Compass, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CareerPathTriad } from '@/lib/career-journey/types'

const TIER_META = {
  workNow: {
    label: 'Work Now',
    subtitle: 'Immediate income · fast hiring',
    border: 'border-emerald-500/25',
    bg: 'bg-emerald-950/20',
    accent: 'text-emerald-300',
  },
  buildNext: {
    label: 'Build Next',
    subtitle: 'Next realistic role · 6–24 months',
    border: 'border-cyan-500/25',
    bg: 'bg-cyan-950/20',
    accent: 'text-cyan-300',
  },
  longTerm: {
    label: 'Long-Term Path',
    subtitle: 'Future growth & hope',
    border: 'border-violet-500/25',
    bg: 'bg-violet-950/20',
    accent: 'text-violet-300',
  },
} as const

type Props = {
  triad: CareerPathTriad
  compact?: boolean
}

export default function CareerPathTriadPanel({ triad, compact }: Props) {
  const tiers = [
    { key: 'workNow' as const, items: triad.workNow },
    { key: 'buildNext' as const, items: triad.buildNext },
    { key: 'longTerm' as const, items: triad.longTerm },
  ]

  const buildNextRoles = triad.buildNext.filter((d) => !d.chips?.includes('Training'))

  return (
    <section className="space-y-4">
      {triad.supportiveSummary && (
        <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-950/15">
          <p className="text-[10px] uppercase tracking-wider font-medium text-violet-300 mb-2">
            Why this path?
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{triad.supportiveSummary}</p>
          {triad.ladderSummary && (
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">{triad.ladderSummary}</p>
          )}
        </div>
      )}

      <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'md:grid-cols-3')}>
        {tiers.map(({ key, items }) => {
          const meta = TIER_META[key]
          const displayItems =
            key === 'buildNext'
              ? (buildNextRoles.length ? buildNextRoles : items).slice(0, compact ? 2 : 3)
              : items.slice(0, compact ? 2 : 3)

          return (
            <div
              key={key}
              className={cn(
                'rounded-2xl border p-4 md:p-5',
                meta.border,
                meta.bg,
                'backdrop-blur-sm'
              )}
            >
              <p className={cn('text-[10px] uppercase tracking-wider font-medium', meta.accent)}>
                {meta.label}
              </p>
              <p className="text-[10px] text-slate-500 mb-3">{meta.subtitle}</p>
              {displayItems.length === 0 ? (
                triad.ladderSummary ? (
                  <p className="text-xs text-slate-400 leading-relaxed">{triad.ladderSummary}</p>
                ) : (
                  <p className="text-xs text-slate-500">Paths appear as JAZ learns more.</p>
                )
              ) : (
                <ul className="space-y-3">
                  {displayItems.map((d) => (
                    <li key={d.id}>
                      <p className="text-sm font-medium text-slate-100">{d.title}</p>
                      {d.chips?.includes('Confidence') && (
                        <p className="text-[10px] text-emerald-300/90 mt-0.5">
                          {d.chips.find((c) => c.startsWith('Confidence'))}
                        </p>
                      )}
                      {d.why[0] && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{d.why[0]}</p>
                      )}
                      {key === 'buildNext' && d.recommendedTraining && d.recommendedTraining.length > 0 && (
                        <div className="mt-2 pl-2 border-l border-cyan-500/20">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                            Recommended training
                          </p>
                          <ul className="space-y-1">
                            {d.recommendedTraining.slice(0, 3).map((course) => (
                              <li key={course} className="text-xs text-slate-300">
                                {course}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {key !== 'buildNext' && d.chips && d.chips.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {d.chips
                            .filter((c) => !c.startsWith('Confidence') && c !== 'Training')
                            .slice(0, 3)
                            .map((c) => (
                              <span
                                key={c}
                                className="text-[9px] px-1.5 py-0.5 rounded border border-slate-600/50 text-slate-400"
                              >
                                {c}
                              </span>
                            ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
