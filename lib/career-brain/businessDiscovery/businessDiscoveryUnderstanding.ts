/**
 * JAZ Business Discovery — understanding and confidence from biz_ answers.
 */

import type { CareerBrainState } from '../types'
import { countAnsweredIdeaFacets, isIdeaEvidenceComplete } from './businessDiscoveryDynamicQuestions'
import type { BusinessDirection, BusinessDiscoveryUnderstanding } from './businessDiscoveryTypes'

export const BIZ_PREFIX = 'biz_'

export function isBusinessDiscoveryAnswerKey(id: string): boolean {
  return id.startsWith(BIZ_PREFIX)
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function str(state: CareerBrainState, ...keys: string[]): string | null {
  for (const key of keys) {
    const raw = answers(state)[key]
    if (raw === undefined || raw === null) continue
    const val = String(raw).trim()
    if (val) return val
  }
  return null
}

function arr(state: CareerBrainState, ...keys: string[]): string[] {
  for (const key of keys) {
    const raw = answers(state)[key]
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
    if (typeof raw === 'string' && raw.trim()) return [raw]
  }
  return []
}

export function inferBusinessDirection(idea: string | null, field: string | null): BusinessDirection {
  const blob = `${idea ?? ''} ${field ?? ''}`.toLowerCase()
  if (/barber|hairdress|salon|barbershop/.test(blob)) return 'barber'
  if (/clean|domestic|commercial clean|janitor/.test(blob)) return 'cleaning'
  if (/software|developer|saas|app|web dev|programmer|it consult/.test(blob)) return 'software'
  if (/driver|courier|delivery|private hire|taxi|uber/.test(blob)) return 'driver'
  if (/cafe|restaurant|food|catering|bakery|takeaway/.test(blob)) return 'food'
  if (/plumb|electric|builder|trade|handyman|carpenter/.test(blob)) return 'trades'
  if (/consult|coach|advis/.test(blob)) return 'consultancy'
  if (/shop|retail|store|boutique/.test(blob)) return 'retail'
  if (/ecommerce|resell|amazon|etsy|online shop/.test(blob)) return 'ecommerce'
  if (/tutor|tuition|teaching|lesson|education coach/.test(blob)) return 'tutoring'
  if (/care|childcare|nursery/.test(blob)) return 'care'
  return 'general'
}

export function getBusinessDiscoveryAnswerIds(state: CareerBrainState): string[] {
  const keys = Object.keys(answers(state)).filter((k) => k.startsWith(BIZ_PREFIX))
  const asked = (state.career_brain_asked ?? []).filter((k) => k.startsWith(BIZ_PREFIX))
  return [...new Set([...keys, ...asked])]
}

export function directionAssetKey(direction: BusinessDirection): string {
  const map: Partial<Record<BusinessDirection, string>> = {
    barber: 'biz_barber_assets',
    cleaning: 'biz_cleaning_assets',
    software: 'biz_software_assets',
    tutoring: 'biz_tutoring_assets',
    food: 'biz_food_assets',
    ecommerce: 'biz_ecommerce_assets',
  }
  return map[direction] ?? 'biz_general_assets'
}

function readSpecialized(state: CareerBrainState): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {}
  const core = new Set([
    'biz_intent',
    'biz_idea',
    'biz_industry_field',
    'biz_skills',
    'biz_experience_level',
    'biz_capital',
    'biz_time',
    'biz_income_expectation',
    'biz_risk_tolerance',
    'biz_network',
    'biz_assets',
    'biz_barber_assets',
    'biz_cleaning_assets',
    'biz_software_assets',
    'biz_tutoring_assets',
    'biz_food_assets',
    'biz_ecommerce_assets',
    'biz_general_assets',
  ])
  for (const [key, val] of Object.entries(answers(state))) {
    if (!key.startsWith(BIZ_PREFIX) || core.has(key)) continue
    if (val === undefined || val === null) continue
    out[key] = val as string | string[]
  }
  return out
}

export function computeBusinessDiscoveryConfidence(u: BusinessDiscoveryUnderstanding): number {
  let score = 0
  if (u.intent) score += 12
  if (u.businessIdea || u.intent === 'no_idea') score += 10
  if (u.industryField) score += 10
  if (u.skills.length) score += Math.min(14, u.skills.length * 3)
  if (u.experienceLevel) score += 12
  if (u.capital) score += 10
  if (u.timePerWeek) score += 8
  if (u.incomeExpectation) score += 8
  if (u.riskTolerance) score += 8
  if (u.hasNetwork) score += 6
  if (u.assets.length) score += Math.min(8, u.assets.length * 2)
  score += Math.min(12, Object.keys(u.specialized).length * 3)
  score += Math.min(10, countAnsweredIdeaFacets(u) * 2)
  return Math.min(100, score)
}

export function buildBusinessDiscoveryUnderstanding(state: CareerBrainState): BusinessDiscoveryUnderstanding {
  const idea = str(state, 'biz_idea', 'cb_business_type', 'cb_self_service')
  const field = str(state, 'biz_industry_field', 'cb_business_type')
  const intent = str(state, 'biz_intent') ?? (idea ? 'has_idea' : null)
  const direction = inferBusinessDirection(idea, field)
  const assetKey = directionAssetKey(direction)

  const understanding: BusinessDiscoveryUnderstanding = {
    routingGoal: str(state, 'cb_user_goal'),
    intent,
    businessIdea: idea,
    industryField: field,
    skills: arr(state, 'biz_skills'),
    experienceLevel: str(state, 'biz_experience_level', 'biz_dyn_experience'),
    capital: str(state, 'biz_capital'),
    timePerWeek: str(state, 'biz_time'),
    incomeExpectation: str(state, 'biz_income_expectation'),
    riskTolerance: str(state, 'biz_risk_tolerance'),
    hasNetwork: str(state, 'biz_network'),
    assets: arr(state, assetKey, 'biz_assets'),
    direction,
    specialized: readSpecialized(state),
    askedIds: getBusinessDiscoveryAnswerIds(state),
    questionCount: getBusinessDiscoveryAnswerIds(state).length,
    confidence: 0,
  }

  understanding.confidence = computeBusinessDiscoveryConfidence(understanding)
  return understanding
}

export function isBusinessDiscoveryQuestioningComplete(state: CareerBrainState): boolean {
  const u = buildBusinessDiscoveryUnderstanding(state)
  if (!u.intent) return false
  if ((u.intent === 'has_idea' || u.intent === 'already_running') && !u.businessIdea) return false
  if (!u.capital || !u.timePerWeek) return false

  const ideaReady =
    u.intent === 'no_idea' || u.intent === 'unsure'
      ? Boolean(u.industryField || u.experienceLevel)
      : isIdeaEvidenceComplete(u)

  if (!ideaReady && u.questionCount < 12) return false
  if (u.confidence >= 75 && u.questionCount >= 6 && ideaReady) return true
  if (u.questionCount >= 10 && u.capital && u.timePerWeek && ideaReady) return true
  if (u.questionCount >= 14) return true
  return false
}

export function isLegacyBusinessComplete(state: CareerBrainState): boolean {
  const a = answers(state)
  const hasLegacy =
    (Boolean(a.cb_business_type) && Boolean(a.cb_business_running) && Boolean(a.cb_business_problem)) ||
    (Boolean(a.cb_self_service) && Boolean(a.cb_self_earning) && Boolean(a.cb_self_need_clients))
  return hasLegacy && !Object.keys(a).some((k) => k.startsWith(BIZ_PREFIX))
}
