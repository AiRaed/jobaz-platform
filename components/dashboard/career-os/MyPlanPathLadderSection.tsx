'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Briefcase, ExternalLink, GraduationCap, Rocket, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PathPlanLadder, PathPlanStep } from '@/lib/dashboard/careerOs/pathPlanLadder'
import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import { openCourseApply } from '@/lib/career-hub/marketplace/apply'

const CARD = 'rounded-lg border border-slate-700/50 bg-slate-900/40 p-3'

type Props = {
  ladder: PathPlanLadder
}

function StepList({
  title,
  accent,
  icon: Icon,
  steps,
}: {
  title: string
  accent: string
  icon: React.ElementType
  steps: PathPlanStep[]
}) {
  if (!steps.length) return null
  return (
    <div className={cn(CARD, 'space-y-2')}>
      <div className="flex items-center gap-1.5">
        <Icon className={cn('w-3.5 h-3.5', accent)} />
        <p className={cn('text-[10px] uppercase tracking-wider font-semibold', accent)}>{title}</p>
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.title}>
            {step.href ? (
              <Link href={step.href} className="group block">
                <p className="text-sm font-medium text-slate-100 group-hover:text-violet-200">
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
                    {step.description}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] text-violet-300 mt-1">
                  Open <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-100">{step.title}</p>
                {step.description && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{step.description}</p>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TrainNextCard({ steps }: { steps: PathPlanStep[] }) {
  const primary = steps[0]
  const [resolved, setResolved] = useState<RecommendationCourseCardData | null>(null)

  useEffect(() => {
    if (!primary?.title) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/recommendations/resolve-courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titles: [primary.title], limit: 1 }),
        })
        if (!res.ok || cancelled) return
        const body = (await res.json()) as { cards?: RecommendationCourseCardData[] }
        if (!cancelled) setResolved(body.cards?.[0] ?? null)
      } catch {
        if (!cancelled) setResolved(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [primary?.title])

  if (!primary) return null

  const referralUrl = (resolved?.referralUrl || primary.referralUrl || '').trim()
  const officialUrl = (resolved?.officialUrl || primary.officialUrl || '').trim()
  const title = resolved?.title || primary.title

  return (
    <div className={cn(CARD, 'space-y-2')}>
      <div className="flex items-center gap-1.5">
        <GraduationCap className="w-3.5 h-3.5 text-cyan-300" />
        <p className="text-[10px] uppercase tracking-wider font-semibold text-cyan-300">Train next</p>
      </div>
      <p className="text-sm font-medium text-slate-100">{title}</p>
      {primary.description && (
        <p className="text-xs text-slate-500 leading-snug">{primary.description}</p>
      )}
      {resolved?.badge && (
        <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/35 text-emerald-300">
          {resolved.badge}
        </span>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {referralUrl ? (
          <button
            type="button"
            onClick={() =>
              openCourseApply(
                {
                  id: resolved?.publishedCourseId ?? resolved?.id ?? primary.id ?? title,
                  title,
                  referralUrl,
                  officialUrl,
                },
                'career_coach_result',
                'apply_now'
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-emerald-500 hover:to-cyan-500 transition"
          >
            Apply Now <ExternalLink className="w-3 h-3" />
          </button>
        ) : (
          <Link
            href="/dashboard#recommended-training"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300"
          >
            View training <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  )
}

/** Start Now / Train Next / Upgrade — keeps course vs job roles distinct. */
export default function MyPlanPathLadderSection({ ladder }: Props) {
  const showGroupedAddOns =
    ladder.isSecurityRoute ||
    ladder.relevantAddOns.length > 0 ||
    ladder.otherRouteAddOns.length > 0

  return (
    <section
      id="path-ladder"
      className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-300/90 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Your Career Coach plan
          </p>
          <h3 className="text-base font-semibold text-slate-50 mt-0.5">{ladder.routeLabel}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Training unlocks later roles — it is not your immediate job target.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StepList
          title="Start now"
          accent="text-emerald-300"
          icon={Briefcase}
          steps={ladder.startNow}
        />
        <TrainNextCard steps={ladder.trainNext} />
        <StepList
          title="Upgrade after training"
          accent="text-violet-300"
          icon={Rocket}
          steps={ladder.upgradeAfter}
        />
        {showGroupedAddOns ? (
          <>
            <StepList
              title="Relevant add-ons"
              accent="text-amber-300"
              icon={GraduationCap}
              steps={ladder.relevantAddOns}
            />
            {ladder.otherRouteAddOns.length > 0 && (
              <StepList
                title="Other route add-ons"
                accent="text-slate-400"
                icon={GraduationCap}
                steps={ladder.otherRouteAddOns}
              />
            )}
          </>
        ) : (
          <StepList
            title="Optional add-ons"
            accent="text-amber-300"
            icon={GraduationCap}
            steps={ladder.optionalAddOns}
          />
        )}
      </div>
    </section>
  )
}
