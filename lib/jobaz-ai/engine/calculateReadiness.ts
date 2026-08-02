/**
 * Dynamic career readiness — base score + event deltas (rule-based).
 */

import { clampScore } from '@/lib/jobaz-ai/profile/careerStage'
import {
  getStrongestAreaFromSignals,
  getWeakestAreaFromSignals,
} from '@/lib/jobaz-ai/engines/careerAssessment/profileSignals'
import type { AssessmentAnswers } from '@/lib/jobaz-ai/types'
import type { ProfileEngineRow } from './types'

export { clampScore }

/** Baseline readiness from assessment-style profile fields. */
export function calculateBaseReadiness(row: ProfileEngineRow): number {
  const answers = profileRowToAnswers(row)
  if (!answers) {
    return clampScore(row.readiness_score ?? 0)
  }

  let score = 0
  if (answers.cv === 'yes') score += 25
  else if (answers.cv === 'needs_improvement') score += 12
  if (answers.english === 'intermediate' || answers.english === 'good') score += 15
  else if (answers.english === 'basic') score += 8
  if (answers.experience === 'some' || answers.experience === 'strong') score += 15
  else if (answers.experience === 'outside_uk') score += 8
  if (answers.helpNext === 'interviews') score += 10
  if (answers.helpNext === 'find_jobs') score += 5

  const meta = row.progression_meta
  const activityBoost = Math.min(
    (meta?.jobsAppliedCount ?? 0) * 3 +
      (meta?.interviewSessionsCount ?? 0) * 2 +
      (meta?.cvQualityImprovements ?? 0) * 2,
    20
  )

  return clampScore(score + activityBoost)
}

export function applyReadinessDelta(current: number, delta: number): number {
  return clampScore(current + delta)
}

export function deriveReadinessAfterSignal(
  row: ProfileEngineRow,
  readinessDelta: number
): number {
  const current = clampScore(row.readiness_score ?? calculateBaseReadiness(row))
  if (readinessDelta === 0) return current
  return applyReadinessDelta(current, readinessDelta)
}

export function deriveStrongestWeakest(row: ProfileEngineRow, readiness: number): {
  strongest_area: string
  weakest_area: string
} {
  const signals = {
    cvStatus: row.cv_status,
    englishLevel: row.english_level,
    experienceLevel: row.experience_level,
    dominantGoal: row.dominant_goal,
    readinessScore: readiness,
  }

  let strongest = getStrongestAreaFromSignals(signals)
  let weakest = getWeakestAreaFromSignals(signals)

  const interviews = row.progression_meta?.interviewSessionsCount ?? 0
  const applications = row.progression_meta?.jobsAppliedCount ?? 0
  const lessons = row.progression_meta?.lessonsCompleted ?? 0

  if (lessons >= 1) {
    strongest = 'Skill development'
  }

  if (interviews >= 3 && readiness >= 55) {
    strongest = 'Interview confidence'
  }
  if (applications >= 1 && readiness >= 35) {
    strongest = 'Job search activity'
  }
  if (applications >= 5 && readiness >= 60) {
    strongest = 'Job search activity'
  }
  if (
    (row.english_level === 'beginner' || row.english_level === 'basic') &&
    interviews >= 1
  ) {
    weakest = 'English confidence'
  }

  return { strongest_area: strongest, weakest_area: weakest }
}

function profileRowToAnswers(row: ProfileEngineRow): AssessmentAnswers | null {
  if (!row.cv_status && !row.english_level && !row.experience_level) return null
  return {
    situation: 'better_job',
    experience: (row.experience_level as AssessmentAnswers['experience']) ?? 'none',
    english: (row.english_level as AssessmentAnswers['english']) ?? 'basic',
    cv: (row.cv_status as AssessmentAnswers['cv']) ?? 'needs_improvement',
    helpNext: (row.dominant_goal as AssessmentAnswers['helpNext']) ?? 'find_jobs',
  }
}
