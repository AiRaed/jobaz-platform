/**
 * Active career assessment loader — single source for Dashboard / Documents / CV Builder.
 *
 * ID mapping (do not confuse these):
 * - authUserId          = supabase.auth.getUser().id  (auth.users.id)
 * - assessmentRowId     = ai_career_assessments.id    (NEVER a user id)
 * - assessmentUserId    = ai_career_assessments.user_id  (must equal authUserId)
 * - profileId           = not used for assessment ownership in this app
 *
 * Caching: in-flight dedupe + short TTL so multiple hooks do not re-hit Supabase.
 * Null results are never cached (avoids empty My Plan after logout → login).
 */

'use client'

import { clearStaleCareerAuthCaches } from '@/lib/auth/clearStaleAuthCache'
import { resolveAuthenticatedUserId } from '@/lib/auth/resolveUserId'
import {
  clearJourneyAndTrainingLocalCache,
  clearSharedCareerLocalCache,
} from '@/lib/career-engine/clearSharedCareerCache'
import {
  hasPendingGuestAssessment,
  loadCaResultSnapshot,
  parseGuestAssessmentSnapshot,
} from '@/lib/uk-career-assistant/guestSession'
import { persistCareerAssistantResult } from '@/lib/uk-career-assistant/persistAssessmentResult'
import { fetchLatestAssessmentForUser } from '@/lib/jobaz-ai/memory/loadUserAssessment'
import { recordCareerPlanLoadDebug } from './debugTrace'
import {
  buildAssessmentBundleFromRecord,
  loadAssessmentBundleFromLocal,
  type AssessmentBundle,
} from './planFromAssessment'
import { buildPathPlanLadder } from './pathPlanLadder'
import { isJobAZPlan } from './mapCareerCoachResultToPlan'

const CACHE_TTL_MS = 45_000

type CacheEntry = {
  userId: string | null
  bundle: AssessmentBundle
  at: number
}

let lastLoadedUserId: string | null = null
let cache: CacheEntry | null = null
let inflight: Promise<AssessmentBundle | null> | null = null
let inflightUserId: string | null | undefined = undefined
let loadGeneration = 0
let lastDebugKey: string | null = null

function planTitleFromBundle(bundle: AssessmentBundle | null): string | null {
  if (!bundle) return null
  const jp = bundle.aiState?.jobaz_plan
  if (isJobAZPlan(jp)) return jp.route_summary.route_title || null
  try {
    return buildPathPlanLadder(bundle)?.routeLabel ?? null
  } catch {
    return null
  }
}

function logActiveAssessmentOnce(args: {
  authUserId: string | null
  assessmentRowId: string | null
  assessmentUserId: string | null
  source: 'supabase' | 'local' | 'none'
  createdAt: string | null
  planTitle: string | null
}): void {
  if (process.env.NODE_ENV !== 'development') return
  if (typeof window === 'undefined') return

  const key = [
    args.authUserId ?? 'guest',
    args.assessmentRowId ?? 'none',
    args.source,
    args.planTitle ?? '',
  ].join('|')

  if (lastDebugKey === key) return
  lastDebugKey = key

  console.debug('[activeAssessment]', {
    authUserId: args.authUserId,
    profileId: null,
    assessmentRowId: args.assessmentRowId,
    assessmentUserId: args.assessmentUserId,
    source: args.source,
    createdAt: args.createdAt,
    updatedAt: null,
    planTitle: args.planTitle,
  })
}

/** Drop cached assessment — call after reset / new Career Assistant save / auth change. */
export function invalidateAssessmentBundleCache(): void {
  cache = null
  inflight = null
  inflightUserId = undefined
  loadGeneration += 1
  lastDebugKey = null
}

export function resetAssessmentLoaderUserCache(): void {
  lastLoadedUserId = null
  invalidateAssessmentBundleCache()
}

async function loadAssessmentBundleUncached(): Promise<AssessmentBundle | null> {
  const authUserId = await resolveAuthenticatedUserId()

  // Only clear stale caches when the auth user actually changes
  if (lastLoadedUserId && authUserId && lastLoadedUserId !== authUserId) {
    if (hasPendingGuestAssessment()) {
      clearJourneyAndTrainingLocalCache()
    } else {
      clearSharedCareerLocalCache()
    }
    invalidateAssessmentBundleCache()
  }

  clearStaleCareerAuthCaches(authUserId)

  const localFound = Boolean(loadCaResultSnapshot())

  if (authUserId) {
    lastLoadedUserId = authUserId

    const row = await fetchLatestAssessmentForUser(authUserId)
    if (row) {
      if (row.user_id && row.user_id !== authUserId) {
        console.error('[assessmentLoader] assessmentUserId !== authUserId', {
          authUserId,
          assessmentUserId: row.user_id,
          assessmentRowId: row.id,
        })
      }

      const bundle = buildAssessmentBundleFromRecord(row)
      if (bundle) {
        const planTitle = planTitleFromBundle(bundle)
        logActiveAssessmentOnce({
          authUserId,
          assessmentRowId: row.id,
          assessmentUserId: row.user_id,
          source: 'supabase',
          createdAt: row.created_at ?? null,
          planTitle,
        })
        recordCareerPlanLoadDebug({
          userId: authUserId,
          localFound,
          supabaseFound: true,
          lastLoad: {
            source: 'supabase',
            assessmentId: row.id,
            at: new Date().toISOString(),
          },
        })
        return bundle
      }
      console.warn(
        '[assessmentLoader] Supabase row could not be normalized — trying local fallback',
        { assessmentRowId: row.id }
      )
    }

    const local = loadAssessmentBundleFromLocal()
    if (local && hasPendingGuestAssessment()) {
      const parsed = parseGuestAssessmentSnapshot()
      if (parsed) {
        const sync = await persistCareerAssistantResult({
          result: parsed.result,
          aiState: parsed.aiState,
          aiPersonalized: parsed.aiPersonalized,
          source: 'dashboard_local_sync',
        })
        if (sync.ok) {
          invalidateAssessmentBundleCache()
          const syncedRow = await fetchLatestAssessmentForUser(authUserId)
          if (syncedRow) {
            const syncedBundle = buildAssessmentBundleFromRecord(syncedRow)
            if (syncedBundle) {
              logActiveAssessmentOnce({
                authUserId,
                assessmentRowId: syncedRow.id,
                assessmentUserId: syncedRow.user_id,
                source: 'supabase',
                createdAt: syncedRow.created_at ?? null,
                planTitle: planTitleFromBundle(syncedBundle),
              })
              recordCareerPlanLoadDebug({
                userId: authUserId,
                localFound,
                supabaseFound: true,
                lastLoad: {
                  source: 'supabase',
                  assessmentId: syncedRow.id,
                  at: new Date().toISOString(),
                },
              })
              return syncedBundle
            }
          }
        }
      }
    }

    // Soft fallback: local Career Assistant snapshot when Supabase has no row yet
    if (local) {
      logActiveAssessmentOnce({
        authUserId,
        assessmentRowId: local.assessmentId ?? null,
        assessmentUserId: local.userId ?? authUserId,
        source: 'local',
        createdAt: local.completedAt ? new Date(local.completedAt).toISOString() : null,
        planTitle: planTitleFromBundle(local),
      })
      recordCareerPlanLoadDebug({
        userId: authUserId,
        localFound: true,
        supabaseFound: Boolean(row),
        lastLoad: {
          source: 'local',
          at: new Date().toISOString(),
        },
      })
      return local
    }

    recordCareerPlanLoadDebug({
      userId: authUserId,
      localFound,
      supabaseFound: Boolean(row),
      lastLoad: {
        source: 'none',
        emptyReason: row
          ? 'Supabase row found but could not be normalized'
          : 'No Supabase assessment for auth user',
        at: new Date().toISOString(),
      },
    })
    logActiveAssessmentOnce({
      authUserId,
      assessmentRowId: null,
      assessmentUserId: null,
      source: 'none',
      createdAt: null,
      planTitle: null,
    })
    return null
  }

  lastLoadedUserId = null
  const local = loadAssessmentBundleFromLocal()
  logActiveAssessmentOnce({
    authUserId: null,
    assessmentRowId: local?.assessmentId ?? null,
    assessmentUserId: local?.userId ?? null,
    source: local ? 'local' : 'none',
    createdAt: local?.completedAt ? new Date(local.completedAt).toISOString() : null,
    planTitle: planTitleFromBundle(local),
  })
  recordCareerPlanLoadDebug({
    userId: null,
    localFound: Boolean(local),
    supabaseFound: false,
    lastLoad: {
      source: local ? 'local' : 'none',
      emptyReason: local ? undefined : 'Guest with no local snapshot',
      at: new Date().toISOString(),
    },
  })
  return local
}

/**
 * Logged-in users: latest assessment by auth.users.id → ai_career_assessments.user_id.
 * Anonymous: local session snapshot only.
 * Dedupes concurrent callers and caches successful bundles briefly.
 * Never caches null — empty results after logout must not block the next login fetch.
 */
export async function resolveAssessmentBundle(options?: {
  force?: boolean
}): Promise<AssessmentBundle | null> {
  const force = options?.force === true
  const authUserId = await resolveAuthenticatedUserId()

  if (
    !force &&
    cache &&
    cache.userId === authUserId &&
    Date.now() - cache.at < CACHE_TTL_MS
  ) {
    return cache.bundle
  }

  if (!force && inflight && inflightUserId === authUserId) {
    return inflight
  }

  const generation = loadGeneration
  const requestUserId = authUserId

  inflightUserId = requestUserId
  inflight = loadAssessmentBundleUncached()
    .then((bundle) => {
      // Drop stale completions (auth changed / invalidate mid-flight)
      if (generation !== loadGeneration) {
        return bundle
      }

      const resolvedUserId = bundle?.userId ?? lastLoadedUserId
      // Only cache successful bundles for the user this request belonged to
      if (bundle && resolvedUserId === requestUserId) {
        cache = { userId: resolvedUserId, bundle, at: Date.now() }
      } else if (!bundle) {
        // Ensure a null miss cannot stick as a positive cache hit
        if (cache?.userId === requestUserId) {
          cache = null
        }
      }
      return bundle
    })
    .finally(() => {
      if (generation === loadGeneration) {
        inflight = null
        inflightUserId = undefined
      }
    })

  return inflight
}
