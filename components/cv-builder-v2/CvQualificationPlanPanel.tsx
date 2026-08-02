'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Route, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CvTrainingQualification } from '@/lib/cv-builder/trainingQualifications'
import { statusLabel } from '@/lib/cv-builder/trainingQualifications'
import { enrichQualificationsForCvPanel } from '@/lib/cv-builder/cvQualificationScoring'

type Props = {
  qualifications: CvTrainingQualification[]
  currentCvScore: number
}

function scoreTone(score: number): string {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 45) return 'text-amber-400'
  return 'text-rose-400'
}

export default function CvQualificationPlanPanel({ qualifications, currentCvScore }: Props) {
  const summary = useMemo(
    () => enrichQualificationsForCvPanel(qualifications, currentCvScore),
    [qualifications, currentCvScore]
  )

  if (!summary.items.length) return null

  const incompleteCount = summary.items.filter((q) => q.status !== 'completed').length

  return (
    <section className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-slate-950/90 to-slate-950/80 overflow-hidden">
      <div className="px-4 py-4 border-b border-violet-500/15">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/25">
              <TrendingUp className="w-4 h-4 text-violet-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-50">Increase Your CV Score</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xl">
                Your AI Career Plan has identified the missing qualifications preventing you from
                reaching your career goal. Complete them to increase your CV strength and improve
                your chances of getting interviews.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Current CV Score</p>
            <p className={cn('text-2xl font-bold tabular-nums leading-none', scoreTone(summary.currentScore))}>
              {summary.currentScore}%
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          Your AI Career Plan identified qualifications that will strengthen your CV and increase
          your employability in the UK.
        </p>

        {incompleteCount > 0 && summary.remainingBoost > 0 && (
          <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-950/15 px-3 py-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-400/90">
                  Potential CV Score
                </p>
                <p className="text-lg font-bold text-emerald-300 tabular-nums">
                  {summary.potentialScore}%
                  <span className="text-xs font-medium text-emerald-400/80 ml-2">
                    +{summary.remainingBoost}% available
                  </span>
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Complete the recommendations below to unlock a stronger CV and more suitable job
              opportunities.
            </p>
          </div>
        )}
      </div>

      <ul className="p-4 space-y-3">
        {summary.items.map((qual) => {
          const isDone = qual.status === 'completed'
          const isActive = qual.status === 'in_progress'

          return (
            <li
              key={qual.id}
              className={cn(
                'rounded-lg border px-3.5 py-3 transition',
                isDone && 'border-emerald-500/25 bg-emerald-950/10',
                isActive && 'border-amber-500/25 bg-amber-950/10',
                !isDone && !isActive && 'border-slate-800/70 bg-slate-900/40'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4
                      className={cn(
                        'text-sm font-semibold',
                        isDone ? 'text-emerald-200' : 'text-slate-100'
                      )}
                    >
                      {qual.name}
                    </h4>
                    {qual.scoreBoost > 0 && (
                      <span className="inline-flex items-center rounded-md bg-violet-500/15 border border-violet-500/25 px-2 py-0.5 text-[11px] font-semibold text-violet-200 tabular-nums">
                        +{qual.scoreBoost}% CV Score
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] uppercase tracking-wider text-emerald-400/90">
                        Score unlocked
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    {statusLabel(qual.status)}
                  </p>

                  <p className="text-xs text-slate-400 leading-relaxed">{qual.valueCopy}</p>
                </div>

                {!isDone && qual.courseHref && (
                  <Link
                    href={qual.courseHref}
                    className={cn(
                      'shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition',
                      'bg-violet-600 text-white hover:bg-violet-500 shadow-sm shadow-violet-900/30'
                    )}
                  >
                    {qual.ctaLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="px-4 pb-4">
        <p className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-2 rounded-lg border border-slate-800/60 bg-slate-900/30 px-3 py-2.5">
          <Route className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
          <span>
            These recommendations are generated by your AI Career Plan and automatically sync across
            your Dashboard, Career Journey, Training Centre, Job Finder and CV Builder.
          </span>
        </p>
      </div>
    </section>
  )
}
