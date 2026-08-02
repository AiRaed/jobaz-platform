/**
 * Multi-signal UK career scoring — never decides from one answer alone.
 * Used in Stage 2 (Decide) before the user confirms a target career.
 */

import type { CareerSectorId } from '@/lib/career-engine/shared/careerSectors'
import { labelCareerSector } from '@/lib/career-engine/shared/careerSectors'
import { parseMultiSelectValue } from '@/lib/career-engine/shared/assessmentMultiSelect'
import {
  formatInterestAreasPhrase,
  parseInterestAreas,
  scoreSectorsFromInterests,
  type InterestAreaId,
  type InterestProfileContext,
} from '@/lib/career-engine/shared/interestScoring'

function hasWorkExperience(situation?: string): boolean {
  return situation === 'experienced_known_target' || situation === 'experienced_unknown_target'
}

export type CareerRecommendation = {
  sectorId: CareerSectorId
  label: string
  matchScore: number
  reasons: string[]
}

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

const INTEREST_SECTOR_WEIGHTS: Record<InterestAreaId, Partial<Record<CareerSectorId, number>>> = {
  people: { customer_service: 4, hr_recruitment: 3, retail_sales: 3, hospitality: 3, education_teaching: 2, healthcare: 2, public_sector: 1 },
  technology: { it_technology: 5, science_laboratory: 2, manufacturing_engineering: 2, marketing_digital: 2, creative_design: 1 },
  creative: { creative_design: 5, marketing_digital: 4, education_teaching: 1, hospitality: 1 },
  problem_solving: { it_technology: 3, manufacturing_engineering: 4, construction_trades: 3, science_laboratory: 3, accountant: 2, warehouse_supply_chain: 2 },
  helping_others: { healthcare: 5, education_teaching: 4, customer_service: 3, public_sector: 2 },
  business_management: { office_admin: 4, hr_recruitment: 3, retail_sales: 3, public_sector: 2, marketing_digital: 2, customer_service: 2 },
  hands_on: { construction_trades: 5, warehouse_supply_chain: 4, manufacturing_engineering: 4, transport_logistics: 3, cleaning_facilities: 3, hospitality: 2, security: 2 },
  research_analysis: { science_laboratory: 5, accountant: 3, it_technology: 3, legal_compliance: 2, public_sector: 2, marketing_digital: 1 },
}

const ENVIRONMENT_WEIGHTS: Record<string, Partial<Record<CareerSectorId, number>>> = {
  customer_facing: {
    customer_service: 4,
    retail_sales: 3,
    hospitality: 3,
    healthcare: 2,
    education_teaching: 2,
    hr_recruitment: 1,
  },
  office_desk: {
    office_admin: 4,
    hr_recruitment: 3,
    accountant: 3,
    marketing_digital: 2,
    public_sector: 2,
    legal_compliance: 2,
  },
  physical_active: {
    warehouse_supply_chain: 4,
    construction_trades: 4,
    cleaning_facilities: 3,
    manufacturing_engineering: 3,
    transport_logistics: 3,
    hospitality: 2,
  },
  outdoors: {
    construction_trades: 4,
    transport_logistics: 3,
    security: 2,
    cleaning_facilities: 2,
  },
  quiet_independent: {
    it_technology: 3,
    science_laboratory: 3,
    accountant: 2,
    creative_design: 2,
    office_admin: 1,
  },
  team_based: {
    healthcare: 3,
    hospitality: 3,
    retail_sales: 2,
    customer_service: 2,
    education_teaching: 2,
    warehouse_supply_chain: 2,
  },
}

const MARKET_DEMAND: Partial<Record<CareerSectorId, number>> = {
  retail_sales: 3,
  hospitality: 3,
  customer_service: 3,
  warehouse_supply_chain: 3,
  cleaning_facilities: 3,
  healthcare: 2,
  office_admin: 2,
  security: 2,
  transport_logistics: 2,
  it_technology: 1,
  education_teaching: 0,
  legal_compliance: -1,
}

const EXPERIENCE_TRANSFER: Partial<Record<CareerSectorId, CareerSectorId[]>> = {
  hospitality: ['customer_service', 'retail_sales', 'office_admin', 'hr_recruitment'],
  retail_sales: ['customer_service', 'office_admin', 'marketing_digital', 'hr_recruitment'],
  customer_service: ['office_admin', 'hr_recruitment', 'retail_sales', 'public_sector'],
  warehouse_supply_chain: ['transport_logistics', 'manufacturing_engineering', 'security'],
  healthcare: ['customer_service', 'education_teaching', 'public_sector'],
  it_technology: ['marketing_digital', 'science_laboratory', 'office_admin'],
  construction_trades: ['manufacturing_engineering', 'warehouse_supply_chain', 'security'],
  office_admin: ['hr_recruitment', 'public_sector', 'accountant', 'marketing_digital'],
}

function buildProfileContext(answers: Record<string, string>): InterestProfileContext {
  return {
    educationLevel: answers.education_level,
    englishLevel: answers.english_level,
    ukWorkExperience: answers.uk_work_experience,
    hasWorkExperience: hasWorkExperience(answers.starting_situation),
    studyWilling: answers.study_willing,
    urgency: answers.urgency,
  }
}

function applyEnvironmentScores(
  scores: Record<CareerSectorId, number>,
  environments: string[]
): void {
  for (const env of environments) {
    const weights = ENVIRONMENT_WEIGHTS[env]
    if (!weights) continue
    for (const [sector, weight] of Object.entries(weights) as Array<[CareerSectorId, number]>) {
      scores[sector] += weight
    }
  }
}

function applyExperienceTransfer(
  scores: Record<CareerSectorId, number>,
  currentField?: string
): void {
  if (!currentField || currentField === 'other') return
  const sector = currentField as CareerSectorId
  const related = EXPERIENCE_TRANSFER[sector] ?? []
  for (const target of related) {
    scores[target] += 3
  }
  scores[sector] += 1
}

function applyMarketDemand(scores: Record<CareerSectorId, number>): void {
  for (const [sector, bonus] of Object.entries(MARKET_DEMAND) as Array<[CareerSectorId, number]>) {
    scores[sector] += bonus
  }
}

function englishLabel(level?: string): string {
  return level?.replace(/_/g, ' ') ?? 'intermediate'
}

function educationLabel(level?: string): string {
  const map: Record<string, string> = {
    no_formal: 'no formal qualifications',
    gcse_a_levels: 'GCSE / A Levels',
    vocational: 'vocational qualifications',
    diploma_college: 'college diploma',
    bachelors: "bachelor's degree",
    masters: "master's degree",
    phd: 'doctorate',
  }
  return map[level ?? ''] ?? level ?? 'your education'
}

function interestAlignedSectors(interests: InterestAreaId[]): Set<CareerSectorId> {
  const out = new Set<CareerSectorId>()
  for (const sector of ALL_SECTORS) {
    let interestScore = 0
    for (const interest of interests) {
      interestScore += INTEREST_SECTOR_WEIGHTS[interest]?.[sector] ?? 0
    }
    if (interestScore >= 3) out.add(sector)
  }
  return out
}

function buildReasons(
  sector: CareerSectorId,
  answers: Record<string, string>,
  interests: InterestAreaId[],
  interestAligned: Set<CareerSectorId>
): string[] {
  const reasons: string[] = []

  if (hasWorkExperience(answers.starting_situation)) {
    if (answers.current_field) {
      const related = EXPERIENCE_TRANSFER[answers.current_field as CareerSectorId] ?? []
      if (related.includes(sector)) {
        reasons.push(
          `Existing experience in ${labelCareerSector(answers.current_field)} — transferable skills apply.`
        )
      } else {
        reasons.push(`Existing work experience (${answers.experience_years?.replace(/_/g, ' ') ?? 'some'} years) considered.`)
      }
    }
  } else {
    reasons.push('No prior work experience — scored for realistic UK entry routes.')
  }

  if (interestAligned.has(sector) && interests.length > 0) {
    reasons.push(`Interests: ${formatInterestAreasPhrase(interests)}.`)
  }

  const environments = parseMultiSelectValue(answers.work_environment)
  if (environments.length > 0) {
    if (environments.some((env) => ENVIRONMENT_WEIGHTS[env]?.[sector])) {
      reasons.push('Preferred work environment matches this career family.')
    }
  }

  const english = answers.english_level
  if (english) {
    reasons.push(`English level (${englishLabel(english)}) factored into hiring realism.`)
  }

  if (answers.education_level) {
    if (answers.education_level === 'no_formal') {
      reasons.push('Qualification gap noted — entry routes without degrees prioritised.')
    } else {
      reasons.push(`Education (${educationLabel(answers.education_level)}) supports this pathway.`)
    }
  }

  if (answers.uk_work_experience === 'yes') {
    reasons.push('UK work experience improves employability here.')
  } else {
    reasons.push('No UK experience yet — bridge roles and references factored in.')
  }

  if ((MARKET_DEMAND[sector] ?? 0) >= 2) {
    reasons.push('Strong UK labour-market demand at entry level.')
  } else if ((MARKET_DEMAND[sector] ?? 0) < 0) {
    reasons.push('Higher qualification gap — longer transition expected.')
  }

  if (answers.urgency === 'immediate') {
    reasons.push('Income urgency — fast-hire bridge paths weighted.')
  }

  if (answers.study_willing === 'yes') {
    reasons.push('Willing to retrain — qualification pathways included in plan.')
  } else if (answers.study_willing === 'no') {
    reasons.push('Optional certificates only — no mandatory study route assumed.')
  }

  return reasons.slice(0, 7)
}

function toDisplayPercent(raw: number, maxRaw: number, rank: number): number {
  if (maxRaw <= 0) return 70
  const base = Math.round((raw / maxRaw) * 92)
  return Math.min(95, Math.max(62, base - rank * 2))
}

export function scoreCareerRecommendations(
  answers: Record<string, string>,
  limit = 6
): CareerRecommendation[] {
  const interests = parseInterestAreas(answers.interest_area)
  const ctx = buildProfileContext(answers)
  const scores = scoreSectorsFromInterests(interests, ctx)

  applyEnvironmentScores(scores, parseMultiSelectValue(answers.work_environment))
  applyExperienceTransfer(scores, answers.current_field)
  applyMarketDemand(scores)

  const interestAligned = interestAlignedSectors(interests)

  const ranked = ALL_SECTORS.map((sector) => ({
    sector,
    raw: scores[sector],
  }))
    .filter((row) => row.raw > 0)
    .sort((a, b) => b.raw - a.raw)

  const maxRaw = ranked[0]?.raw ?? 1

  return ranked.slice(0, limit).map((row, rank) => ({
    sectorId: row.sector,
    label: labelCareerSector(row.sector),
    matchScore: toDisplayPercent(row.raw, maxRaw, rank),
    reasons: buildReasons(row.sector, answers, interests, interestAligned),
  }))
}
