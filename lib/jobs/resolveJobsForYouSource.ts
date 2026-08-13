/**
 * Central Jobs For You recommendation source resolver.
 *
 * Always fetches the signed-in user's latest active plan + saved CV from
 * Supabase APIs (user-scoped). Never uses another user's data or stale
 * localStorage as the primary source when authenticated.
 */

import { resolveAuthenticatedUserId } from '@/lib/auth/resolveUserId'
import { fetchActivePlanFromServer } from '@/lib/career-assistant/add-to-my-plan/activePlanClient'
import { fetchSavedCv, normalizeToCvData } from '@/lib/cv/getActiveCv'
import {
  fromJobAZPlanForJobs,
  buildJobsForYouQuery,
  toJobsForYouPlanInput,
  type JobsForYouCvInput,
  type JobsForYouSourceType,
} from '@/lib/jobs/buildJobsForYouQuery'
import { clearJobsForYouLocalCache } from '@/lib/jobs/mapPlanOrCvToJobQueries'
import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'

export const JOBS_FOR_YOU_REFRESH_EVENT = 'jobaz-jobs-for-you-refresh'

export type JobsForYouSource = {
  sourceType: JobsForYouSourceType
  primaryQuery: string
  alternativeQueries: string[]
  supportingKeywords: string[]
  matchLabel: string
  forbiddenTerms: string[]
  targetRole?: string
  route?: string
  planId?: string
  cvId?: string
  updatedAt?: string
  planUpdatedAt?: string | null
  cvUpdatedAt?: string | null
  userId: string | null
  /** Raw CV payload for UI state sync (optional) */
  cvRaw?: Record<string, unknown> | null
}

function cvToInput(
  cv: ReturnType<typeof normalizeToCvData> | null,
  extras?: { title?: string | null; targetRole?: string | null }
): JobsForYouCvInput | null {
  if (!cv) return null
  return {
    summary: cv.summary,
    skills: cv.skills,
    experience: (cv.experience || []).map((e) => ({
      jobTitle: e.jobTitle || (e as { title?: string }).title,
      title: (e as { title?: string }).title,
    })),
    education: (cv.education || []).map((e) => ({
      degree: e.degree,
      field: e.details || e.degree,
      school: e.school,
    })),
    projects: (cv.projects || []).map((p) => ({
      title: typeof p === 'string' ? p : p?.name || (p as { title?: string })?.title,
      description:
        typeof p === 'object' && p
          ? String(p.description || '')
          : undefined,
    })),
    professionalTitle: extras?.title || extras?.targetRole || undefined,
    targetRole: extras?.targetRole || undefined,
  }
}

/**
 * Resolve Jobs For You source for the current authenticated user.
 * Pass userId only as a sanity check — auth session always wins.
 */
export async function resolveJobsForYouSource(
  userId?: string | null
): Promise<JobsForYouSource> {
  const authUserId = await resolveAuthenticatedUserId(userId)

  if (!authUserId) {
    return {
      sourceType: 'empty',
      primaryQuery: '',
      alternativeQueries: [],
      supportingKeywords: [],
      matchLabel: '',
      forbiddenTerms: [],
      userId: null,
    }
  }

  // Always fetch latest from user-scoped APIs (no-store / credentials)
  const [activePlanPayload, savedCv] = await Promise.all([
    fetchActivePlanFromServer(),
    fetchSavedCv(null),
  ])

  const jobazPlan: JobAZPlan | null = activePlanPayload?.jobaz_plan ?? null
  const planId = activePlanPayload?.action_plan_id || undefined
  const planUpdatedAt = activePlanPayload?.updated_at ?? null

  // Server JobAZ plan only — do not overlay stale localStorage for logged-in users
  const planInput = jobazPlan
    ? toJobsForYouPlanInput(fromJobAZPlanForJobs(jobazPlan, planId || null), jobazPlan)
    : null

  const cvInput = cvToInput(savedCv?.cv ?? null, {
    title: savedCv?.title,
    targetRole: savedCv?.targetRole,
  })

  const built = buildJobsForYouQuery(cvInput, planInput)

  const targetRole =
    planInput?.currentFocus ||
    planInput?.currentTarget ||
    built.planPrimaryTerms[0] ||
    cvInput?.professionalTitle ||
    undefined

  const route = planInput?.route || planInput?.planTitle || planInput?.pathwayRoute || undefined

  const updatedCandidates = [planUpdatedAt, savedCv?.lastUpdated].filter(Boolean) as string[]
  const updatedAt =
    updatedCandidates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ||
    undefined

  return {
    sourceType: built.sourceType,
    primaryQuery: built.query,
    alternativeQueries: built.alternativeQueries,
    supportingKeywords: built.keywords,
    matchLabel: built.matchLabel,
    forbiddenTerms: built.forbiddenTerms,
    targetRole,
    route,
    planId,
    cvId: savedCv?.cvId || undefined,
    updatedAt,
    planUpdatedAt,
    cvUpdatedAt: savedCv?.lastUpdated ?? null,
    userId: authUserId,
    cvRaw: savedCv?.cv ? (savedCv.cv as unknown as Record<string, unknown>) : null,
  }
}

/** Dispatch after CV or plan save so Jobs For You refetches from Supabase. */
export function notifyJobsForYouRefresh(reason: 'cv' | 'plan' | 'manual' = 'manual'): void {
  if (typeof window === 'undefined') return
  clearJobsForYouLocalCache()
  window.dispatchEvent(
    new CustomEvent(JOBS_FOR_YOU_REFRESH_EVENT, {
      detail: { reason, at: Date.now() },
    })
  )
}
