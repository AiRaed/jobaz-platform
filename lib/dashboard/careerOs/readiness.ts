/**
 * Transparent Career Readiness — weighted factors, capped at 100.
 * Display-only scoring for My Plan (not Career Coach / resolver logic).
 */

import type { MissionItem } from '@/lib/career-journey/actionPlanTypes'
import type { PathPlanLadder } from './pathPlanLadder'
import type { PlanActivitySignals } from './types'

const INTERVIEW_READY = 55
const APPLY_TARGET = 3
const SAVE_TARGET = 2

export type ReadinessFactor = {
  id: string
  label: string
  weight: number
  /** Points earned toward weight (0..weight) */
  earned: number
  complete: boolean
}

export type CareerReadinessSnapshot = {
  percent: number
  insights: string[]
  completed: string[]
  missing: string[]
  factors: ReadinessFactor[]
}

export type CareerReadinessInput = {
  signals: PlanActivitySignals
  routeLabel?: string | null
  routePathId?: string | null
  targetRole?: string | null
  pathLadder?: PathPlanLadder | null
  missions?: MissionItem[]
  /** Always true when generated from a persisted Coach assessment */
  assessmentCompleted?: boolean
}

function hasPartnerCourse(ladder: PathPlanLadder | null | undefined): boolean {
  if (!ladder) return false
  if (ladder.trainNext.some((t) => Boolean(t.referralUrl?.trim()))) return true
  return ladder.structuredCards.some(
    (c) =>
      Boolean(c.referralUrl?.trim()) ||
      c.commercialStatus === 'affiliate_ready' ||
      /partner/i.test(c.badge ?? '')
  )
}

function hasTrainingPath(ladder: PathPlanLadder | null | undefined): boolean {
  if (!ladder) return false
  return (
    ladder.trainNext.length > 0 ||
    ladder.trainingTitles.length > 0 ||
    Boolean(ladder.structuredCards.length)
  )
}

function jobsProgressPoints(signals: PlanActivitySignals): { earned: number; complete: boolean } {
  const applyShare = Math.min(1, signals.appliedJobsCount / APPLY_TARGET)
  const saveShare = Math.min(1, signals.savedJobsCount / SAVE_TARGET)
  // Weight jobs bucket 15: ~8 from applies, ~7 from saves
  const earned = Math.round(applyShare * 8 + saveShare * 7)
  return {
    earned,
    complete: signals.appliedJobsCount >= APPLY_TARGET && signals.savedJobsCount >= SAVE_TARGET,
  }
}

function cvPoints(signals: PlanActivitySignals): { earned: number; complete: boolean; started: boolean } {
  if (signals.cvReady) return { earned: 15, complete: true, started: true }
  if (signals.hasBaseCv) return { earned: 8, complete: false, started: true }
  return { earned: 0, complete: false, started: false }
}

/**
 * Suggested weights (sum 100):
 * Assessment 15 · Route 10 · Target role 10 · Training path 10 · Partner course 10
 * CV 15 · Jobs 15 · Interview 10 · First job progress 5
 */
export function computeCareerReadiness(input: CareerReadinessInput): CareerReadinessSnapshot {
  const {
    signals,
    routeLabel,
    routePathId,
    targetRole,
    pathLadder,
    missions = [],
    assessmentCompleted = true,
  } = input

  const routeSelected = Boolean(routePathId || routeLabel?.trim())
  const targetSelected = Boolean(targetRole?.trim())
  const trainingFound = hasTrainingPath(pathLadder)
  const partnerAvailable = hasPartnerCourse(pathLadder)
  const cv = cvPoints(signals)
  const jobs = jobsProgressPoints(signals)
  const interviewStarted = signals.interviewConfidence >= INTERVIEW_READY
  const firstJobProgress = signals.appliedJobsCount >= 1

  const factors: ReadinessFactor[] = [
    {
      id: 'assessment',
      label: 'Assessment completed',
      weight: 15,
      earned: assessmentCompleted ? 15 : 0,
      complete: assessmentCompleted,
    },
    {
      id: 'route',
      label: 'Route selected',
      weight: 10,
      earned: routeSelected ? 10 : 0,
      complete: routeSelected,
    },
    {
      id: 'training_path',
      label: 'Training path found',
      weight: 10,
      earned: trainingFound ? 10 : 0,
      complete: trainingFound,
    },
    {
      id: 'partner_course',
      label: 'Partner course available',
      weight: 10,
      earned: partnerAvailable ? 10 : 0,
      complete: partnerAvailable,
    },
    {
      id: 'target_role',
      label: 'Target role selected',
      weight: 10,
      earned: targetSelected ? 10 : 0,
      complete: targetSelected,
    },
    {
      id: 'cv',
      label: cv.complete ? 'CV completed' : cv.started ? 'CV started' : 'CV started/completed',
      weight: 15,
      earned: cv.earned,
      complete: cv.complete,
    },
    {
      id: 'jobs',
      label: jobs.complete ? 'Jobs saved & applied' : 'Jobs saved/applied',
      weight: 15,
      earned: jobs.earned,
      complete: jobs.complete,
    },
    {
      id: 'interview',
      label: 'Interview preparation started',
      weight: 10,
      earned: interviewStarted ? 10 : 0,
      complete: interviewStarted,
    },
    {
      id: 'first_job',
      label: 'First job progress',
      weight: 5,
      earned: firstJobProgress ? 5 : 0,
      complete: firstJobProgress,
    },
  ]

  const percent = Math.min(
    100,
    Math.max(
      0,
      factors.reduce((sum, f) => sum + f.earned, 0)
    )
  )

  const completed = factors
    .filter((f) => f.complete)
    .map((f) => f.label)
    .slice(0, 4)

  // Prefer incomplete mission labels (route-specific), then generic factor gaps
  const missionMissing = missions
    .filter((m) => !m.completed)
    .map((m) => m.label)
    .slice(0, 5)

  const factorMissingLabels: string[] = []
  if (!cv.complete) {
    const cvMission = missions.find((m) => m.id.startsWith('cv') || /cv/i.test(m.label))
    if (!cvMission || cvMission.completed) {
      factorMissingLabels.push('Improve your CV for this route')
    }
  }
  if (!interviewStarted) {
    factorMissingLabels.push('Interview preparation')
  }
  if (!firstJobProgress && !missions.some((m) => /apply/i.test(m.label) && !m.completed)) {
    factorMissingLabels.push('Apply to your first job')
  }

  const missingCombined: string[] = []
  for (const label of [...missionMissing, ...factorMissingLabels]) {
    if (missingCombined.length >= 5) break
    if (missingCombined.some((x) => x.toLowerCase() === label.toLowerCase())) continue
    missingCombined.push(label)
  }

  // If missions empty, fall back to incomplete factor labels
  if (missingCombined.length === 0) {
    for (const f of factors) {
      if (f.complete) continue
      if (missingCombined.length >= 5) break
      missingCombined.push(f.label)
    }
  }

  return {
    percent,
    insights: completed.length > 0 ? completed : ['Keep working your weekly plan'],
    completed,
    missing: missingCombined.slice(0, 5),
    factors,
  }
}
