/**
 * Next-best-action selection from progress + signals.
 */

import type { JazPlanAction, JazPlanGenerateInput, JazPlanProgressSummary } from './types'

export function buildProgressSummary(
  actions: JazPlanAction[],
  signals: JazPlanGenerateInput['signals']
): JazPlanProgressSummary {
  const required = actions.filter((a) => a.priority === 'required')
  const requiredDone = required.filter((a) => a.status === 'done').length
  const hasCv =
    Boolean(signals?.has_base_cv || signals?.cv_saved) ||
    actions.some((a) => a.category === 'cv' && a.status === 'done')
  const jobsStarted =
    (signals?.saved_jobs_count || 0) > 0 ||
    Boolean(signals?.job_search_clicked) ||
    actions.some((a) => a.category === 'jobs' && a.status !== 'not_started')
  const trainingChecked =
    Boolean(signals?.course_apply_clicked || signals?.course_interest_saved) ||
    actions.some((a) => a.category === 'course' && a.status !== 'not_started')
  const applicationsStarted =
    (signals?.applied_jobs_count || 0) > 0 ||
    actions.some((a) => a.category === 'jobs' && a.status === 'done')
  const followUpPlanned = actions.some(
    (a) => a.category === 'follow_up' && a.status !== 'skipped'
  )

  const percent =
    required.length === 0
      ? 0
      : Math.round((requiredDone / required.length) * 100)

  return {
    cv_ready: hasCv,
    jobs_started: jobsStarted,
    training_checked: trainingChecked,
    applications_started: applicationsStarted,
    follow_up_planned: followUpPlanned,
    required_done: requiredDone,
    required_total: required.length,
    percent_complete: percent,
  }
}

/** Pick the single most useful next step from incomplete actions + signals. */
export function recommendNextBestAction(
  actions: JazPlanAction[],
  signals: JazPlanGenerateInput['signals']
): JazPlanAction | null {
  const open = actions.filter((a) => a.status !== 'done' && a.status !== 'skipped')
  if (open.length === 0) return null

  const hasCv = Boolean(signals?.has_base_cv || signals?.cv_saved)
  const applied = signals?.applied_jobs_count || 0
  const saved = signals?.saved_jobs_count || 0
  const jobClicked = Boolean(signals?.job_search_clicked)
  const courseClicked = Boolean(
    signals?.course_apply_clicked || signals?.course_interest_saved
  )

  const pick = (pred: (a: JazPlanAction) => boolean) => open.find(pred) || null

  if (!hasCv) {
    const cv = pick((a) => a.category === 'cv')
    if (cv) return cv
  }

  if (hasCv && !jobClicked && saved === 0 && applied === 0) {
    const jobs = pick((a) => a.category === 'jobs' && /view jobs|apply/i.test(a.cta_label))
    if (jobs) return jobs
  }

  if ((jobClicked || saved > 0) && applied === 0) {
    const apply = pick((a) => a.category === 'jobs')
    if (apply) return apply
  }

  if (!courseClicked) {
    const course = pick((a) => a.category === 'course')
    if (course) return course
  }

  return (
    pick((a) => a.priority === 'required') ||
    pick((a) => a.priority === 'recommended') ||
    open[0]
  )
}

export function applySignalStatuses(
  actions: JazPlanAction[],
  signals: JazPlanGenerateInput['signals']
): JazPlanAction[] {
  return actions.map((a) => {
    if (a.status === 'done' || a.status === 'skipped') return a
    if (a.category === 'cv' && (signals?.cv_saved || (signals?.has_base_cv && (signals.cv_quality_score || 0) >= 55))) {
      return { ...a, status: 'done' as const }
    }
    if (a.category === 'jobs' && /save/i.test(a.title) && (signals?.saved_jobs_count || 0) >= 3) {
      return { ...a, status: 'done' as const }
    }
    if (a.category === 'jobs' && /apply/i.test(a.title) && (signals?.applied_jobs_count || 0) >= 1) {
      return { ...a, status: 'in_progress' as const }
    }
    if (a.category === 'jobs' && /apply\s*to\s*5/i.test(a.title) && (signals?.applied_jobs_count || 0) >= 5) {
      return { ...a, status: 'done' as const }
    }
    if (
      a.category === 'course' &&
      (signals?.course_apply_clicked || signals?.course_interest_saved)
    ) {
      return { ...a, status: 'in_progress' as const }
    }
    if (a.category === 'cv' && signals?.cv_builder_opened && !signals?.cv_saved) {
      return { ...a, status: 'in_progress' as const }
    }
    return a
  })
}
