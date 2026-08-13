'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Circle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CareerRoadmap } from '@/lib/dashboard/careerOs/types'
import RouteBadge from '@/components/plan-ui/RouteBadge'
import { PLAN_SECTION_STYLES, resolvePlanRouteVisual } from '@/lib/plan-ui/planVisualSystem'

type Props = {
  roadmap: CareerRoadmap
  /** Optional one-liner from Career Assistant ca_selection */
  planSubtitle?: string | null
  futureRoute?: string | null
  /** Override hero focus from latest CA plan identity */
  currentFocusOverride?: string | null
  nextTrainingOverride?: string | null
}

/** Polished plan hero — route badge + accent stats. Display only. */
export default function CareerPlanHeroSection({
  roadmap,
  planSubtitle,
  futureRoute,
  currentFocusOverride,
  nextTrainingOverride,
}: Props) {
  const action = roadmap.continueJourney
  const currentRole =
    (currentFocusOverride || '').trim() ||
    roadmap.targetRole ||
    roadmap.destination.targetRole
  const trainTitle =
    (nextTrainingOverride || '').trim() ||
    roadmap.pathLadder?.trainNext[0]?.title
  const futureTitle =
    futureRoute ||
    roadmap.pathLadder?.upgradeAfter[0]?.title ||
    null
  // Next upgrade = selected training/course first — never a future academic role
  const nextUpgrade = trainTitle || null
  const isSecurityRoute =
    Boolean(roadmap.pathLadder?.isSecurityRoute) || /security/i.test(roadmap.routeLabel)

  const explanation =
    planSubtitle?.trim() ||
    (isSecurityRoute
      ? 'Start earning through event/security steward roles now, then use SIA Door Supervisor to unlock better-paid security roles.'
      : currentRole && futureTitle && futureTitle !== currentRole
        ? `Work now as ${currentRole}. Future route: ${futureTitle}${
            trainTitle ? `. Next training: ${trainTitle}` : ''
          }.`
        : currentRole && trainTitle
          ? `Work now as ${currentRole}. Next upgrade: ${trainTitle}.`
          : currentRole
            ? `Start with ${currentRole} now. Complete upgrade training when you are ready.`
            : 'Your Career Coach route — work now first, then train to upgrade.')

  const headerTitle = currentRole || roadmap.routeLabel
  const routeVisual = resolvePlanRouteVisual(roadmap.routePathId, roadmap.routeLabel)
  const RouteIcon = routeVisual.Icon
  const route = PLAN_SECTION_STYLES.route

  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const breakdown = roadmap.readinessBreakdown
  const completed = breakdown?.completed ?? roadmap.readinessInsights.slice(0, 4)
  const missing = breakdown?.missing ?? []

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: MouseEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  return (
    <section
      className={cn(
        'jobaz-hero jobaz-keep-light relative overflow-hidden rounded-2xl border',
        route.border,
        'bg-gradient-to-br from-slate-900 via-slate-950 to-[#0c1220]',
        'px-5 py-5 md:px-7 md:py-6'
      )}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70',
          routeVisual.accentClass
        )}
      />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl border',
                  route.iconWrap
                )}
              >
                <RouteIcon className={cn('h-4 w-4', route.icon)} />
              </span>
              <RouteBadge pathId={roadmap.routePathId} routeLabel={roadmap.routeLabel} />
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                My Plan
              </p>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              {headerTitle}
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              {explanation}
            </p>
          </div>

          <div
            className={cn(
              'grid gap-3 max-w-2xl grid-cols-1 sm:grid-cols-2',
              futureTitle ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
            )}
          >
            <div className={cn('rounded-xl border px-3 py-2.5', route.chip)}>
              <p className="text-[10px] uppercase tracking-wider opacity-70">Current focus</p>
              <p className="text-sm font-medium mt-0.5 break-words" title={currentRole}>
                {currentRole || '—'}
              </p>
            </div>
            <div className={cn('rounded-xl border px-3 py-2.5', route.chip)}>
              <p className="text-[10px] uppercase tracking-wider opacity-70">Next upgrade</p>
              <p className="text-sm font-medium mt-0.5 break-words" title={nextUpgrade || undefined}>
                {nextUpgrade || '—'}
              </p>
            </div>
            {futureTitle ? (
              <div className={cn('rounded-xl border px-3 py-2.5', route.chip)}>
                <p className="text-[10px] uppercase tracking-wider opacity-70">Future route</p>
                <p className="text-sm font-medium mt-0.5 break-words" title={futureTitle}>
                  {futureTitle}
                </p>
              </div>
            ) : null}

            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={panelId}
                className={cn(
                  'w-full rounded-xl border px-3 py-2.5 text-left transition',
                  route.chip,
                  open && 'ring-1 ring-cyan-400/40'
                )}
              >
                <p className="text-[10px] uppercase tracking-wider opacity-70 flex items-center gap-1">
                  Readiness
                  <Info className="w-3 h-3 opacity-60" />
                </p>
                <p className="text-sm font-semibold mt-0.5 tabular-nums">
                  {roadmap.careerReadinessPercent}%
                </p>
              </button>

              {open && (
                <div
                  id={panelId}
                  role="dialog"
                  aria-label="Career readiness breakdown"
                  className={cn(
                    'absolute z-30 mt-2 w-[min(100vw-2rem,20rem)] right-0 sm:left-0 sm:right-auto',
                    'rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]',
                    'dark:border-slate-600/50 dark:bg-slate-950 dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)]',
                    'p-3.5'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Career readiness: {roadmap.careerReadinessPercent}%
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Based on your current plan progress.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="p-1 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-white/5"
                      aria-label="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {completed.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400/80 mb-1.5">
                        Completed
                      </p>
                      <ul className="space-y-1">
                        {completed.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-snug"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {missing.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
                        Still missing
                      </p>
                      <ul className="space-y-1">
                        {missing.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 leading-snug"
                          >
                            <Circle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-52 space-y-3">
          <div className="h-1.5 rounded-full bg-white/15 dark:bg-slate-800/90 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-300 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, roadmap.careerReadinessPercent))}%` }}
            />
          </div>
          <Link href={action.href} className="jobaz-btn-primary w-full">
            Continue Journey
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
