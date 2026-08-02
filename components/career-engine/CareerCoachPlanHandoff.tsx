'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ExternalLink, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { openCourseApply } from '@/lib/career-hub/marketplace/apply'
import { trackJazEvent } from '@/lib/analytics/jazTrackEvent'
import {
  getUkCareerAuthUrls,
} from '@/lib/uk-career-assistant/guestSession'
import {
  JOBAZ_PLAN_STORAGE_KEY,
  openAppLevelAuth,
  saveCareerPlanLocally,
  savePendingCareerPlan,
} from '@/lib/uk-career-assistant/pendingCareerPlan'
import { GUEST_CAREER_DASHBOARD_PATH } from '@/lib/auth/redirect'
import PlanSectionHeader from '@/components/plan-ui/PlanSectionHeader'
import RouteBadge from '@/components/plan-ui/RouteBadge'
import { PLAN_SECTION_STYLES, resolvePlanRouteVisual } from '@/lib/plan-ui/planVisualSystem'

const DEFAULT_SUMMARY =
  'Your answers point to realistic UK entry routes with room to grow. Start with work you can apply for now, then build your CV and training step by step.'

const DEFAULT_WEEK_STEPS = [
  'Build UK CV',
  'Apply to 5 jobs',
  'Save 3 jobs',
  'Start a course / review recommended training',
]

type Props = {
  plan: JobAZPlan
  isGuest?: boolean
  /** Optional AI one-liner — shown under “Based on your answers” */
  aiSummary?: string | null
  /** @deprecated use aiSummary */
  coachNotes?: string | null
}

function savePlanLocally(plan: JobAZPlan, marketingOptIn?: boolean, asPending = false) {
  if (asPending) {
    savePendingCareerPlan(plan, { marketingOptIn })
  } else {
    saveCareerPlanLocally(plan)
  }
}

function isPublishedApply(training: NonNullable<JobAZPlan['training_next']>) {
  return (
    training.type === 'published_course' &&
    training.action_label === 'Apply Now' &&
    Boolean(training.apply_url)
  )
}

function isPublishedOfficial(training: NonNullable<JobAZPlan['training_next']>) {
  return (
    training.type === 'published_course' &&
    !training.apply_url &&
    Boolean(training.official_url || training.slug)
  )
}

function isCourseTypeOnly(training: NonNullable<JobAZPlan['training_next']>) {
  return training.type === 'course_type' || training.type === 'recommendation_only'
}

function resolveTraining(plan: JobAZPlan): NonNullable<JobAZPlan['training_next']> {
  if (plan.training_next) return plan.training_next
  const route = plan.route_summary.route_title || 'your route'
  return {
    title: `Training for ${route}`,
    type: 'course_type',
    why_recommended: 'Recommended course type for this route — provider not listed yet.',
    action_label: 'View recommendation',
  }
}

/** MVP Career Assistant result — same simple structure for every goal branch. */
export default function CareerCoachPlanHandoff({
  plan,
  isGuest = true,
  aiSummary,
  coachNotes,
}: Props) {
  const [saved, setSaved] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const training = resolveTraining(plan)
  const summary = plan.route_summary
  const routeVisual = resolvePlanRouteVisual(plan.source_path_id, summary.route_title)
  const RouteIcon = routeVisual.Icon
  const work = PLAN_SECTION_STYLES.work
  const trainingStyles = PLAN_SECTION_STYLES.training
  const week = PLAN_SECTION_STYLES.week
  const cv = PLAN_SECTION_STYLES.cv
  const route = PLAN_SECTION_STYLES.route
  const cvTarget = plan.cv_target_role || summary.current_target_role
  const cvBuilderHref = `/cv-builder-v2?role=${encodeURIComponent(cvTarget)}`

  const basedOnAnswers =
    (aiSummary && aiSummary.trim()) ||
    (coachNotes && coachNotes.trim()) ||
    summary.one_sentence_summary ||
    DEFAULT_SUMMARY

  const weekSteps = (
    plan.this_week_plan.length > 0 ? plan.this_week_plan : DEFAULT_WEEK_STEPS
  ).slice(0, 5)

  const workNow = plan.work_now.slice(0, 4)
  const goalPath = plan.source_path_id
  const routeTitle = summary.route_title

  useEffect(() => {
    void trackJazEvent({
      event_type: 'career_goal_selected',
      event_source: 'career_plan_handoff',
      goal_path: goalPath,
      route_title: routeTitle,
      tool_name: 'career_assistant',
    })
    void trackJazEvent({
      event_type: 'career_plan_viewed',
      event_source: 'career_plan_handoff',
      goal_path: goalPath,
      route_title: routeTitle,
      tool_name: 'career_assistant',
      metadata: {
        readiness: summary.readiness_score,
      },
    })
    // Fire once per plan mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalPath, routeTitle])

  const trackPlanCtx = (event_type: string, extra?: Record<string, unknown>) => {
    void trackJazEvent({
      event_type,
      event_source: 'career_plan_handoff',
      goal_path: goalPath,
      route_title: routeTitle,
      tool_name: 'career_assistant',
      metadata: extra,
    })
  }

  const handleSave = () => {
    if (isGuest) return
    savePlanLocally(plan, marketingOptIn, false)
    setSaved(true)
    trackPlanCtx('career_plan_saved', { marketing_opt_in: marketingOptIn })
    if (marketingOptIn) {
      void fetch('/api/email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketing_consent: true,
          job_alerts: true,
          course_alerts: true,
          local_opportunity_alerts: true,
          career_tips: true,
          plan_reminders: true,
          consent_source: 'save_plan',
        }),
      }).catch(() => {})
    }
  }

  const guestAuth = getUkCareerAuthUrls()
  const planRedirect = GUEST_CAREER_DASHBOARD_PATH

  /** Guests leave the assistant (including iframe) for app-level /auth. */
  const goToAuth = (mode: 'signup' | 'login') => {
    savePlanLocally(plan, marketingOptIn, true)
    trackPlanCtx('career_plan_saved', { pending: true, auth_mode: mode })
    const url = mode === 'signup' ? guestAuth.signupUrl : guestAuth.loginUrl
    openAppLevelAuth(url || (mode === 'signup'
      ? `/auth?mode=signup&redirectTo=${encodeURIComponent(planRedirect)}`
      : `/auth?mode=login&redirectTo=${encodeURIComponent(planRedirect)}`))
  }

  const handleOpenMyPlan = () => {
    if (isGuest) {
      goToAuth('login')
      return
    }
    savePlanLocally(plan, marketingOptIn, false)
  }

  const handleContinueJourney = () => {
    if (isGuest) {
      goToAuth('signup')
      return
    }
    savePlanLocally(plan, marketingOptIn, false)
  }

  const partnerApply = isPublishedApply(training)
  const officialOnly = isPublishedOfficial(training)
  const courseTypeOnly = isCourseTypeOnly(training)
  const detailsHref = training.slug
    ? `/courses/${training.slug}`
    : training.official_url || undefined

  return (
    <div className="space-y-5 max-w-xl">
      {/* 1. Short AI summary */}
      <section className="uk-ca-panel rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/30 via-slate-950/60 to-cyan-950/20 px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-violet-300/80 mb-1.5">
          Based on your answers
        </p>
        <p className="text-sm text-slate-200 leading-relaxed">{basedOnAnswers}</p>
      </section>

      {/* 2. Your career plan card */}
      <header
        className={cn(
          'relative overflow-hidden rounded-2xl border px-4 py-4',
          route.border,
          route.panel
        )}
      >
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80',
            routeVisual.accentClass
          )}
        />
        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl border',
                route.iconWrap
              )}
            >
              <RouteIcon className={cn('h-4 w-4', route.icon)} />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                Your career plan
              </p>
              <RouteBadge pathId={plan.source_path_id} routeLabel={summary.route_title} />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-slate-50 tracking-tight">
            {summary.route_title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className={cn('rounded-xl border px-2.5 py-2', route.chip)}>
              <p className="text-[9px] uppercase tracking-wider opacity-70">Current focus</p>
              <p className="text-xs font-medium truncate mt-0.5" title={summary.current_target_role}>
                {summary.current_target_role}
              </p>
            </div>
            <div className={cn('rounded-xl border px-2.5 py-2', route.chip)}>
              <p className="text-[9px] uppercase tracking-wider opacity-70">Next upgrade</p>
              <p className="text-xs font-medium truncate mt-0.5" title={summary.next_upgrade_role}>
                {summary.next_upgrade_role}
              </p>
            </div>
            <div className={cn('rounded-xl border px-2.5 py-2', route.chip)}>
              <p className="text-[9px] uppercase tracking-wider opacity-70">Readiness</p>
              <p className="text-xs font-semibold tabular-nums mt-0.5">{summary.readiness_score}%</p>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Work you can start now */}
      <section>
        <PlanSectionHeader
          accent="work"
          title="Work you can start now"
          subtitle="Realistic roles to apply for first."
          className="mb-2.5"
        />
        {workNow.length === 0 ? (
          <p className="text-sm text-slate-500 rounded-xl border border-slate-700/50 px-3.5 py-3">
            No starter roles listed yet — continue with training and CV steps below.
          </p>
        ) : (
          <ul className="space-y-2">
            {workNow.map((job) => (
              <li
                key={job.title}
                className={cn(
                  'flex items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5',
                  work.border,
                  work.panel
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">{job.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{job.why_it_matches}</p>
                  {job.estimated_pay_range && (
                    <p className="text-[11px] text-emerald-200/80 mt-1 tabular-nums">
                      {job.estimated_pay_range}
                    </p>
                  )}
                </div>
                <Link
                  href={job.href}
                  onClick={() =>
                    trackPlanCtx('job_search_clicked', {
                      job_title: job.title,
                      href: job.href,
                    })
                  }
                  className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
                >
                  View jobs
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. Recommended training */}
      <section>
        <PlanSectionHeader
          accent="training"
          title="Recommended training / courses"
          subtitle="Published courses when available — otherwise course types only."
          className="mb-2.5"
        />
        <div className={cn('rounded-xl border px-3.5 py-3', trainingStyles.border, trainingStyles.panel)}>
          {partnerApply && (
            <span
              className={cn(
                'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold mb-2',
                trainingStyles.chip
              )}
            >
              JobAZ Partner
            </span>
          )}
          {courseTypeOnly && (
            <span className="inline-flex rounded-md border border-slate-600/50 bg-slate-900/50 px-2 py-0.5 text-[10px] font-medium text-slate-400 mb-2">
              Recommended course type
            </span>
          )}
          {training.provider_name ? (
            <p className="text-[11px] text-slate-500 mb-1">{training.provider_name}</p>
          ) : courseTypeOnly ? (
            <p className="text-[11px] text-slate-500 mb-1">Provider not listed yet</p>
          ) : null}
          <p className="text-sm font-semibold text-slate-50">{training.title}</p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{training.why_recommended}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {partnerApply && training.apply_url && (
              <button
                type="button"
                onClick={() => {
                  trackPlanCtx('course_apply_clicked', {
                    course_title: training.title,
                    provider: training.provider_name || null,
                    commercial_status: 'affiliate',
                    referral_url_exists: true,
                  })
                  openCourseApply(
                    {
                      id: training.published_course_id || training.id || training.title,
                      title: training.title,
                      referralUrl: training.apply_url,
                      officialUrl: training.official_url,
                      route: summary.route_title,
                    },
                    'assistant_result',
                    'apply_now'
                  )
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(139,92,246,0.25)]"
              >
                Apply Now
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            {(partnerApply || officialOnly) &&
              detailsHref &&
              (detailsHref.startsWith('http') ? (
                <a
                  href={detailsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-slate-500"
                >
                  View Details
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <Link
                  href={detailsHref}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-slate-500"
                >
                  View Details
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ))}
            {courseTypeOnly && (
              <button
                type="button"
                onClick={() =>
                  trackPlanCtx('course_save_interest_clicked', {
                    course_title: training.title,
                    course_type: training.title,
                    commercial_status: 'coming_soon',
                    referral_url_exists: false,
                    reason: 'missing_affiliate_or_unpublished',
                  })
                }
                className="inline-flex items-center rounded-lg border border-slate-600/70 bg-slate-900/40 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-amber-500/40 hover:text-amber-100"
              >
                Coming soon · Save interest
              </button>
            )}
          </div>
        </div>

        {plan.optional_training.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {plan.optional_training.slice(0, 2).map((item) => (
              <li
                key={item.title}
                className="rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2"
              >
                <p className="text-xs text-slate-200">{item.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {(item.type === 'course_type' || item.type === 'recommendation_only') &&
                    'Provider not listed yet · '}
                  {item.why_useful}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 5. CV action */}
      <section className={cn('rounded-xl border px-3.5 py-3', cv.border, cv.panel)}>
        <PlanSectionHeader accent="cv" title="CV action" className="mb-2" />
        <p className="text-sm text-slate-300 leading-relaxed pl-[38px]">
          Build a UK CV tailored for this route
        </p>
        <p className="text-[11px] text-slate-500 pl-[38px] mt-1">
          Focus role: <span className="text-slate-300">{cvTarget}</span>
        </p>
        <div className="pl-[38px] mt-3">
          <Link
            href={cvBuilderHref}
            onClick={() =>
              trackPlanCtx('cv_builder_opened', {
                cv_target_role: cvTarget,
                from: 'career_plan',
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3.5 py-2 text-xs font-semibold text-slate-100"
          >
            <FileText className="w-3.5 h-3.5" />
            Open CV Builder
          </Link>
        </div>
      </section>

      {/* 6. This week plan */}
      <section className={cn('rounded-xl border px-3.5 py-3', week.border, week.panel)}>
        <PlanSectionHeader
          accent="week"
          title="This week plan"
          subtitle="Up to 5 practical steps."
          className="mb-2.5"
        />
        <ol className="space-y-1.5 pl-1">
          {weekSteps.map((step, i) => (
            <li
              key={`${i}-${step}`}
              className="flex items-start gap-2.5 rounded-lg border border-indigo-500/15 bg-slate-950/30 px-2.5 py-2 text-sm text-slate-300"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[10px] font-semibold text-indigo-200 tabular-nums">
                {i + 1}
              </span>
              <span className="leading-snug pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* 7. Save actions */}
      <section className="space-y-2 pt-1">
        <label className="flex items-start gap-2.5 rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-0.5 rounded border-slate-600"
          />
          <span className="text-xs text-slate-400 leading-snug">
            Send me relevant job, course and career opportunity updates from JobAZ.
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Optional and unchecked by default. Requires a JobAZ account to apply.
            </span>
          </span>
        </label>
        {isGuest ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => goToAuth('signup')}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(124,58,237,0.22)] transition"
            >
              Create a free account to save your career plan
            </button>
            <p className="text-[11px] text-center text-slate-500">
              Sign in to save this plan and continue your journey.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              'inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
              saved
                ? 'bg-emerald-600/90 text-white'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_6px_18px_rgba(124,58,237,0.22)]'
            )}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" /> Saved to My Plan
              </>
            ) : (
              plan.dashboard_handoff.save_label
            )}
          </button>
        )}
        {isGuest ? (
          <button
            type="button"
            onClick={handleOpenMyPlan}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-cyan-500/40 hover:text-cyan-100 transition"
          >
            {plan.dashboard_handoff.open_dashboard_label}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href="/dashboard?tab=plan"
            onClick={handleOpenMyPlan}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-cyan-500/40 hover:text-cyan-100 transition"
          >
            {plan.dashboard_handoff.open_dashboard_label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
        {isGuest && (
          <button
            type="button"
            onClick={handleContinueJourney}
            className="inline-flex w-full items-center justify-center text-xs text-slate-500 hover:text-slate-300 py-1"
          >
            Continue Journey
          </button>
        )}
      </section>
    </div>
  )
}

export { JOBAZ_PLAN_STORAGE_KEY, savePlanLocally }
