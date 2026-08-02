/**
 * Shared profile signals for rule-based areas, plans, and copy.
 */

import type { AssessmentAnswers } from '../../types'

export type ProfileSignals = {
  cvStatus: string | null
  englishLevel: string | null
  experienceLevel: string | null
  dominantGoal: string | null
  readinessScore: number
}

export function normalizeGoal(goal: string | null): string | null {
  if (!goal) return null
  if (goal === 'prepare_interviews') return 'interviews'
  return goal
}

export function signalsFromAnswers(
  answers: AssessmentAnswers,
  readinessScore: number
): ProfileSignals {
  return {
    cvStatus: answers.cv,
    englishLevel: answers.english,
    experienceLevel: answers.experience,
    dominantGoal: answers.helpNext,
    readinessScore,
  }
}

export function getStrongestAreaFromSignals(signals: ProfileSignals): string {
  if (signals.cvStatus === 'yes') return 'CV preparation'
  if (
    signals.englishLevel === 'good' ||
    signals.englishLevel === 'intermediate'
  ) {
    return 'English communication'
  }
  if (
    signals.experienceLevel === 'some' ||
    signals.experienceLevel === 'strong'
  ) {
    return 'Work experience'
  }
  return 'Career motivation'
}

export function getWeakestAreaFromSignals(signals: ProfileSignals): string {
  if (signals.cvStatus === 'no' || signals.cvStatus === 'needs_improvement') {
    return 'CV quality'
  }
  if (
    signals.englishLevel === 'beginner' ||
    signals.englishLevel === 'basic'
  ) {
    return 'English confidence'
  }
  if (
    signals.experienceLevel === 'none' ||
    signals.experienceLevel === 'outside_uk'
  ) {
    return 'UK work experience'
  }
  if (normalizeGoal(signals.dominantGoal) === 'interviews') {
    return 'Interview practice'
  }
  return 'Career direction clarity'
}
