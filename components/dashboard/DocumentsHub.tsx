'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Circle,
  FileText,
  Mail,
  PenLine,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo, useEffect } from 'react'
import { useGeneratedCareerPlan } from '@/hooks/useGeneratedCareerPlan'
import {
  calculateCvReadinessForPlan,
} from '@/lib/cv/calculateCvReadinessForPlan'
import type { CvReadinessInput } from '@/lib/cv/calculateCvReadiness'
import { isMeaningfulCv } from '@/lib/cv/isMeaningfulCv'
import { setStoredActiveCvId } from '@/lib/cv/getActiveCv'
import { MAIN_CV_TITLE, TARGETED_CV_COMING_SOON } from '@/lib/cv/cvProfile'
import {
  buildImproveCvHref,
  buildPlanCvGuidance,
} from '@/lib/dashboard/documents/planAwareCvGuidance'
import { SECURITY_PLAN_KEYWORDS } from '@/lib/cv/comparePlanToCv'
import {
  activePlanFromAssessmentBundle,
  getActiveCareerPlanSync,
  type ActiveCareerPlan,
} from '@/lib/cv/getActiveCareerPlan'
import {
  isJobAZPlan,
  type JobAZPlan,
} from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import PlanSectionHeader from '@/components/plan-ui/PlanSectionHeader'
import { PLAN_SECTION_STYLES } from '@/lib/plan-ui/planVisualSystem'

type Props = {
  baseCv: CvReadinessInput
  cvId: string | null
  cvLastUpdated: string | null
  baseCover: unknown | null
  formatDaysAgo: (iso: string | null) => string | null
  onViewCv: () => void
  onViewCover: () => void
  appliedJobsCount?: number
  savedJobsCount?: number
  interviewConfidence?: number
  /** Kept for plan signals; Documents score is always recalculated from baseCv. */
  cvQualityScore?: number
}

function StatusPill({
  label,
  tone,
}: {
  label: string
  tone: 'ready' | 'improve' | 'missing' | 'plan' | 'saved' | 'started'
}) {
  const styles = {
    ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    improve: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    missing: 'border-slate-600/50 bg-slate-800/40 text-slate-400',
    plan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
    saved: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
    started: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  }
  return (
    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium', styles[tone])}>
      {label}
    </span>
  )
}

function coverStatus(baseCover: unknown | null): 'missing' | 'started' | 'available' {
  if (!baseCover) return 'missing'
  const body =
    typeof baseCover === 'object' && baseCover && 'bodyText' in baseCover
      ? String((baseCover as { bodyText?: string }).bodyText || '')
      : ''
  if (body.trim().length < 40) return 'started'
  return 'available'
}

/** Documents hub — Main CV library foundation; does not create duplicate CVs. */
export default function DocumentsHub({
  baseCv,
  cvId,
  cvLastUpdated,
  baseCover,
  formatDaysAgo,
  onViewCv,
  onViewCover,
  appliedJobsCount = 0,
  savedJobsCount = 0,
  interviewConfidence = 0,
  cvQualityScore = 0,
}: Props) {
  const signals = useMemo(
    () => ({
      planItems: [],
      savedJobsCount,
      appliedJobsCount,
      interviewConfidence,
      cvQualityScore,
      hasBaseCv: Boolean(baseCv),
      cvReady: Boolean(baseCv) && cvQualityScore >= 55,
    }),
    [baseCv, savedJobsCount, appliedJobsCount, interviewConfidence, cvQualityScore]
  )

  const { roadmap, bundle, loaded } = useGeneratedCareerPlan(signals)
  const rawPlan = bundle?.aiState?.jobaz_plan
  const jobazPlan: JobAZPlan | null = isJobAZPlan(rawPlan) ? rawPlan : null

  const activePlan = useMemo<ActiveCareerPlan | null>(() => {
    const fromBundle = activePlanFromAssessmentBundle(bundle, 'supabase')
    if (fromBundle) return fromBundle
    if (typeof window !== 'undefined') return getActiveCareerPlanSync()
    return null
  }, [bundle])

  const guidance = useMemo(() => {
    const base = buildPlanCvGuidance(roadmap, jobazPlan)
    if (activePlan?.planTitle) {
      return {
        ...base,
        hasPlan: true,
        planTitle: activePlan.planTitle,
        pathId: activePlan.sourcePathId,
        currentTarget: activePlan.currentTarget || base.currentTarget,
        nextUpgrade: activePlan.nextUpgrade || base.nextUpgrade,
        focusKeywords:
          activePlan.cvFocusKeywords.length > 0
            ? activePlan.cvFocusKeywords
            : base.focusKeywords,
        headline: `CV readiness for ${activePlan.planTitle}`,
      }
    }
    return base
  }, [roadmap, jobazPlan, activePlan])

  const planKeywords = useMemo(() => {
    if (guidance.focusKeywords.length > 0) return guidance.focusKeywords
    if (/security|sia|steward/i.test(guidance.planTitle || '')) return SECURITY_PLAN_KEYWORDS
    return guidance.focusKeywords
  }, [guidance.focusKeywords, guidance.planTitle])

  const readiness = useMemo(
    () =>
      calculateCvReadinessForPlan(baseCv, {
        routeTitle: guidance.planTitle || null,
        pathId: guidance.pathId,
        currentTarget: guidance.currentTarget || null,
        nextUpgrade: guidance.nextUpgrade || null,
        targetRole: guidance.currentTarget || null,
        focusKeywords: planKeywords,
      }),
    [
      baseCv,
      guidance.planTitle,
      guidance.pathId,
      guidance.currentTarget,
      guidance.nextUpgrade,
      planKeywords,
    ]
  )

  const meaningful = isMeaningfulCv(baseCv)
  const needsTailoring =
    readiness.planCvMatch === 'mismatch' || readiness.planCvMatch === 'partial_match'

  useEffect(() => {
    if (cvId) setStoredActiveCvId(cvId)
  }, [cvId])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    console.debug('[documents]', {
      activePlanId: activePlan?.planId || null,
      activePlanTitle: activePlan?.planTitle || null,
      planSource: activePlan?.planSource || 'none',
      cvId,
      cvSource: baseCv ? 'saved' : 'empty',
      score: readiness.score,
      match: readiness.planCvMatch,
    })
  }, [
    activePlan?.planId,
    activePlan?.planTitle,
    activePlan?.planSource,
    cvId,
    baseCv,
    readiness.score,
    readiness.planCvMatch,
  ])

  const improveHref = buildImproveCvHref({
    cvId,
    targetRole: guidance.currentTarget || undefined,
    route: guidance.planTitle || undefined,
    pathId: guidance.pathId,
    focusKeywords: planKeywords,
  })

  const editHref = cvId
    ? `/cv-builder-v2?cvId=${encodeURIComponent(cvId)}`
    : '/cv-builder-v2'
  const buildForPlanHref = guidance.hasPlan
    ? buildImproveCvHref({
        cvId,
        targetRole: guidance.currentTarget || undefined,
        route: guidance.planTitle || undefined,
        pathId: guidance.pathId,
        focusKeywords: planKeywords,
      })
    : '/cv-builder-v2'
  const lastUpdated = formatDaysAgo(cvLastUpdated)
  const cv = PLAN_SECTION_STYLES.cv
  const work = PLAN_SECTION_STYLES.work
  const muted = PLAN_SECTION_STYLES.muted
  const pillTone =
    readiness.planCvMatch === 'no_cv'
      ? 'missing'
      : readiness.planCvMatch === 'empty_cv'
        ? 'started'
        : needsTailoring
          ? 'improve'
          : readiness.planCvMatch === 'good_match'
            ? 'ready'
            : 'saved'
  const letterStatus = coverStatus(baseCover)
  const statusLabel =
    readiness.planCvMatch === 'no_cv'
      ? 'Missing'
      : readiness.planCvMatch === 'empty_cv'
        ? 'Started'
        : needsTailoring
          ? 'Needs tailoring'
          : readiness.planCvMatch === 'good_match'
            ? 'Good match'
            : 'Saved'

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Documents</h2>
        <p className="text-sm text-slate-400 max-w-2xl mt-1">
          {readiness.planMatchMessage}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1) Main CV */}
        <section className={cn('rounded-2xl border p-5', cv.border, cv.panel)}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <PlanSectionHeader accent="cv" title={MAIN_CV_TITLE} />
            <StatusPill label={statusLabel} tone={pillTone} />
          </div>

          {baseCv ? (
            <>
              <p className="text-sm text-slate-300 mb-1">
                {baseCv && 'fullName' in baseCv && baseCv.fullName?.trim()
                  ? baseCv.fullName.trim()
                  : 'Saved CV found'}
              </p>
              {guidance.hasPlan && (
                <p className="text-xs text-slate-500 mb-1">
                  Linked plan:{' '}
                  <span className="text-slate-300">{guidance.planTitle}</span>
                </p>
              )}
              {lastUpdated && (
                <p className="text-xs text-slate-500 mb-3">Last updated: {lastUpdated}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-slate-500">CV readiness for active plan</span>
                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    readiness.score >= 70
                      ? 'text-emerald-300'
                      : readiness.score >= 40
                        ? 'text-amber-300'
                        : 'text-slate-300'
                  )}
                >
                  {readiness.score}%
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{readiness.summaryLine}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onViewCv}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-sky-500/40 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View CV
                </button>
                <Link
                  href={editHref}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white transition"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Edit CV
                </Link>
                <Link
                  href={improveHref}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-3.5 py-2 text-xs font-semibold text-white transition"
                >
                  Tailor for current plan
                </Link>
              </div>
              {TARGETED_CV_COMING_SOON && (
                <button
                  type="button"
                  disabled
                  title="Targeted CVs help you apply for different types of jobs."
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 px-3.5 py-2 text-xs font-medium text-slate-500 cursor-not-allowed"
                >
                  Create targeted CV · Coming soon
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-2">CV readiness 0%</p>
              <p className="text-sm text-slate-400 mb-4">No saved CV yet.</p>
              <Link
                href={buildForPlanHref}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-3.5 py-2 text-xs font-semibold text-white transition"
              >
                {guidance.hasPlan
                  ? `Build CV for this plan`
                  : 'Create CV'}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </section>

        {/* 2) Plan-aware guidance */}
        <section className={cn('rounded-2xl border p-5', work.border, 'bg-slate-950/70')}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <PlanSectionHeader
              accent="work"
              title={loaded && guidance.hasPlan ? `CV focus · ${guidance.planTitle}` : 'CV readiness'}
            />
            {guidance.hasPlan && <StatusPill label="Plan focused" tone="plan" />}
          </div>

          <div className="flex items-end gap-3 mb-2">
            <p
              className={cn(
                'text-3xl font-bold tabular-nums',
                readiness.score >= 70
                  ? 'text-emerald-300'
                  : readiness.score >= 40
                    ? 'text-amber-300'
                    : 'text-slate-200'
              )}
            >
              {readiness.score}%
            </p>
            <p className="text-xs text-slate-500 pb-1">Readiness for active plan</p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-3">{readiness.summaryLine}</p>

          {guidance.hasPlan ? (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/15 px-3 py-2.5 mb-3 space-y-1.5">
              <p className="text-xs text-cyan-100/90 leading-relaxed">
                {guidance.planTitle
                  ? `For ${guidance.planTitle}, your CV should focus on ${guidance.focusKeywords.slice(0, 6).join(', ') || 'role-relevant skills'}.`
                  : guidance.body}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                {guidance.currentTarget && (
                  <span>
                    Current focus:{' '}
                    <span className="text-slate-200">{guidance.currentTarget}</span>
                  </span>
                )}
                {guidance.nextUpgrade && (
                  <span>
                    Next upgrade:{' '}
                    <span className="text-slate-200">{guidance.nextUpgrade}</span>
                  </span>
                )}
              </div>
              {guidance.focusKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {guidance.focusKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-100/90"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            loaded && (
              <p className="text-xs text-slate-500 mb-3">
                Create a career plan to get more specific CV guidance. Guidance never inflates your
                readiness score by itself.
              </p>
            )
          )}

          <ul className="space-y-1.5 mb-4">
            {readiness.checks.map((item) => (
              <li key={item.key} className="flex items-start gap-2 text-xs text-slate-400">
                {item.passed ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle
                    className={cn(
                      'w-3.5 h-3.5 shrink-0 mt-0.5',
                      item.severity === 'critical' ? 'text-slate-600' : 'text-amber-400'
                    )}
                  />
                )}
                <span className={cn(item.passed && 'text-slate-300')}>{item.label}</span>
              </li>
            ))}
          </ul>

          <p className="text-[11px] text-slate-500 mb-3">
            Suggested next:{' '}
            <span className="text-slate-300">{readiness.suggestedNextStep}</span>
          </p>

          {baseCv ? (
            <Link
              href={improveHref}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition"
            >
              {guidance.planTitle
                ? `Tailor this CV for ${guidance.planTitle}`
                : 'Tailor for current plan'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href={buildForPlanHref}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition"
            >
              {guidance.hasPlan ? 'Build CV for this plan' : 'Create CV'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </section>

        {/* 3) Cover Letter */}
        <section className={cn('rounded-2xl border p-5', muted.border, muted.panel)}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <PlanSectionHeader accent="muted" title="Cover Letter" />
            <StatusPill
              label={
                letterStatus === 'available'
                  ? 'Available'
                  : letterStatus === 'started'
                    ? 'Started'
                    : 'Missing'
              }
              tone={
                letterStatus === 'available'
                  ? 'ready'
                  : letterStatus === 'started'
                    ? 'started'
                    : 'missing'
              }
            />
          </div>
          {baseCover ? (
            <>
              <p className="text-sm text-slate-400 mb-3">
                Base cover letter saved.
                {guidance.hasPlan ? ' Use this when applying for your target roles.' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onViewCover}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  View
                </button>
                <Link
                  href="/cover"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 px-3.5 py-2 text-xs font-semibold text-white transition"
                >
                  Edit
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-3">
                Create a cover letter when you are ready to apply.
              </p>
              <Link
                href="/cover"
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-3.5 py-2 text-xs font-semibold text-white transition"
              >
                Create Cover Letter
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </section>

        {/* 4) Writing Review */}
        <section className={cn('rounded-2xl border p-5', muted.border, muted.panel)}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <PlanSectionHeader accent="muted" title="Writing Review" />
            <StatusPill label="Available" tone="ready" />
          </div>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            Review emails, applications, personal statements, and job messages before you send them.
          </p>
          <Link
            href="/proofreading"
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-3.5 py-2 text-xs font-semibold text-white transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Open Writing Review
          </Link>
        </section>
      </div>
    </div>
  )
}
