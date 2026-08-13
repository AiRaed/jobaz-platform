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
  updateStep: (stepKey: string, status: ActionPlanTaskStatus | 'skipped' | 'applied') => Promise<void>
  progress: JazActionPlanResult['progress_summary'] | null
}

function readLocalPlan(goalPath: string): (JazActionPlanResult & { _from_ca?: boolean }) | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LOCAL_PLAN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as JazActionPlanResult & { _goal?: string; _from_ca?: boolean }
    if (parsed._goal && parsed._goal !== goalPath) return null
    if (!parsed.this_week_actions?.length) return null
    return parsed
  } catch {
    return null
  }
}

function writeLocalPlan(plan: JazActionPlanResult, goalPath: string, fromCa = false) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      LOCAL_PLAN_KEY,
      JSON.stringify({ ...plan, _goal: goalPath, ...(fromCa ? { _from_ca: true } : {}) })
    )
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
    work_now_roles: (jobaz.work_now || []).map((w) => ({ title: w.title, href: w.href })),
    recommended_course_types: [
      ...(training
        ? [{ title: training.title, priority: 'primary' }]
        : []),
      ...(jobaz.optional_training || []).slice(0, 2).map((t) => ({
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
    this_week_plan: jobaz.this_week_plan || [],
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
    const workKey = (jobazPlan.work_now || []).map((w) => w.title).join(',')
    const trainKey = [
      jobazPlan.training_next?.title || '',
      ...(jobazPlan.optional_training || []).map((t) => t.title),
    ].join(',')
    const weekKey = (jobazPlan.this_week_plan || []).join('|')
    const caKey = jobazPlan.ca_selection?.selected_at || ''
    const key = `${jobazPlan.source_path_id}|${jobazPlan.route_summary?.route_title || ''}|${workKey}|${trainKey}|${weekKey}|${caKey}|${signals.hasBaseCv}|${signals.appliedJobsCount}|${signals.savedJobsCount}`
    if (key === lastKeyRef.current) return

    let cancelled = false
    generatingRef.current = true
    setLoading(true)

    const run = async () => {
      // Prefer Supabase active plan steps (cross-browser source of truth)
      try {
        const activeRes = await fetch('/api/jaz-plan/active', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })
        if (!cancelled && activeRes.ok) {
          const active = await activeRes.json()
          if (active?.plan?.this_week_actions?.length) {
            const next = active.plan as JazActionPlanResult
            const fromCa =
              active.source === 'career_assistant_selected_items' ||
              Boolean(jobazPlan.ca_selection)
            setPlan(next)
            writeLocalPlan(next, jobazPlan.source_path_id, fromCa)
            lastKeyRef.current = key
            if (fromCa) {
              generatingRef.current = false
              setLoading(false)
              return
            }
          }
        }
      } catch {
        // fall through
      }

      if (cancelled) return

      const cached = readLocalPlan(jobazPlan.source_path_id)
      if (cached) setPlan(cached)

      if (cached?._from_ca && jobazPlan.ca_selection) {
        lastKeyRef.current = key
        generatingRef.current = false
        setLoading(false)
        return
      }

      if (jobazPlan.ca_selection) {
        // CA plan without server steps yet — keep local CA cache; skip generate overwrite
        lastKeyRef.current = key
        generatingRef.current = false
        setLoading(false)
        return
      }

      const input = buildInput(jobazPlan, signals)
      try {
        const res = await fetch('/api/jaz-plan/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (cancelled || !data?.plan) return
        const next = data.plan as JazActionPlanResult
        setPlan(next)
        writeLocalPlan(next, jobazPlan.source_path_id, Boolean(data.reused_active))
        lastKeyRef.current = key
      } catch {
        // keep cached / legacy
      } finally {
        if (!cancelled) {
          generatingRef.current = false
          setLoading(false)
        }
      }
    }

    void run()

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
    async (stepKey: string, status: ActionPlanTaskStatus | 'skipped' | 'applied') => {
      if (!plan) return

      // Local progress (existing First Action Plan store)
      if (status !== 'skipped') {
        const localStatus: ActionPlanTaskStatus =
          status === 'applied' ? 'applied' : status === 'done' ? 'done' : status === 'in_progress' ? 'in_progress' : 'not_started'
        markActionPlanTask(stepKey, localStatus, {
          manualDone: status === 'done',
          force: true,
        })
      } else {
        markActionPlanTask(stepKey, 'not_started', { force: true })
      }

      const nextActions = plan.this_week_actions.map((a) =>
        a.id === stepKey
          ? {
              ...a,
              status:
                status === 'applied'
                  ? ('applied' as const)
                  : status === 'skipped'
                    ? ('skipped' as const)
                    : status,
            }
          : a
      )
      const nextPlan: JazActionPlanResult = {
        ...plan,
        this_week_actions: nextActions,
        next_best_action:
          nextActions.find(
            (a) => a.status !== 'done' && a.status !== 'skipped' && a.status !== 'applied'
          ) ||
          nextActions.find((a) => a.status !== 'done' && a.status !== 'skipped') ||
          null,
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
