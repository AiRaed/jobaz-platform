'use client'

import { useEffect, useMemo } from 'react'
import { useCareerPlan } from '@/hooks/useCareerPlan'
import { useGeneratedCareerPlan } from '@/hooks/useGeneratedCareerPlan'
import { useJazPlanEngine } from '@/hooks/useJazPlanEngine'
import ManagePlanDataControls from '@/components/dashboard/ManagePlanDataControls'
import CareerPlanHeroSection from './CareerPlanHeroSection'
import CareerPlanEmptyState from './CareerPlanEmptyState'
import ThisWeeksPlanSection from './ThisWeeksPlanSection'
import WorkYouCanStartNowSection from './WorkYouCanStartNowSection'
import TrainingYouNeedNextSection from './TrainingYouNeedNextSection'
import AfterTrainingSection from './AfterTrainingSection'
import RouteInsightSummarySection from './RouteInsightSummarySection'
import SavedRoadmapDrawer from './SavedRoadmapDrawer'
import { isJobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { trackJazEvent } from '@/lib/analytics/jazTrackEvent'

type Props = {
  cvQualityScore: number
  hasBaseCv: boolean
  savedJobsCount: number
  appliedJobsCount: number
  interviewConfidence: number
  onCvCleared?: () => void
  onPlanCleared?: () => void
}

/**
 * My Plan — polished SaaS layout:
 * Hero (full) → [Week + Jobs | Training + After + Context] → Saved (full)
 * First Action Plan driven by JAZ Plan Engine when available.
 */
export default function CareerOsDashboard({
  cvQualityScore,
  hasBaseCv,
  savedJobsCount,
  appliedJobsCount,
  interviewConfidence,
  onCvCleared,
  onPlanCleared,
}: Props) {
  const { items: planItems } = useCareerPlan()

  const signals = useMemo(
    () => ({
      planItems,
      savedJobsCount,
      appliedJobsCount,
      interviewConfidence,
      cvQualityScore,
      hasBaseCv,
      cvReady: hasBaseCv && cvQualityScore >= 55,
    }),
    [planItems, savedJobsCount, appliedJobsCount, interviewConfidence, cvQualityScore, hasBaseCv]
  )

  const { roadmap, hasAssessment, loaded, syncStatus, bundle } = useGeneratedCareerPlan(signals)

  const jobazPlan = useMemo(() => {
    const raw = bundle?.aiState?.jobaz_plan
    return isJobAZPlan(raw) ? raw : null
  }, [bundle])

  const jaz = useJazPlanEngine(jobazPlan, {
    hasBaseCv,
    cvQualityScore,
    savedJobsCount,
    appliedJobsCount,
  }, roadmap?.nextAction)

  useEffect(() => {
    if (!loaded || typeof window === 'undefined') return
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    const t = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 160)
    return () => window.clearTimeout(t)
  }, [loaded, hasAssessment, roadmap])

  useEffect(() => {
    if (!loaded || !hasAssessment) return
    void trackJazEvent({
      event_type: 'my_plan_viewed',
      event_source: 'career_os_dashboard',
      goal_path: jobazPlan?.source_path_id || roadmap?.routePathId || null,
      route_title: jobazPlan?.route_summary.route_title || roadmap?.targetRole || null,
      tool_name: 'my_plan',
    })
  }, [loaded, hasAssessment, jobazPlan, roadmap?.routePathId, roadmap?.targetRole])

  if (!loaded) {
    return (
      <div className="space-y-6 pb-8">
        <p className="text-sm text-slate-400">Loading your career plan...</p>
        <div className="space-y-6 animate-pulse">
          <div className="h-32 rounded-2xl bg-slate-900/50" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="h-72 rounded-2xl bg-slate-900/40" />
            <div className="h-72 rounded-2xl bg-slate-900/40" />
          </div>
        </div>
      </div>
    )
  }

  if (!hasAssessment || !roadmap) {
    return (
      <div className="pb-8 max-w-2xl space-y-6">
        <CareerPlanEmptyState />
        <ManagePlanDataControls
          variant="panel"
          onCvCleared={onCvCleared}
          onPlanCleared={onPlanCleared}
        />
      </div>
    )
  }

  const trainingFallbackTitles = roadmap.requirements
    .filter((r) => r.source === 'recommended_course' || r.type === 'course' || r.type === 'licence')
    .map((r) => r.name)

  const showContext =
    roadmap.routeInsights.whyThisRoute.length > 0 ||
    roadmap.routeInsights.whatYouBring.length > 0 ||
    roadmap.routeInsights.areasToImprove.length > 0

  const missions = jaz.missions?.length ? jaz.missions : roadmap.missions
  const nextAction = jaz.nextAction || roadmap.nextAction

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {syncStatus === 'local_only' && (
        <p className="text-xs text-amber-200/80 rounded-xl border border-amber-500/20 bg-amber-950/20 px-3.5 py-2.5">
          Plan saved locally — refresh to sync to your account.
        </p>
      )}

      <CareerPlanHeroSection roadmap={roadmap} />

      {jaz.progress && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'CV ready', ok: jaz.progress.cv_ready },
            { label: 'Jobs started', ok: jaz.progress.jobs_started },
            { label: 'Training checked', ok: jaz.progress.training_checked },
            { label: 'Applications', ok: jaz.progress.applications_started },
            { label: 'Follow-up', ok: jaz.progress.follow_up_planned },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-slate-800 bg-slate-950/40 px-2.5 py-2 text-center"
            >
              <p className="text-[10px] text-slate-500">{item.label}</p>
              <p className={item.ok ? 'text-xs text-emerald-300 mt-0.5' : 'text-xs text-slate-400 mt-0.5'}>
                {item.ok ? 'Yes' : 'Not yet'}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-6 min-w-0">
          <ThisWeeksPlanSection
            missions={missions}
            nextAction={nextAction}
            ladder={roadmap.pathLadder}
            onStepStatusChange={jaz.plan ? jaz.updateStep : undefined}
            planSource={jaz.plan?.plan_source}
            progressPercent={jaz.progress?.percent_complete}
          />
          <WorkYouCanStartNowSection ladder={roadmap.pathLadder} targetRole={roadmap.targetRole} />
        </div>

        <div className="space-y-6 min-w-0">
          <TrainingYouNeedNextSection
            ladder={roadmap.pathLadder}
            fallbackTitles={trainingFallbackTitles}
          />
          <AfterTrainingSection
            ladder={roadmap.pathLadder}
            suggestedRoles={roadmap.suggestedRoles}
          />
          {showContext && <RouteInsightSummarySection insights={roadmap.routeInsights} />}
        </div>
      </div>

      <SavedRoadmapDrawer ladder={roadmap.pathLadder} />

      <ManagePlanDataControls
        variant="panel"
        onCvCleared={onCvCleared}
        onPlanCleared={onPlanCleared}
      />
    </div>
  )
}
