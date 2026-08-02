/**
 * JAZ internal analysis — evidence-based reasoning before final output.
 */

import { getGrowCareerBlockers, getGrowCareerCoreSkills, labelGrowCareerExperienceYears } from '../growCareerPath'
import { buildJazUnderstanding, computeJazConfidence } from './jazUnderstanding'
import type { JazProfessionTrack } from './jazTypes'
import { getProfessionTrack } from './jazProfessionProgression'
import type { CareerBrainState } from '../types'

export type CareerConfidenceLabel = 'Low' | 'Medium' | 'High'

export type JazInternalAnalysis = {
  currentState: string
  strengths: string[]
  weaknesses: string[]
  /** Readiness for the NEXT role — not long-term ambition. */
  promotionReadinessScore: number
  /** @deprecated alias */
  readinessScore: number
  promotionReadinessExplanation: string
  /** @deprecated alias */
  readinessExplanation: string
  careerConfidenceScore: number
  careerConfidenceLabel: CareerConfidenceLabel
  progressionOpportunities: string[]
  qualificationGaps: string[]
  realisticNextRole: string
  longTermPath: string
  professionTrack: JazProfessionTrack
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function str(state: CareerBrainState, key: string): string {
  return String(answers(state)[key] ?? '').trim()
}

function arr(state: CareerBrainState, key: string): string[] {
  const raw = answers(state)[key]
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
  return raw ? [String(raw)] : []
}

function hasQualificationBlocker(state: CareerBrainState): boolean {
  const blockers = getGrowCareerBlockers(state).filter((b) => b !== 'not_sure')
  return blockers.includes('qualification') || str(state, 'jaz_edu_qualification') === 'none'
}

function labelQual(track: JazProfessionTrack, state: CareerBrainState): string {
  switch (track) {
    case 'education':
      return str(state, 'jaz_edu_qualification').replace(/_/g, ' ') || 'no formal teaching qualification'
    case 'software':
      return `${str(state, 'jaz_tech_stack').replace(/_/g, ' ') || 'stack'} · ${str(state, 'jaz_tech_architecture').replace(/_/g, ' ') || 'architecture exposure'}`
    case 'healthcare':
      return `${str(state, 'jaz_health_registration').replace(/_/g, ' ')} · ${str(state, 'jaz_health_specialty').replace(/_/g, ' ')}`
    case 'finance':
      return str(state, 'jaz_fin_qualification').replace(/_/g, ' ')
    case 'engineering':
      return str(state, 'jaz_eng_qualification').replace(/_/g, ' ')
    default:
      return str(state, 'jaz_role_responsibilities') || 'role responsibilities captured'
  }
}

function inferStrengths(state: CareerBrainState, track: JazProfessionTrack): string[] {
  const u = buildJazUnderstanding(state)
  const out: string[] = []
  const years = labelGrowCareerExperienceYears(state)
  const jobTitle = u.jobTitle ?? 'your role'

  out.push(`${years} in ${jobTitle}`)

  const skills = getGrowCareerCoreSkills(state)
  if (skills.length) out.push(...skills.slice(0, 2))

  if (track === 'education') {
    const resp = arr(state, 'jaz_edu_responsibilities')
    if (resp.some((r) => /sen|1to1/i.test(r))) out.push('SEN / EHCP classroom experience')
    if (resp.includes('planning')) out.push('Planning or delivering learning activities')
    if (resp.includes('small_group')) out.push('Small group intervention experience')
  }
  if (track === 'software' && str(state, 'jaz_tech_architecture') === 'lead') {
    out.push('Technical design leadership exposure')
  }
  if (track === 'healthcare' && str(state, 'jaz_health_sector') === 'nhs') {
    out.push('NHS experience')
  }

  return [...new Set(out)].slice(0, 5)
}

function inferWeaknesses(state: CareerBrainState, track: JazProfessionTrack): string[] {
  const out: string[] = []
  const blockers = getGrowCareerBlockers(state).filter((b) => b !== 'not_sure')

  const blockerLabels: Record<string, string> = {
    qualification: 'Missing qualification for next level',
    uk_exp: 'Limited UK-specific experience evidence',
    technical_skills: 'Technical depth gap for next role',
    leadership_exp: 'Limited leadership evidence',
    confidence: 'Under-selling achievements',
    limited_opportunities: 'Limited progression in current employer',
    weak_cv: 'CV / LinkedIn not aligned to next level',
  }
  blockers.forEach((b) => {
    if (blockerLabels[b]) out.push(blockerLabels[b]!)
  })

  if (track === 'education') {
    const qual = str(state, 'jaz_edu_qualification')
    if (qual === 'none') out.push('No Level 3 TA qualification yet')
    if (qual !== 'hlta' && qual !== 'qts' && str(state, 'jaz_edu_progression') === 'hlta') {
      out.push('No HLTA qualification yet')
    }
  }
  if (track === 'software' && ['none', 'some'].includes(str(state, 'jaz_tech_architecture'))) {
    out.push('Limited system design / architecture exposure')
  }
  if (track === 'creative' && ['none', 'basic'].includes(str(state, 'jaz_creative_portfolio'))) {
    out.push('Portfolio not yet at next-level standard')
  }

  return [...new Set(out)].slice(0, 5)
}

function experienceBandBonus(years: string | null): number {
  switch (years) {
    case '0_1':
      return 4
    case '1_3':
    case '1_2':
      return 10
    case '3_5':
      return 16
    case '5_10':
    case '6_10':
      return 22
    case '10_plus':
      return 26
    default:
      return 6
  }
}

/** Readiness for the immediate NEXT role — not long-term leadership ambition. */
function computePromotionReadinessScore(
  state: CareerBrainState,
  track: JazProfessionTrack,
  nextRole: string,
  strengths: string[],
  weaknesses: string[]
): number {
  const u = buildJazUnderstanding(state)
  const years = u.yearsExperience ?? str(state, 'cb_grow_years') ?? str(state, 'jaz_years')

  let score = 36
  score += experienceBandBonus(years)
  if (u.jobTitle) score += 4
  score += Math.min(strengths.length * 2, 8)

  if (str(state, 'jaz_study') === 'yes' || str(state, 'cb_grow_study_willing') === 'yes') score += 4

  const qualBlock = hasQualificationBlocker(state)
  if (qualBlock) score -= 15

  const qualWeaknessAlreadyCounted = qualBlock
  if (
    !qualWeaknessAlreadyCounted &&
    weaknesses.some((w) => /qualification|Level 3|HLTA/i.test(w))
  ) {
    score -= 8
  }
  if (getGrowCareerBlockers(state).includes('leadership_exp')) score -= 6
  if (getGrowCareerBlockers(state).includes('weak_cv')) score -= 4

  if (track === 'education') {
    const qual = str(state, 'jaz_edu_qualification')
    const nextLower = nextRole.toLowerCase()
    if (qual === 'level3_ta' && /hlta/i.test(nextRole)) score += 8
    if (qual === 'hlta') score += 12
    if (qual === 'none' && /level 3 teaching assistant/i.test(nextLower)) {
      score += 6
    } else if (
      qual === 'none' &&
      /hlta|teacher|head|leadership|senior.*lead/i.test(nextLower)
    ) {
      score -= 12
    } else if (qual === 'level3_ta' && /teacher|qts|head/i.test(nextLower)) {
      score -= 8
    }
  }

  let maxCap = 85
  let minFloor = 30
  if (years === '0_1') {
    maxCap = 52
    minFloor = 30
  } else if (years === '1_3' || years === '1_2') {
    maxCap = qualBlock ? 68 : 78
    minFloor = 48
  } else if (years === '3_5') {
    maxCap = qualBlock ? 72 : 82
    minFloor = 50
  }

  return Math.max(minFloor, Math.min(maxCap, Math.round(score)))
}

function computeCareerConfidence(state: CareerBrainState): {
  score: number
  label: CareerConfidenceLabel
} {
  const u = buildJazUnderstanding(state)
  const jazConf = computeJazConfidence(u)

  let score = Math.round(jazConf * 0.55)
  score += Math.min(u.questionCount * 3, 18)
  if (Object.keys(u.professionSpecific).length >= 3) score += 10
  else if (Object.keys(u.professionSpecific).length >= 1) score += 5
  if (u.blockers.length) score += 4
  if (u.strengths.length || getGrowCareerCoreSkills(state).length) score += 4

  score = Math.max(35, Math.min(95, score))

  const label: CareerConfidenceLabel = score >= 75 ? 'High' : score >= 55 ? 'Medium' : 'Low'
  return { score, label }
}

function buildPromotionExplanation(
  score: number,
  nextRole: string,
  strengths: string[],
  weaknesses: string[],
  qualBlock: boolean
): string {
  const band =
    score >= 85
      ? 'highly promotion ready for your next step'
      : score >= 70
        ? 'ready for your next step with focused development'
        : score >= 50
          ? 'developing toward your next step'
          : 'building readiness for your next step'

  return [
    `${score}/100 promotion readiness for ${nextRole} — ${band}.`,
    'This score reflects your next realistic role, not long-term leadership ambition.',
    qualBlock ? 'Missing qualifications significantly limit readiness for HLTA and above.' : '',
    strengths.length ? `Strengths: ${strengths.slice(0, 2).join('; ')}.` : '',
    weaknesses.length ? `Gaps: ${weaknesses.slice(0, 2).join('; ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildJazInternalAnalysis(
  state: CareerBrainState,
  progression: { workNowTitle: string; buildNextTitle: string; longTermTitle: string }
): JazInternalAnalysis {
  const track = getProfessionTrack(state)
  const u = buildJazUnderstanding(state)
  const strengths = inferStrengths(state, track)
  const weaknesses = inferWeaknesses(state, track)
  const qualBlock = hasQualificationBlocker(state)
  const promotionReadinessScore = computePromotionReadinessScore(
    state,
    track,
    progression.buildNextTitle,
    strengths,
    weaknesses
  )
  const { score: careerConfidenceScore, label: careerConfidenceLabel } = computeCareerConfidence(state)
  const promotionReadinessExplanation = buildPromotionExplanation(
    promotionReadinessScore,
    progression.buildNextTitle,
    strengths,
    weaknesses,
    qualBlock
  )

  const currentState = [
    `Profession: ${u.jobTitle ?? 'not specified'} (${track.replace('_', ' ')}).`,
    `Qualifications / context: ${labelQual(track, state)}.`,
    `Experience: ${labelGrowCareerExperienceYears(state)}.`,
    `Goal: ${str(state, 'jaz_goal') || str(state, 'cb_grow_goal') || 'progression'}.`,
  ].join(' ')

  return {
    currentState,
    strengths,
    weaknesses,
    promotionReadinessScore,
    readinessScore: promotionReadinessScore,
    promotionReadinessExplanation,
    readinessExplanation: promotionReadinessExplanation,
    careerConfidenceScore,
    careerConfidenceLabel,
    progressionOpportunities: [progression.buildNextTitle, progression.longTermTitle],
    qualificationGaps: weaknesses.filter((w) => /qualification|Level 3|HLTA|registration|portfolio/i.test(w)),
    realisticNextRole: progression.buildNextTitle,
    longTermPath: progression.longTermTitle,
    professionTrack: track,
  }
}
