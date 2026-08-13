'use client'

import Link from 'next/link'
import { Briefcase, ExternalLink, GraduationCap, Map, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import PlanSectionHeader from '@/components/plan-ui/PlanSectionHeader'
import { PLAN_SECTION_STYLES } from '@/lib/plan-ui/planVisualSystem'

type Props = {
  plan: JobAZPlan | null | undefined
}

function jobsHref(role: string): string {
  return `/job-finder?query=${encodeURIComponent(role)}`
}

function cvHref(role: string): string {
  return `/cv-builder-v2?targetRole=${encodeURIComponent(role)}`
}

function coursesSearchHref(title: string): string {
  return `/courses?q=${encodeURIComponent(title)}`
}

/**
 * Beautiful scan of the latest Career Assistant selection — active plan source of truth.
 */
export default function SelectedFromCareerAssistantSection({ plan }: Props) {
  const sel = plan?.ca_selection
  if (!sel) return null

  const roles = sel.roles || []
  const training = sel.training || sel.selected_courses || []
  const future = sel.future_routes || sel.selected_future_routes || []
  const boosters = sel.boosters || sel.selected_actions || []

  if (!roles.length && !training.length && !future.length && !boosters.length) return null

  const focusRole =
    sel.current_focus_role ||
    plan?.cv_target_role ||
    plan?.route_summary.current_target_role ||
    roles[0]?.title ||
    ''
  const nextTraining =
    plan?.training_next?.title ||
    training[0]?.title ||
    plan?.route_summary.next_upgrade_role ||
    ''
  const futureTitle = sel.future_route || future[0]?.title || ''
  const trainingApplyUrl = (plan?.training_next?.apply_url || '').trim()
  const contextBits = [sel.goal_label, sel.specialism || sel.field].filter(Boolean)
  const styles = PLAN_SECTION_STYLES.route

  return (
    <section
      className={cn(
        'rounded-2xl border px-4 py-5 sm:px-6',
        styles.border,
        'bg-gradient-to-br from-slate-950/80 via-slate-950/50 to-cyan-950/20'
      )}
      aria-label="Your Career Assistant plan"
    >
      <PlanSectionHeader
        accent="route"
        title="Your selected Career Assistant plan"
        subtitle={contextBits.join(' · ') || 'Latest active plan'}
      />

      {/* Identity strip */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/80">
            Current focus
          </p>
          <p className="mt-1 text-sm font-semibold text-cyan-100 break-words">{focusRole || '—'}</p>
        </div>
        <div className="rounded-xl border border-violet-500/25 bg-violet-950/20 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/80">
            Next training
          </p>
          <p className="mt-1 text-sm font-semibold text-violet-100">{nextTraining || '—'}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/15 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
            Future route
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-100">{futureTitle || '—'}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Target roles */}
        {roles.length > 0 ? (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Briefcase className="h-3.5 w-3.5" aria-hidden />
              Work you can start now
            </p>
            <ul className="space-y-2">
              {roles.map((r) => (
                <li
                  key={`role-${r.title}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/15 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100">{r.title}</p>
                    {(r.badge || r.reason) && (
                      <p className="mt-0.5 text-[11px] text-slate-500">{r.badge || r.reason}</p>
                    )}
                  </div>
                  <Link
                    href={jobsHref(r.title)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-950/50"
                  >
                    View jobs
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Training */}
        {training.length > 0 ? (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden />
              Training / licences / courses
            </p>
            <ul className="space-y-2">
              {training.map((t, idx) => {
                const isPrimary = idx === 0
                const hasApply = isPrimary && Boolean(trainingApplyUrl)
                return (
                  <li
                    key={`train-${t.title}`}
                    className="rounded-xl border border-violet-500/20 bg-violet-950/15 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-100 break-words">{t.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {t.provider_label || t.reason || (hasApply ? 'Partner course' : 'Selected training')}
                        </p>
                      </div>
                      {hasApply ? (
                        <a
                          href={trainingApplyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-cyan-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-cyan-500"
                        >
                          Apply Now
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          <Link
                            href={coursesSearchHref(t.title)}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-600 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-white/5"
                          >
                            <Search className="h-3 w-3" aria-hidden />
                            Search courses later
                          </Link>
                          <span className="inline-flex items-center rounded-lg border border-slate-700/80 px-2 py-1.5 text-[10px] text-slate-500">
                            Coming soon on JobAZ
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        {/* Future */}
        {future.length > 0 ? (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Map className="h-3.5 w-3.5" aria-hidden />
              Future routes
            </p>
            <ul className="space-y-2">
              {future.map((r) => (
                <li
                  key={`future-${r.title}`}
                  className="rounded-xl border border-amber-500/15 bg-amber-950/10 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-slate-100">{r.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {r.badge || r.reason || 'Progression route · work toward later'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Optional add-ons */}
        {boosters.length > 0 ? (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Optional add-ons
            </p>
            <ul className="space-y-2">
              {boosters.map((b) => (
                <li
                  key={`boost-${b.title}`}
                  className="rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-slate-200">{b.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {b.reason || b.kind || 'Optional — not required'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {focusRole ? (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          <Link
            href={cvHref(focusRole)}
            className="inline-flex min-h-9 max-w-full items-center rounded-lg border border-cyan-500/35 bg-cyan-950/35 px-3.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-950/55 break-words whitespace-normal"
          >
            Open CV Builder — {focusRole}
          </Link>
          <Link
            href={jobsHref(focusRole)}
            className="inline-flex min-h-9 max-w-full items-center rounded-lg border border-emerald-500/30 bg-emerald-950/25 px-3.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-950/45 break-words whitespace-normal"
          >
            View jobs — {focusRole}
          </Link>
        </div>
      ) : null}
    </section>
  )
}
