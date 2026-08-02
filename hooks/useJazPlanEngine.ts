'use client'

/**
 * Hydrate My Plan First Action Plan from JAZ Plan Engine.
 * Falls back to legacy roadmap missions if generate fails.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MissionItem } from '@/lib/career-journey/actionPlanTypes'
import type { PlanNextAction } from '@/lib/dashboard/careerOs/types'
import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import type { JazActionPlanResult, JazPlanGenerateInput } from '@/lib/jaz-plan-engine'
import {
  jazActionsToMissions,
  jazNextBestToPlanNextAction,
} from '@/lib/jaz-plan-engine/mapToMissions'
import { trackJazEvent } from '@/lib/analytics/jazTrackEvent'
import { markActionPlanTask, type ActionPlanTaskStatus } from '@/lib/dashboard/careerOs/actionPlanProgress'

const LOCAL_PLAN_KEY = 'jobaz_jaz_action_plan_v1'

type Signals = {
  hasBaseCv: boolean
  cvQualityScore: number
  savedJobsCount: number
  appliedJobsCount: number
}

type Result = {
  missions: MissionItem[] | null
  nextAction: PlanNextAction | null
  plan: JazActionPlanResult | null
  actionPlanId: string | null
  loading: boolean
  updateStep: (stepKey: string, status: ActionPlanTaskStatus | 'skipped') => Promise<void>
  progress: JazActionPlanResult['progress_summary'] | null
}

function readLocalPlan(goalPath: string): JazActionPlanResult | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LOCAL_PLAN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as JazActionPlanResult & { _goal?: string }
    if (parsed._goal && parsed._goal !== goalPath) return null
    if (!parsed.this_week_actions?.length) return null
    return parsed
  } catch {
    return null
  }
}

function writeLocalPlan(plan: JazActionPlanResult, goalPath: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify({ ...plan, _goal: goalPath }))
  } catch {
    // ignore
  }
}

function buildInput(jobaz: JobAZPlan, signals: Signals): JazPlanGenerateInput {
  const training = jobaz.training_next
  return {
    career_plan_id: null,
    goal_path: jobaz.source_path_id,
    route_title: jobaz.route_summary.route_title,
    current_focus: jobaz.route_summary.current_target_role,
    next_upgrade: jobaz.route_summary.next_upgrade_role,
    readiness: jobaz.route_summary.readiness_score,
    cv_focus: jobaz.cv_action,
    cv_target_role: jobaz.cv_target_role || jobaz.route_summary.current_target_role,
    work_now_roles: jobaz.work_now.map((w) => ({ title: w.title, href: w.href })),
    recommended_course_types: [
      ...(training
        ? [{ title: training.title, priority: 'primary' }]
        : []),
      ...jobaz.optional_training.slice(0, 2).map((t) => ({
        title: t.title,
        priority: 'optional',
      })),
    ],
    matched_jobaz_courses: training?.apply_url
      ? [
          {
            title: training.title,
            course_id: training.published_course_id || training.id || training.title,
            primary_button: 'Apply Now',
            referral_url: training.apply_url,
            commercial_status: 'affiliate',
          },
        ]
      : [],
    this_week_plan: jobaz.this_week_plan,
    signals: {
      has_base_cv: signals.hasBaseCv,
      cv_quality_score: signals.cvQualityScore,
      saved_jobs_count: signals.savedJobsCount,
      applied_jobs_count: signals.appliedJobsCount,
      cv_saved: signals.hasBaseCv && signals.cvQualityScore >= 40,
    },
  }
}

export function useJazPlanEngine(
  jobazPlan: JobAZPlan | null | undefined,
  signals: Signals,
  legacyNextAction?: PlanNextAction
): Result {
  const [plan, setPlan] = useState<JazActionPlanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const generatingRef = useRef(false)
  const lastKeyRef = useRef('')

  useEffect(() => {
    if (!jobazPlan || generatingRef.current) return
    const key = `${jobazPlan.source_path_id}|${jobazPlan.route_summary.route_title}|${signals.hasBaseCv}|${signals.appliedJobsCount}|${signals.savedJobsCount}`
    if (key === lastKeyRef.current) return

    let cancelled = false
    generatingRef.current = true
    setLoading(true)

    const cached = readLocalPlan(jobazPlan.source_path_id)
    if (cached) setPlan(cached)

    const input = buildInput(jobazPlan, signals)
    void fetch('/api/jaz-plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
      .then(async (res) => {
        const data = await res.json()
        if (cancelled || !res.ok || !data.plan) return
        const next = data.plan as JazActionPlanResult
        setPlan(next)
        writeLocalPlan(next, jobazPlan.source_path_id)
        lastKeyRef.current = key
      })
      .catch(() => {
        // keep cached / legacy
      })
      .finally(() => {
        if (!cancelled) {
          generatingRef.current = false
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      generatingRef.current = false
    }
  }, [
    jobazPlan,
    signals.hasBaseCv,
    signals.cvQualityScore,
    signals.appliedJobsCount,
    signals.savedJobsCount,
  ])

  const updateStep = useCallback(
    async (stepKey: string, status: ActionPlanTaskStatus | 'skipped') => {
      if (!plan) return

      // Local progress (existing First Action Plan store)
      if (status !== 'skipped') {
        markActionPlanTask(stepKey, status, { manualDone: status === 'done', force: true })
      } else {
        markActionPlanTask(stepKey, 'not_started', { force: true })
      }

      const nextActions = plan.this_week_actions.map((a) =>
        a.id === stepKey ? { ...a, status } : a
      )
      const nextPlan: JazActionPlanResult = {
        ...plan,
        this_week_actions: nextActions,
        next_best_action:
          nextActions.find((a) => a.status !== 'done' && a.status !== 'skipped') || null,
      }
      setPlan(nextPlan)
      writeLocalPlan(nextPlan, plan.goal_path)

      const category = plan.this_week_actions.find((a) => a.id === stepKey)?.category
      if (category === 'cv') {
        void trackJazEvent({
          event_type: 'cv_action_clicked',
          event_source: 'my_plan',
          goal_path: plan.goal_path,
          route_title: plan.route_title,
          career_plan_id: plan.action_plan_id,
          metadata: { step_key: stepKey, status },
        })
      } else if (category === 'jobs') {
        void trackJazEvent({
          event_type: 'job_action_clicked',
          event_source: 'my_plan',
          goal_path: plan.goal_path,
          route_title: plan.route_title,
          career_plan_id: plan.action_plan_id,
          metadata: { step_key: stepKey, status },
        })
      } else if (category === 'course') {
        void trackJazEvent({
          event_type: 'course_action_clicked',
          event_source: 'my_plan',
          goal_path: plan.goal_path,
          route_title: plan.route_title,
          career_plan_id: plan.action_plan_id,
          metadata: { step_key: stepKey, status },
        })
      }

      if (plan.action_plan_id) {
        void fetch('/api/jaz-plan/update-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_plan_id: plan.action_plan_id,
            step_key: stepKey,
            status,
            goal_path: plan.goal_path,
            route_title: plan.route_title,
            category,
          }),
        }).catch(() => {})
      } else {
        void trackJazEvent({
          event_type:
            status === 'done'
              ? 'action_step_completed'
              : status === 'skipped'
                ? 'action_step_skipped'
                : 'action_step_clicked',
          event_source: 'my_plan',
          goal_path: plan.goal_path,
          route_title: plan.route_title,
          metadata: { step_key: stepKey, status },
        })
      }
    },
    [plan]
  )

  const missions = plan ? jazActionsToMissions(plan.this_week_actions) : null
  const nextAction = plan
    ? jazNextBestToPlanNextAction(plan.next_best_action, legacyNextAction)
    : null

  return {
    missions,
    nextAction,
    plan,
    actionPlanId: plan?.action_plan_id || null,
    loading,
    updateStep,
    progress: plan?.progress_summary || null,
  }
}
