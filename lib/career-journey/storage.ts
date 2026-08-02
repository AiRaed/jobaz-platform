/**
 * Local persistence for Career Journey Engine (guest + logged-in prototype).
 * Merges UK Career Assistant snapshot with dashboard-derived signals.
 */

import { CA_RESULT_STORAGE_KEY } from '@/lib/uk-career-assistant/guestSession'
import type { UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import {
  buildIntelligenceProfileFromUk,
  buildJourneySnapshot,
} from './engine'
import type {
  CareerIntelligenceProfile,
  CareerJourneySnapshot,
  JourneySignalInput,
} from './types'

export const CAREER_JOURNEY_STORAGE_KEY = 'jobaz_career_journey_v1'

type StoredJourney = {
  profile: CareerIntelligenceProfile | null
  readinessScore: number
  hasCompletedAssessment: boolean
  updatedAt: string
}

export function loadStoredJourney(): StoredJourney | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CAREER_JOURNEY_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredJourney
  } catch {
    return null
  }
}

export function saveStoredJourney(data: StoredJourney): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CAREER_JOURNEY_STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* best-effort */
  }
}

export function saveJourneyFromUkResult(params: {
  result: UkCareerRuleResult
  answers?: Record<string, unknown>
  aiSummary?: string | null
  readinessScore?: number
}): CareerIntelligenceProfile {
  const profile = buildIntelligenceProfileFromUk(params)
  saveStoredJourney({
    profile,
    readinessScore: params.readinessScore ?? 40,
    hasCompletedAssessment: true,
    updatedAt: new Date().toISOString(),
  })
  return profile
}

export function loadUkResultFromGuestSnapshot(): {
  result: UkCareerRuleResult
  answers?: Record<string, unknown>
  aiSummary?: string
} | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CA_RESULT_STORAGE_KEY)
    if (!raw) return null
    const snap = JSON.parse(raw) as {
      result?: { result?: UkCareerRuleResult }
      aiState?: { answers?: Record<string, unknown> }
      aiEnrichment?: { personalisedSummary?: string }
    }
    const result = snap.result?.result
    if (!result?.summary) return null
    return {
      result,
      answers: snap.aiState?.answers,
      aiSummary: snap.aiEnrichment?.personalisedSummary,
    }
  } catch {
    return null
  }
}

/** Hydrate profile from CA snapshot if journey storage empty */
export function hydrateJourneyFromCaSnapshot(): CareerIntelligenceProfile | null {
  const existing = loadStoredJourney()
  if (existing?.profile) return existing.profile

  const ca = loadUkResultFromGuestSnapshot()
  if (!ca) return null

  return saveJourneyFromUkResult({
    result: ca.result,
    answers: ca.answers,
    aiSummary: ca.aiSummary,
  })
}

export function composeCareerJourneySnapshot(
  signals: JourneySignalInput,
  stored?: StoredJourney | null
): CareerJourneySnapshot {
  const journey = stored ?? loadStoredJourney()
  const caExists = Boolean(loadUkResultFromGuestSnapshot())
  let profile = journey?.profile ?? null

  const hasCompletedAssessment =
    signals.hasAssessment || Boolean(journey?.hasCompletedAssessment) || caExists

  if (!profile && hasCompletedAssessment) {
    profile = hydrateJourneyFromCaSnapshot()
  }

  const readinessScore = Math.max(
    signals.readinessScore,
    journey?.readinessScore ?? 0
  )

  const enrichedSignals: JourneySignalInput = {
    ...signals,
    hasAssessment: hasCompletedAssessment,
    readinessScore,
  }

  const derived = buildJourneySnapshot({ signals: enrichedSignals, profile })

  return {
    state: derived.state,
    stateLabel: derived.stateLabel,
    stateDescription: derived.stateDescription,
    readinessScore,
    profile,
    nextActions: derived.nextActions,
    updatedAt: journey?.updatedAt ?? new Date().toISOString(),
    hasCompletedAssessment,
  }
}
