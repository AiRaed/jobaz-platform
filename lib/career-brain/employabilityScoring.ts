/**
 * Employability Score (0–100) — reflects realistic UK hiring readiness today.
 */

import { getExperienceTier } from './entryClassification'
import {
  fieldClarityEmployabilityBonus,
  specialisationRoleKeywords,
} from './fieldSpecialisation'
import { rolePreferenceScore } from './globalPreferenceEngine'
import { rankPathConfidenceScores, clampEmployabilityScore } from './resultPolish'
import { getCertOpenness, getWorkSpeed } from './speedDevelopmentMode'
import { englishConfidenceRoleScore, normalizeEnglishConfidenceLevel } from './englishConfidenceRules'
import { canGenerateJobPathways, getUkWorkStatus } from './rightToWork'
import type {
  CareerBrainRecommendation,
  CareerBrainState,
  CareerProfile,
  PathConfidenceScore,
} from './types'

function educationBonus(profile: CareerProfile, state?: CareerBrainState): number {
  const a = state?.answers ?? {}
  const firstJob = String(a.cb_first_job_education_level ?? '')
  const global = String(a.cb_global_education_level ?? '')

  if (['phd', 'masters'].includes(firstJob) || ['phd', 'masters'].includes(global)) return 6
  if (firstJob === 'bachelors' || global === 'bachelors') return 5
  if (['diploma_college', 'vocational'].includes(firstJob) || global === 'diploma_college') return 3
  if (firstJob === 'gcse_a_levels' || global === 'gcse_a_levels') return 2
  if (firstJob === 'no_formal') return 0

  switch (profile.educationLevel) {
    case 'postgrad':
      return 6
    case 'degree':
      return 5
    case 'college':
      return 3
    case 'school':
      return 2
    default:
      return 0
  }
}

function englishBonus(level: string | null): number {
  switch (level) {
    case 'fluent':
      return 12
    case 'good':
    case 'comfortable':
      return 9
    case 'intermediate':
    case 'functional':
      return 5
    case 'basic':
      return 1
    default:
      return 4
  }
}

function isUnemployed(state?: CareerBrainState): boolean {
  const a = state?.answers ?? {}
  return a.cb_user_goal === 'unemployed' || a.cb_entry_situation === 'unemployed'
}

function hasMostlyUkExperience(profile: CareerProfile, state?: CareerBrainState): boolean {
  const a = state?.answers ?? {}
  return profile.experienceCountry === 'UK' || a.cb_experience_country === 'mostly_uk'
}

function hasMostlyInternationalExperience(profile: CareerProfile, state?: CareerBrainState): boolean {
  const a = state?.answers ?? {}
  return profile.experienceCountry === 'non-UK' || a.cb_experience_country === 'mostly_international'
}

/** Penalties/rewards when experience and education pull in different directions. */
function fieldEmployabilityAdjustment(profile: CareerProfile, state?: CareerBrainState): number {
  const a = state?.answers ?? {}
  const study = String(a.cb_first_job_study_field ?? profile.studyField ?? '').toLowerCase()
  const exp = String(
    a.cb_work_experience_field ?? profile.workExperienceField ?? a.cb_basic_experience_text ?? ''
  ).toLowerCase()
  const ukExp = hasMostlyUkExperience(profile, state)
  let adj = 0

  const lawStudy = study.includes('law')
  const legalExp = /legal|law|casework|paralegal|admin.*legal/.test(exp)
  const hospitalityExp = /hospitality|bar|hotel|kitchen|waiter|barista|restaurant/.test(exp)
  const retailExp = /retail|shop|store/.test(exp)
  const marketingExp = /marketing|communications|media|content|social/.test(exp)
  const mediaStudy = study.includes('media') || study.includes('communication')
  const marketingStudy = study.includes('marketing') || mediaStudy

  if (lawStudy && !legalExp && (hospitalityExp || retailExp)) {
    adj -= 14
    if (!ukExp) adj -= 6
  } else if (lawStudy && legalExp && ukExp) {
    adj += 8
  } else if (lawStudy && !ukExp) {
    adj -= 8
  }

  if (marketingStudy && marketingExp && ukExp) {
    adj += 14
  } else if (marketingStudy && marketingExp) {
    adj += 8
  } else if (marketingStudy && !marketingExp && (hospitalityExp || retailExp) && !ukExp) {
    adj -= 6
  }

  if (/medicine|nursing|healthcare/.test(study) && !/care|health|nursing|clinical/.test(exp) && !ukExp) {
    adj -= 10
  }

  if (/it_computing|computer|software/.test(study) && !/it|software|helpdesk|tech|digital/.test(exp) && ukExp) {
    adj -= 4
  } else if (/it_computing|computer|software/.test(study) && /it|software|helpdesk|tech/.test(exp) && ukExp) {
    adj += 8
  }

  const priority = String(a.cb_career_direction_priority ?? '')
  if (priority === 'fast_employment') adj += 3
  if (priority === 'both' && marketingStudy && marketingExp) adj += 4

  adj += fieldClarityEmployabilityBonus(state)

  return adj
}

function competitiveFieldCap(study: string): number {
  if (/law|medicine|nursing|architecture/.test(study)) return 78
  if (/engineering|software|it_computing/.test(study)) return 82
  return 92
}

export function computeEmployabilityScore(
  profile: CareerProfile,
  state?: CareerBrainState
): number {
  if (state && !canGenerateJobPathways(state)) return 0

  const a = state?.answers ?? {}
  const study = String(a.cb_first_job_study_field ?? profile.studyField ?? '').toLowerCase()
  let score = 30

  score += englishBonus(profile.englishLevel)
  score += educationBonus(profile, state)

  const years = profile.yearsOfExperience ?? 0
  const ukExp = hasMostlyUkExperience(profile, state)
  const intlExp = hasMostlyInternationalExperience(profile, state)

  if (ukExp && years >= 5) score += 16
  else if (ukExp && years >= 3) score += 12
  else if (ukExp && years >= 1) score += 8
  else if (ukExp) score += 4
  else if (intlExp && years >= 3) score += 3
  else if (intlExp && years >= 1) score += 1
  else if (intlExp) score -= 6

  if (isUnemployed(state)) score -= 8

  score += fieldEmployabilityAdjustment(profile, state)

  const rtw = getUkWorkStatus(state ?? { answers: {} })
  if (rtw === 'uk_citizen' || rtw === 'settled_status') score += 6
  else if (
    rtw === 'pre_settled_status' ||
    rtw === 'graduate_visa' ||
    rtw === 'skilled_worker_visa'
  ) {
    score += 4
  } else if (rtw === 'student_visa') score += 2
  else if (rtw === 'refugee_humanitarian') score += 4
  else if (rtw === 'other_not_sure') score -= 8

  if (a.cb_uk_driving_licence === 'yes' || profile.licences.length > 0) score += 3

  const cert = getCertOpenness(state)
  if (cert === 'yes') score += 2
  else if (cert === 'direct_only') score -= 4

  if (profile.constraints.includes('no-customer-facing')) score += 1

  if (state && getExperienceTier(state) === 'no_experience' && years === 0) score -= 6
  if (profile.englishLevel === 'basic') score -= 6
  if (getWorkSpeed(state) === 'urgent') score += 2

  const cap = competitiveFieldCap(study)
  score = Math.min(score, cap)

  return clampEmployabilityScore(Math.round(score), profile, state)
}

function roleFitScore(
  title: string,
  track: CareerBrainRecommendation['track'],
  profile: CareerProfile,
  state?: CareerBrainState
): { score: number; reason: string } {
  const t = title.toLowerCase()
  let score = 72
  const reasons: string[] = []

  const eng = normalizeEnglishConfidenceLevel(profile.englishLevel)
  if (eng) {
    score += Math.round(englishConfidenceRoleScore(title, track, profile) / 4)
  } else if (/admin|office|reception|customer service|sales|call centre|legal|finance|coordinator|manager/i.test(t)) {
    const raw = profile.englishLevel ?? ''
    if (raw === 'basic') {
      score -= 35
      reasons.push('English level')
    } else if (raw === 'intermediate' || raw === 'functional') {
      score -= 10
    }
  }
  if (/customer|retail|barista|hospitality|sales|reception|call/i.test(t)) {
    if (profile.constraints.includes('no-customer-facing')) {
      score -= 40
      reasons.push('User preference')
    }
  }
  if (/warehouse|operative|picker|packer|cleaner|kitchen|porter|driver|delivery|hgv|logistics/i.test(t)) {
    if (profile.constraints.includes('non-physical')) {
      score -= 25
      reasons.push('Physical preference')
    } else {
      score += 8
    }
  }
  if (/driver|delivery|courier|taxi|private hire|multi-drop|van driver/i.test(t)) {
    if (profile.licences.some((l) => /driving/i.test(l))) {
      score += 15
    } else {
      score -= 30
      reasons.push('No UK driving licence')
    }
    const hasCar = String(state?.answers?.cb_has_car ?? '') === 'yes'
    if (/delivery|courier|multi-drop|taxi|private hire/i.test(t) && !hasCar) {
      score -= 20
      reasons.push('No car access')
    }
  }
  if (/forklift|hgv|sia|cscs|care certificate|construction|security licence/i.test(t)) {
    const cert = getCertOpenness(state)
    if (cert === 'direct_only') {
      score -= 35
      reasons.push('Training declined')
    }
  }
  if (track === 'work_now' && getWorkSpeed(state) === 'urgent') {
    if (/warehouse|delivery|retail|cleaner|kitchen|driver|operative/i.test(t)) score += 10
    if (/paralegal|developer|analyst|manager|coordinator/i.test(t)) score -= 15
  }
  if (track === 'long_term') score += profile.yearsOfExperience && profile.yearsOfExperience >= 2 ? 5 : -5

  const specKw = specialisationRoleKeywords(state)
  if (specKw?.test(t)) {
    score += 12
    reasons.push('Field specialisation fit')
  } else if (specKw && track !== 'backup_income') {
    score -= 8
  }

  score = Math.max(5, Math.min(98, Math.round(score)))
  return { score, reason: reasons[0] ?? 'Profile fit' }
}

export function computePathConfidenceScores(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): PathConfidenceScore[] {
  const base = recs
    .filter((r) => r.track !== 'backup_income')
    .map((r, index) => {
      const { score, reason } = roleFitScore(r.title, r.track, profile, state)
      const pref =
        r.track === 'work_now' ? rolePreferenceScore(r.title, r.track, profile, state) : 0
      const blended =
        r.track === 'work_now'
          ? Math.round(score * 0.5 + pref * 0.5)
          : score
      return {
        title: r.title,
        track: r.track,
        score: blended - (r.track === 'work_now' ? index : 0),
        reason,
      }
    })

  return rankPathConfidenceScores(recs, profile, state, base.filter((b) => b.track === 'work_now'))
}
