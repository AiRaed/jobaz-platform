/**
 * Temporary wizard session — sessionStorage only, not permanent DB save.
 */

import { WIE_ASSESSMENT_BLUEPRINT_VERSION } from '../assessment/types'
import type { WorkInEducationAssessmentAnswers } from '../assessment/types'
import { emptyWizardAnswers, type WizardStepId } from './steps'

export const WIZARD_SESSION_KEY = 'jobaz.wie.assessment.wizard.v1'
export const PUBLIC_RESULT_SESSION_KEY = 'jobaz.wie.public.result_v1'
export const PATHWAY_MATCH_CONTEXT_KEY = 'jobaz.wie.pathway_match_ctx.v1'

export type WizardSessionState = {
  version: 1
  blueprint_version: string
  step_id: WizardStepId
  answers: WorkInEducationAssessmentAnswers
  selected_specialism_id: string | null
  updated_at: string
}

export function createEmptyWizardSession(
  step_id: WizardStepId = 'education'
): WizardSessionState {
  return {
    version: 1,
    blueprint_version: WIE_ASSESSMENT_BLUEPRINT_VERSION,
    step_id,
    answers: emptyWizardAnswers(),
    selected_specialism_id: null,
    updated_at: new Date().toISOString(),
  }
}

export function loadWizardSession(
  storageKey: string = WIZARD_SESSION_KEY
): WizardSessionState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WizardSessionState
    if (parsed?.version !== 1 || !parsed.answers || !parsed.step_id) return null
    return parsed
  } catch {
    return null
  }
}

export function saveWizardSession(
  state: WizardSessionState,
  storageKey: string = WIZARD_SESSION_KEY
): void {
  if (typeof window === 'undefined') return
  try {
    const next = { ...state, updated_at: new Date().toISOString() }
    window.sessionStorage.setItem(storageKey, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function clearWizardSession(storageKey: string = WIZARD_SESSION_KEY): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(storageKey)
  } catch {
    // ignore
  }
}

export function savePublicResultHandoff(payload: {
  result_token: string
  result: unknown
}): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(
      PUBLIC_RESULT_SESSION_KEY,
      JSON.stringify({ ...payload, saved_at: new Date().toISOString() })
    )
  } catch {
    // ignore
  }
}

export function loadPublicResultHandoff(): {
  result_token: string
  result: unknown
  saved_at?: string
} | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_RESULT_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearPublicResultHandoff(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(PUBLIC_RESULT_SESSION_KEY)
  } catch {
    // ignore
  }
}

type PathwayMatchCtxStore = Record<
  string,
  {
    role_id: string
    title: string
    field_name: string
    specialism_name: string
    stage_label: string | null
    category: string
    eligibility_label: string
    match_score: number
    lead_in: string
    why: Array<{ kind: 'positive' | 'gap' | 'warning'; text: string }>
    requirements: string[]
    next_step: string | null
    saved_at: string
  }
>

/** Persist assessment match context for a role before navigating to pathway detail. */
export function savePathwayMatchContext(ctx: PathwayMatchCtxStore[string]): void {
  if (typeof window === 'undefined') return
  try {
    const raw = window.sessionStorage.getItem(PATHWAY_MATCH_CONTEXT_KEY)
    const store: PathwayMatchCtxStore = raw ? JSON.parse(raw) : {}
    store[ctx.role_id] = { ...ctx, saved_at: new Date().toISOString() }
    // Cap entries
    const ids = Object.keys(store)
    if (ids.length > 40) {
      const sorted = ids
        .map((id) => ({ id, at: store[id]?.saved_at || '' }))
        .sort((a, b) => a.at.localeCompare(b.at))
      for (const drop of sorted.slice(0, ids.length - 40)) {
        delete store[drop.id]
      }
    }
    window.sessionStorage.setItem(PATHWAY_MATCH_CONTEXT_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}

export function loadPathwayMatchContext(
  roleId: string
): PathwayMatchCtxStore[string] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(PATHWAY_MATCH_CONTEXT_KEY)
    if (!raw) return null
    const store = JSON.parse(raw) as PathwayMatchCtxStore
    return store[roleId] ?? null
  } catch {
    return null
  }
}

/**
 * Fallback: find role card inside the saved public assessment result handoff.
 */
export function findRoleCardInResultHandoff(roleId: string): {
  pathway_id: string
  title: string
  field_name: string
  specialism_name: string
  stage_label: string | null
  category: string
  eligibility_label: string
  match_score: number
  lead_in: string
  why: string[]
  requirements: string[]
  next_step: string | null
} | null {
  const handoff = loadPublicResultHandoff()
  const result = handoff?.result as
    | {
        recommendations?: Record<string, Array<Record<string, unknown>>>
      }
    | undefined
  if (!result?.recommendations) return null
  const buckets = [
    'available_now',
    'realistic_next',
    'future_options',
    'academic_research',
    'requirements_needed',
  ]
  for (const key of buckets) {
    const list = result.recommendations[key]
    if (!Array.isArray(list)) continue
    const hit = list.find((r) => r.pathway_id === roleId)
    if (hit) {
      return {
        pathway_id: String(hit.pathway_id),
        title: String(hit.title ?? ''),
        field_name: String(hit.field_name ?? ''),
        specialism_name: String(hit.specialism_name ?? ''),
        stage_label: (hit.stage_label as string | null) ?? null,
        category: String(hit.category ?? ''),
        eligibility_label: String(hit.eligibility_label ?? ''),
        match_score: typeof hit.match_score === 'number' ? hit.match_score : 0,
        lead_in: String(hit.lead_in ?? ''),
        why: Array.isArray(hit.why) ? hit.why.map(String) : [],
        requirements: Array.isArray(hit.requirements) ? hit.requirements.map(String) : [],
        next_step: (hit.next_step as string | null) ?? null,
      }
    }
  }
  return null
}
