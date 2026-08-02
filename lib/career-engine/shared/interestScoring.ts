/**
 * Combined career-interest scoring — interests are one signal among many.
 * Never recommends from interests alone; profile realism always applies.
 */

import type { CareerSectorId } from '@/lib/career-engine/shared/careerSectors'
import { parseMultiSelectValue } from '@/lib/career-engine/shared/assessmentMultiSelect'

export const INTEREST_AREA_OPTIONS = [
  { value: 'people', label: 'Working with people' },
  { value: 'technology', label: 'Working with technology' },
  { value: 'creative', label: 'Creative work' },
  { value: 'problem_solving', label: 'Problem solving' },
  { value: 'helping_others', label: 'Helping others' },
  { value: 'business_management', label: 'Business & Management' },
  { value: 'hands_on', label: 'Hands-on practical work' },
  { value: 'research_analysis', label: 'Research & Analysis' },
] as const

export type InterestAreaId = (typeof INTEREST_AREA_OPTIONS)[number]['value']

export const INTEREST_AREA_MAX = 3
export const INTEREST_AREA_HELPER = 'Choose up to 3 interests that best describe you.'

const ALL_SECTORS: CareerSectorId[] = [
  'hospitality',
  'retail_sales',
  'customer_service',
  'office_admin',
  'hr_recruitment',
  'accountant',
  'marketing_digital',
  'it_technology',
  'manufacturing_engineering',
  'construction_trades',
  'healthcare',
  'education_teaching',
  'transport_logistics',
  'warehouse_supply_chain',
  'security',
  'cleaning_facilities',
  'creative_design',
  'legal_compliance',
  'public_sector',
  'science_laboratory',
]

/** Per-interest evidence toward UK career families. */
const INTEREST_SECTOR_WEIGHTS: Record<InterestAreaId, Partial<Record<CareerSectorId, number>>> = {
  people: {
    customer_service: 4,
    hr_recruitment: 3,
    retail_sales: 3,
    hospitality: 3,
    education_teaching: 2,
    healthcare: 2,
    public_sector: 1,
  },
  technology: {
    it_technology: 5,
    science_laboratory: 2,
    manufacturing_engineering: 2,
    marketing_digital: 2,
    creative_design: 1,
  },
  creative: {
    creative_design: 5,
    marketing_digital: 4,
    education_teaching: 1,
    hospitality: 1,
  },
  problem_solving: {
    it_technology: 3,
    manufacturing_engineering: 4,
    construction_trades: 3,
    science_laboratory: 3,
    accountant: 2,
    warehouse_supply_chain: 2,
  },
  helping_others: {
    healthcare: 5,
    education_teaching: 4,
    customer_service: 3,
    public_sector: 2,
  },
  business_management: {
    office_admin: 4,
    hr_recruitment: 3,
    retail_sales: 3,
    public_sector: 2,
    marketing_digital: 2,
    customer_service: 2,
  },
  hands_on: {
    construction_trades: 5,
    warehouse_supply_chain: 4,
    manufacturing_engineering: 4,
    transport_logistics: 3,
    cleaning_facilities: 3,
    hospitality: 2,
    security: 2,
  },
  research_analysis: {
    science_laboratory: 5,
    accountant: 3,
    it_technology: 3,
    legal_compliance: 2,
    public_sector: 2,
    marketing_digital: 1,
  },
}

/** Combined-interest synergies (e.g. tech + problem solving → IT family). */
const INTEREST_SYNERGIES: Array<{
  interests: InterestAreaId[]
  bonus: Partial<Record<CareerSectorId, number>>
}> = [
  {
    interests: ['technology', 'problem_solving', 'research_analysis'],
    bonus: { it_technology: 6, science_laboratory: 2, manufacturing_engineering: 2 },
  },
  {
    interests: ['people', 'helping_others'],
    bonus: { healthcare: 5, education_teaching: 4, customer_service: 4 },
  },
  {
    interests: ['business_management', 'people'],
    bonus: { office_admin: 4, hr_recruitment: 5, retail_sales: 3, customer_service: 3 },
  },
  {
    interests: ['creative', 'technology'],
    bonus: { creative_design: 5, marketing_digital: 5, it_technology: 2 },
  },
  {
    interests: ['hands_on', 'problem_solving'],
    bonus: {
      manufacturing_engineering: 5,
      construction_trades: 4,
      warehouse_supply_chain: 4,
      transport_logistics: 3,
    },
  },
  {
    interests: ['technology', 'problem_solving'],
    bonus: { it_technology: 4, manufacturing_engineering: 2 },
  },
  {
    interests: ['creative', 'problem_solving'],
    bonus: { creative_design: 3, marketing_digital: 3 },
  },
  {
    interests: ['helping_others', 'research_analysis'],
    bonus: { healthcare: 3, science_laboratory: 3, education_teaching: 2 },
  },
]

const INTEREST_LABELS: Record<string, string> = Object.fromEntries(
  INTEREST_AREA_OPTIONS.map((o) => [o.value, o.label])
)

export function parseInterestAreas(raw: string | undefined): InterestAreaId[] {
  const parsed = parseMultiSelectValue(raw) as InterestAreaId[]
  return parsed.filter((id) => id in INTEREST_SECTOR_WEIGHTS).slice(0, INTEREST_AREA_MAX)
}

export function labelInterestAreas(raw: string | undefined): string {
  const ids = parseInterestAreas(raw)
  if (ids.length === 0) return ''
  return ids.map((id) => INTEREST_LABELS[id] ?? id.replace(/_/g, ' ')).join(' · ')
}

export function formatInterestAreasPhrase(interests: InterestAreaId[]): string {
  if (interests.length === 0) return 'your career interests'
  const labels = interests.map((id) => INTEREST_LABELS[id] ?? id.replace(/_/g, ' '))
  if (labels.length === 1) return `your interest in ${labels[0].toLowerCase()}`
  if (labels.length === 2) return `your interests in ${labels[0].toLowerCase()} and ${labels[1].toLowerCase()}`
  return `your interests in ${labels.slice(0, -1).join(', ').toLowerCase()}, and ${labels[labels.length - 1].toLowerCase()}`
}

function emptyScores(): Record<CareerSectorId, number> {
  return Object.fromEntries(ALL_SECTORS.map((id) => [id, 0])) as Record<CareerSectorId, number>
}

function applySynergyBonuses(
  scores: Record<CareerSectorId, number>,
  interests: InterestAreaId[]
): void {
  const set = new Set(interests)
  for (const synergy of INTEREST_SYNERGIES) {
    const matched = synergy.interests.filter((i) => set.has(i)).length
    const required = synergy.interests.length
    if (matched < 2) continue
    const factor = matched >= required ? 1 : matched / required
    for (const [sector, bonus] of Object.entries(synergy.bonus) as Array<[CareerSectorId, number]>) {
      scores[sector] += Math.round(bonus * factor)
    }
  }
}

export type InterestProfileContext = {
  educationLevel?: string
  englishLevel?: string
  ukWorkExperience?: string
  hasWorkExperience?: boolean
  studyWilling?: string
  urgency?: string
  targetField?: string
}

function applyProfileRealism(
  scores: Record<CareerSectorId, number>,
  ctx: InterestProfileContext
): void {
  const english = ctx.englishLevel ?? 'intermediate'
  const education = ctx.educationLevel ?? 'no_formal'
  const hasUk = ctx.ukWorkExperience === 'yes'
  const studyWilling = ctx.studyWilling !== 'no'
  const urgency = ctx.urgency ?? 'balanced'

  if (english === 'beginner' || english === 'basic') {
    scores.it_technology -= 4
    scores.office_admin -= 3
    scores.legal_compliance -= 4
    scores.accountant -= 3
    scores.education_teaching -= 3
    scores.customer_service += 2
    scores.retail_sales += 2
    scores.hospitality += 2
    scores.cleaning_facilities += 2
    scores.warehouse_supply_chain += 2
  } else if (english === 'intermediate') {
    scores.legal_compliance -= 2
    scores.office_admin -= 1
  }

  if (education === 'no_formal') {
    scores.it_technology -= 2
    scores.legal_compliance -= 4
    scores.education_teaching -= 5
    scores.accountant -= 2
    scores.warehouse_supply_chain += 2
    scores.construction_trades += 2
    scores.cleaning_facilities += 2
    scores.hospitality += 1
  } else if (education === 'gcse_a_levels' || education === 'vocational') {
    scores.education_teaching -= 2
  }

  if (!hasUk && !ctx.hasWorkExperience) {
    scores.legal_compliance -= 2
    scores.public_sector -= 1
    scores.retail_sales += 1
    scores.hospitality += 1
  }

  if (!studyWilling) {
    scores.it_technology -= 3
    scores.education_teaching -= 4
    scores.legal_compliance -= 3
    scores.healthcare -= 1
    scores.hospitality += 2
    scores.warehouse_supply_chain += 2
  }

  if (urgency === 'immediate') {
    scores.education_teaching -= 5
    scores.legal_compliance -= 3
    scores.it_technology -= 2
    scores.accountant -= 2
    scores.retail_sales += 3
    scores.hospitality += 3
    scores.warehouse_supply_chain += 2
    scores.cleaning_facilities += 2
  } else if (urgency === 'study_first') {
    scores.it_technology += 1
    scores.healthcare += 1
    scores.education_teaching += 1
  }

  if (ctx.targetField && ctx.targetField !== 'not_sure' && ctx.targetField !== 'other') {
    const target = ctx.targetField as CareerSectorId
    if (ALL_SECTORS.includes(target)) {
      scores[target] += 8
    }
  }
}

export function scoreSectorsFromInterests(
  interests: InterestAreaId[],
  ctx: InterestProfileContext = {}
): Record<CareerSectorId, number> {
  const scores = emptyScores()

  for (const interest of interests) {
    const weights = INTEREST_SECTOR_WEIGHTS[interest]
    if (!weights) continue
    for (const [sector, weight] of Object.entries(weights) as Array<[CareerSectorId, number]>) {
      scores[sector] += weight
    }
  }

  applySynergyBonuses(scores, interests)
  applyProfileRealism(scores, ctx)

  return scores
}

export function resolveTargetSectorFromInterests(
  rawInterests: string | undefined,
  ctx: InterestProfileContext = {}
): CareerSectorId {
  const interests = parseInterestAreas(rawInterests)
  if (interests.length === 0) return 'office_admin'

  const scores = scoreSectorsFromInterests(interests, ctx)
  let best: CareerSectorId = 'office_admin'
  let bestScore = -Infinity

  for (const sector of ALL_SECTORS) {
    if (scores[sector] > bestScore) {
      bestScore = scores[sector]
      best = sector
    }
  }

  return best
}

export function rankSectorsFromInterests(
  rawInterests: string | undefined,
  ctx: InterestProfileContext = {},
  limit = 3
): Array<{ sector: CareerSectorId; score: number }> {
  const interests = parseInterestAreas(rawInterests)
  const scores = scoreSectorsFromInterests(interests, ctx)
  return ALL_SECTORS.map((sector) => ({ sector, score: scores[sector] }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
