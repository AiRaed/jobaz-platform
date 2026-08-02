/**
 * Safe cleanup helpers for Career Plan / CV test data.
 * Never touches unrelated browser storage.
 */

import { CA_RESULT_STORAGE_KEY } from '@/lib/uk-career-assistant/guestSession'
import { CAREER_JOURNEY_STORAGE_KEY } from '@/lib/career-journey/storage'
import { TRAINING_ROUTES_STORAGE_KEY } from '@/lib/career-hub/trainingPlan'
import { CAREER_PLAN_STORAGE_KEY } from '@/lib/career-hub/myPlan'
import { GUEST_DRAFT_KEYS, GUEST_USAGE_KEYS } from '@/lib/guest-tools/constants'
import { ACTIVE_CV_ID_KEY, CV_DRAFT_STORAGE_KEY } from '@/lib/cv/getActiveCv'
import { invalidateAssessmentBundleCache } from '@/lib/dashboard/careerOs/assessmentLoader'

const JOBAZ_PLAN_KEY = 'jobaz_plan_v1'
const ENGINE_RESULT_KEYS = [
  'jobaz_education_path_result_v1',
  'jobaz_experience_path_result_v1',
  'jobaz_extra_income_result_v1',
  'jobaz_start_new_career_result_v1',
  'jobaz_career_engine_result_v1',
]

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/** Clear guest drafts + temporary career assistant keys only. */
export function clearCareerTestData(): string[] {
  if (typeof window === 'undefined') return []
  invalidateAssessmentBundleCache()
  const removed: string[] = []
  const keys = [
    CA_RESULT_STORAGE_KEY,
    JOBAZ_PLAN_KEY,
    GUEST_DRAFT_KEYS.cv,
    GUEST_DRAFT_KEYS.coverLetter,
    GUEST_DRAFT_KEYS.writingReview,
    GUEST_DRAFT_KEYS.interview,
    GUEST_USAGE_KEYS.cv,
    GUEST_USAGE_KEYS.coverLetter,
    GUEST_USAGE_KEYS.writingReview,
    GUEST_USAGE_KEYS.interview,
    ...ENGINE_RESULT_KEYS,
  ]
  for (const key of keys) {
    if (localStorage.getItem(key) != null) {
      safeRemove(key)
      removed.push(key)
    }
  }
  // Session draft-choice flags
  try {
    sessionStorage.removeItem('jobaz_cv_draft_choice')
    sessionStorage.removeItem('jobaz_cv_guest_picker_shown')
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('jobaz-career-plan-generated-updated'))
  window.dispatchEvent(new CustomEvent('jobaz-ai-profile-updated'))
  return removed
}

/** Clear active Career Plan / roadmap / weekly plan local data. Does NOT delete CV. */
export function clearActiveCareerPlanLocal(): string[] {
  if (typeof window === 'undefined') return []
  invalidateAssessmentBundleCache()
  const removed: string[] = []
  const keys = [
    CA_RESULT_STORAGE_KEY,
    JOBAZ_PLAN_KEY,
    CAREER_PLAN_STORAGE_KEY,
    CAREER_JOURNEY_STORAGE_KEY,
    TRAINING_ROUTES_STORAGE_KEY,
    ...ENGINE_RESULT_KEYS,
  ]
  for (const key of keys) {
    if (localStorage.getItem(key) != null) {
      safeRemove(key)
      removed.push(key)
    }
  }
  window.dispatchEvent(new CustomEvent('jobaz-career-plan-generated-updated'))
  window.dispatchEvent(new CustomEvent('jobaz-ai-profile-updated'))
  return removed
}

/** Clear local CV drafts/mirrors only (not account CV until API delete). */
export function clearLocalCvDrafts(): string[] {
  if (typeof window === 'undefined') return []
  const removed: string[] = []
  const keys = [GUEST_DRAFT_KEYS.cv, CV_DRAFT_STORAGE_KEY, ACTIVE_CV_ID_KEY, 'cv-builder-v2-draft']
  for (const key of keys) {
    if (localStorage.getItem(key) != null) {
      safeRemove(key)
      removed.push(key)
    }
  }
  // Also clear user-scoped draft keys if present
  try {
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      if (
        k.includes('jobaz-cv-v2-draft') ||
        k.includes('cv-builder-v2-draft') ||
        k === ACTIVE_CV_ID_KEY
      ) {
        toRemove.push(k)
      }
    }
    for (const k of toRemove) {
      safeRemove(k)
      if (!removed.includes(k)) removed.push(k)
    }
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('jobaz-cv-draft-updated'))
  return removed
}
