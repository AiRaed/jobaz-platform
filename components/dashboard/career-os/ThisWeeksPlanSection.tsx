'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MissionItem, MissionTaskStatus } from '@/lib/career-journey/actionPlanTypes'
import type { PlanNextAction } from '@/lib/dashboard/careerOs/types'
import type { PathPlanLadder } from '@/lib/dashboard/careerOs/pathPlanLadder'
import PlanSectionHeader from '@/components/plan-ui/PlanSectionHeader'
import { PLAN_SECTION_STYLES } from '@/lib/plan-ui/planVisualSystem'
import {
  ACTION_PLAN_PROGRESS_EVENT,
  ACTION_PLAN_TASK,
  getActionPlanTask,
  listActionPlanTasks,
  markActionPlanTask,
  requiredActionPlanProgress,
  resolveActionPlanTaskStatus,
  type ActionPlanTaskRecord,
  type ActionPlanTaskStatus,
} from '@/lib/dashboard/careerOs/actionPlanProgress'
import { getCourseInterestForMatch, updateCourseInterestStatus } from '@/lib/cv-builder/courseInterest'
import { openCourseApply } from '@/lib/career-hub/marketplace/apply'
import { isSiaDoorTitle, titlesMatchLoose } from '@/lib/dashboard/careerOs/myPlanDisplayFilter'

type Props = {
  missions: MissionItem[]
  nextAction: PlanNextAction
  ladder?: PathPlanLadder | null
  /** When set, step status changes sync to JAZ Plan Engine */
  onStepStatusChange?: (
    stepKey: string,
    status: ActionPlanTaskStatus | 'skipped'
  ) => void | Promise<void>
  planSource?: string | null
  progressPercent?: number | null
}

type DisplayMission = MissionItem & {
  status: MissionTaskStatus
  progressLabel?: string
}

function autoStatusForMission(m: MissionItem): ActionPlanTaskStatus {
  if (m.status === 'done' || m.completed) return 'done'
  if (m.status === 'applied') return 'applied'
  if (m.status === 'in_progress') return 'in_progress'
  if ((m.current ?? 0) > 0) return 'in_progress'
  return 'not_started'
}

function syncCourseInterestIntoStore() {
  const sia = getCourseInterestForMatch(/sia\s*door|door\s*supervisor/i)
  if (sia) {
    if (sia.status === 'booked' || sia.status === 'completed') {
      markActionPlanTask(ACTION_PLAN_TASK.TRAIN_SIA, 'done', {
        note: sia.status === 'booked' ? 'booked' : 'compared',
      })
    } else if (
      sia.status === 'clicked' ||
      sia.status === 'viewed' ||
      sia.status === 'saved' ||
      sia.status === 'in_progress'
    ) {
      markActionPlanTask(ACTION_PLAN_TASK.TRAIN_SIA, 'in_progress', { note: 'viewed' })
    }
  }

  const firstAid = getCourseInterestForMatch(/first\s*aid/i)
  if (
    firstAid &&
    (firstAid.status === 'clicked' ||
      firstAid.status === 'viewed' ||
      firstAid.status === 'saved' ||
      firstAid.status === 'in_progress' ||
      firstAid.status === 'booked' ||
      firstAid.status === 'completed')
  ) {
    const status: ActionPlanTaskStatus =
      firstAid.status === 'booked' || firstAid.status === 'completed' ? 'done' : 'in_progress'
    markActionPlanTask(ACTION_PLAN_TASK.OPTIONAL_FIRST_AID, status)
  }
}

function mergeMissions(
  missions: MissionItem[],
  stored: Record<string, ActionPlanTaskRecord>
): DisplayMission[] {
  return missions.map((m) => {
    const auto = autoStatusForMission(m)
    const status = resolveActionPlanTaskStatus({
      taskId: m.id,
      stored: stored[m.id] ?? getActionPlanTask(m.id),
      auto,
    })
    const completed = status === 'done'
    let progressLabel: string | undefined
    if (typeof m.target === 'number' && m.target > 1) {
      const current = Math.min(m.current ?? 0, m.target)
      progressLabel = `${current}/${m.target}`
    }
    return {
      ...m,
      status,
      completed,
      locked: false,
      progressLabel,
    }
  })
}

/** First Action Plan — launch-safe checklist with light auto + manual tracking. */
export default function ThisWeeksPlanSection({
  missions,
  nextAction,
  ladder,
  onStepStatusChange,
  planSource,
  progressPercent,
}: Props) {
  const [stored, setStored] = useState<Record<string, ActionPlanTaskRecord>>({})
  const [confirmTaskId, setConfirmTaskId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [skipped, setSkipped] = useState<Record<string, boolean>>({})

  const refresh = useCallback(() => {
    syncCourseInterestIntoStore()
    setStored(listActionPlanTasks())
  }, [])

  useEffect(() => {
    refresh()
    setHydrated(true)
    const onUpdate = () => refresh()
    const onCvSaved = () => {
      markActionPlanTask(ACTION_PLAN_TASK.CV, 'done')
      refresh()
    }
    window.addEventListener(ACTION_PLAN_PROGRESS_EVENT, onUpdate)
    window.addEventListener('jobaz-course-interest-updated', onUpdate)
    window.addEventListener('jobaz-cv-saved', onCvSaved)
    return () => {
      window.removeEventListener(ACTION_PLAN_PROGRESS_EVENT, onUpdate)
      window.removeEventListener('jobaz-course-interest-updated', onUpdate)
      window.removeEventListener('jobaz-cv-saved', onCvSaved)
    }
  }, [refresh])

  const steps = useMemo(() => {
    const base = missions.slice(0, 5)
    if (!hydrated) {
      return base.map((m) => ({
        ...m,
        status: (m.status ?? (m.completed ? 'done' : 'not_started')) as MissionTaskStatus,
        locked: false,
        progressLabel:
          typeof m.target === 'number' && m.target > 1
            ? `${Math.min(m.current ?? 0, m.target)}/${m.target}`
            : undefined,
      })) satisfies DisplayMission[]
    }
    return mergeMissions(base, stored)
  }, [missions, stored, hydrated])

  const progress = requiredActionPlanProgress(steps)
  const active =
    steps.find((m) => m.status !== 'done' && !m.optional) ??
    steps.find((m) => m.status !== 'done')

  const week = PLAN_SECTION_STYLES.week

  const siaCard = ladder?.structuredCards.find(
    (c) => isSiaDoorTitle(c.title) || titlesMatchLoose(c.title, 'SIA Door Supervisor')
  )

  const markStarted = (taskId: string) => {
    markActionPlanTask(taskId, 'in_progress')
    void onStepStatusChange?.(taskId, 'in_progress')
    refresh()
  }

  const toggleDone = (mission: DisplayMission) => {
    if (mission.status === 'done') {
      markActionPlanTask(mission.id, 'in_progress', { force: true, manualDone: false })
      void onStepStatusChange?.(mission.id, 'in_progress')
      refresh()
      return
    }
    if (mission.confirmOnDone === 'course_booked') {
      setConfirmTaskId(mission.id)
      return
    }
    markActionPlanTask(mission.id, 'done', { manualDone: true })
    void onStepStatusChange?.(mission.id, 'done')
    setSkipped((prev) => ({ ...prev, [mission.id]: false }))
    refresh()
  }

  const skipStep = (taskId: string) => {
    setSkipped((prev) => ({ ...prev, [taskId]: true }))
    void onStepStatusChange?.(taskId, 'skipped')
    refresh()
  }

  const markApplied = (mission: DisplayMission) => {
    markActionPlanTask(mission.id, 'applied', { force: true })
    void onStepStatusChange?.(mission.id, 'applied')
    setSkipped((prev) => ({ ...prev, [mission.id]: false }))
    refresh()
  }

  const confirmCourseDone = (mode: 'booked' | 'compared') => {
    if (!confirmTaskId) return
    markActionPlanTask(confirmTaskId, 'done', {
      manualDone: true,
      note: mode,
      force: true,
    })
    if (mode === 'booked') {
      updateCourseInterestStatus('SIA Door Supervisor', 'booked')
    }
    setConfirmTaskId(null)
    refresh()
  }

  const handleActionClick = (mission: DisplayMission, e: React.MouseEvent) => {
    markStarted(mission.id)

    // Partner Apply Now for SIA when referral exists
    if (mission.id === ACTION_PLAN_TASK.TRAIN_SIA && siaCard?.referralUrl?.trim()) {
      e.preventDefault()
      openCourseApply(
        {
          id: siaCard.publishedCourseId || siaCard.id || 'sia-door',
          title: siaCard.title || 'SIA Door Supervisor',
          referralUrl: siaCard.referralUrl,
          officialUrl: siaCard.officialUrl,
          providerName: siaCard.publicOfferLabel,
          route: ladder?.routeLabel ?? 'Security extra income',
        },
        'my_plan',
        'apply_now'
      )
      markActionPlanTask(ACTION_PLAN_TASK.TRAIN_SIA, 'in_progress', { note: 'viewed' })
      refresh()
    }
  }

  if (steps.length === 0) return null

  return (
    <section
      id="this-weeks-plan"
      className={cn(
        'jobaz-card rounded-2xl border overflow-hidden',
        week.border,
        'bg-[var(--jaz-surface)] dark:bg-slate-950/85 dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
      )}
    >
      <div
        className={cn(
          'flex items-start justify-between gap-3 border-b border-slate-200 dark:border-indigo-500/15 px-5 py-4',
          week.panel
        )}
      >
        <PlanSectionHeader
          accent="week"
          title="Your First Action Plan"
          subtitle="Start here — complete these steps at your own pace."
        />
        <div className="shrink-0 text-right space-y-1">
          <span
            className={cn('inline-block rounded-lg border px-2 py-1 text-[11px] tabular-nums', week.chip)}
            title="Required steps only"
          >
            {progress.done}/{progress.total} required
            {typeof progressPercent === 'number' ? ` · ${progressPercent}%` : ''}
          </span>
          {process.env.NODE_ENV === 'development' && planSource && (
            <p className="text-[10px] font-mono text-slate-500">{planSource}</p>
          )}
        </div>
      </div>

      {active && (
        <div className="mx-3 mt-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-wider text-cyan-300/80 mb-1">
            Your next best action
          </p>
          <p className="text-sm font-medium text-slate-100">{nextAction.priority || active.label}</p>
          <Link
            href={active.href || nextAction.href}
            onClick={() => markStarted(active.id)}
            className="inline-flex items-center gap-1.5 mt-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white"
          >
            {active.actionLabel || nextAction.buttonLabel}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <ol className="px-3 py-3 space-y-1.5">
        {steps.map((mission, index) => {
          const isActive = active?.id === mission.id
          const isDone = mission.status === 'done'
          const isApplied = mission.status === 'applied'
          const isInProgress = mission.status === 'in_progress'
          const isSkipped = Boolean(skipped[mission.id])
          const isJobStep =
            /apply|search jobs|view jobs|job/i.test(mission.label) ||
            /job-finder|\/jobs/i.test(mission.href || '')

          return (
            <li
              key={mission.id}
              className={cn(
                'flex items-start gap-3 rounded-xl px-3 py-3 transition',
                isDone && 'bg-emerald-50 dark:bg-emerald-950/25',
                isApplied && !isDone && 'bg-sky-50 dark:bg-sky-950/20',
                isSkipped && !isDone && 'opacity-50',
                isActive &&
                  !isDone &&
                  !isSkipped &&
                  'bg-indigo-50 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:ring-indigo-400/35',
                !isDone && !isActive && !isSkipped && 'opacity-90 dark:opacity-80'
              )}
            >
              <button
                type="button"
                onClick={() => toggleDone(mission)}
                aria-label={isDone ? `Mark "${mission.label}" as not done` : `Mark "${mission.label}" as done`}
                className="mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full hover:ring-2 hover:ring-indigo-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
              >
                {isDone ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </span>
                ) : (
                  <Circle
                    className={cn(
                      'w-4 h-4',
                      isInProgress || isActive
                        ? 'text-indigo-600 fill-indigo-500/20 dark:text-indigo-300'
                        : 'text-slate-400 dark:text-slate-600'
                    )}
                  />
                )}
              </button>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] tabular-nums text-slate-500 dark:text-slate-600">
                    {index + 1}
                  </span>
                  {mission.optional && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-500">
                      Optional
                    </span>
                  )}
                  {isInProgress && !isDone && !isApplied && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-700 dark:text-indigo-300/90">
                      In progress
                    </span>
                  )}
                  {isApplied && !isDone && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-sky-700 dark:text-sky-300/90">
                      Applied
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400/80">
                      Done
                    </span>
                  )}
                  {isSkipped && !isDone && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Skipped
                    </span>
                  )}
                  {!isInProgress && !isDone && !isSkipped && !isApplied && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-500">
                      Not started
                    </span>
                  )}
                  {mission.progressLabel && !isDone && (
                    <span className="text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
                      {mission.progressLabel}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    'text-sm leading-snug',
                    isDone && 'text-emerald-800 dark:text-emerald-100/85',
                    isActive && !isDone && 'text-slate-900 font-medium dark:text-slate-50',
                    !isDone && !isActive && 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  {mission.label}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {mission.actionLabel && mission.actionLabel !== 'Optional add-on' && (
                    <Link
                      href={mission.href}
                      onClick={(e) => handleActionClick(mission, e)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
                    >
                      {mission.actionLabel}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {isJobStep && !isDone && !isSkipped && !isApplied && (
                    <button
                      type="button"
                      onClick={() => markApplied(mission)}
                      className="text-[11px] font-medium text-sky-600 hover:text-sky-400 dark:text-sky-300"
                    >
                      Mark as applied
                    </button>
                  )}
                  {!isDone && !isSkipped && (
                    <button
                      type="button"
                      onClick={() => skipStep(mission.id)}
                      className="text-[11px] text-slate-500 hover:text-slate-300"
                    >
                      Skip for now
                    </button>
                  )}
                </div>
                {mission.actionLabel === 'Optional add-on' && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-500">
                    Optional add-on — does not block your plan
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {confirmTaskId && (
        <div className="mx-3 mb-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-3 space-y-2">
          <p className="text-xs text-amber-950 dark:text-amber-100 font-medium">
            Did you book this course?
          </p>
          <p className="text-[11px] text-amber-900/80 dark:text-amber-100/70">
            Apply Now only means you viewed a course — booking needs your confirmation.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => confirmCourseDone('booked')}
              className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-500"
            >
              Yes, booked
            </button>
            <button
              type="button"
              onClick={() => confirmCourseDone('compared')}
              className="rounded-lg border border-slate-400/50 dark:border-slate-600 px-2.5 py-1.5 text-[11px] font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-500/10"
            >
              Not yet, just mark as compared
            </button>
            <button
              type="button"
              onClick={() => setConfirmTaskId(null)}
              className="rounded-lg px-2.5 py-1.5 text-[11px] text-slate-600 dark:text-slate-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {active && (
        <div className="px-5 pb-5 pt-1">
          <Link
            href={active.href || nextAction.href}
            onClick={() => markStarted(active.id)}
            className="jobaz-btn-primary w-full sm:w-auto"
          >
            {active.actionLabel || nextAction.buttonLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  )
}
