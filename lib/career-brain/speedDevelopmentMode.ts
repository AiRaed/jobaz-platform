/**
 * Training readiness — open to courses/licences (yes) vs direct employment focus (no).
 * Income urgency is inferred from goal/situation only (no longer asked in the tree).
 */

import { inferBridgeField, type BridgeField } from './bridgeRoleIntelligence'
import { isCareerTrackLocked } from './careerTrackLock'
import { getUserGoal } from './userGoal'
import type { CareerBrainQuestion, CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'
import { rec } from './resultBuilder'

export type WorkSpeed = 'urgent' | 'within_1_2_months' | 'invest_time'
export type CertOpenness = 'yes' | 'direct_only'

export const TRAINING_READINESS_QUESTION_ID = 'cb_cert_openness'

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
}

export const TRAINING_READINESS_QUESTION = q(
  TRAINING_READINESS_QUESTION_ID,
  'Are you open to short courses, licences, or certifications to improve your opportunities?',
  [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]
)

/** @deprecated use TRAINING_READINESS_QUESTION */
export const SPEED_QUESTIONS = {
  certOpenness: TRAINING_READINESS_QUESTION,
}

export function getWorkSpeed(state?: CareerBrainState): WorkSpeed | null {
  const v = String(state?.answers?.cb_work_speed ?? '')
  if (v.includes('urgent')) return 'urgent'
  if (v.includes('within_1_2')) return 'within_1_2_months'
  if (v.includes('invest_time')) return 'invest_time'
  if (String(state?.answers?.cb_urgency ?? '').includes('urgent')) return 'urgent'
  if (String(state?.answers?.cb_graduate_urgency ?? '') === 'urgent') return 'urgent'
  if (String(state?.answers?.cb_entry_work_preference ?? '') === 'quick_income') return 'urgent'
  if (String(state?.answers?.cb_user_goal ?? '') === 'urgent_work') return 'urgent'
  if (
    String(state?.answers?.cb_entry_situation ?? '') === 'unemployed_urgent' &&
    String(state?.answers?.cb_user_goal ?? '') !== 'unemployed'
  ) {
    return 'urgent'
  }
  return null
}

export function getCertOpenness(state?: CareerBrainState): CertOpenness | null {
  const v = String(state?.answers?.cb_cert_openness ?? '').trim().toLowerCase()
  if (v === 'yes' || v === 'maybe') return 'yes'
  if (v === 'no' || v.includes('direct')) return 'direct_only'
  const training = String(state?.answers?.cb_training_willingness ?? '')
  if (training === 'yes' || training === 'maybe') return 'yes'
  if (training === 'no') return 'direct_only'
  return null
}

function hasTrainingReadinessAnswer(state: CareerBrainState): boolean {
  const a = state?.answers ?? {}
  return (
    a.cb_cert_openness !== undefined &&
    a.cb_cert_openness !== null &&
    String(a.cb_cert_openness).trim() !== ''
  )
}

export function needsTrainingReadinessQuestion(state: CareerBrainState): boolean {
  return !hasTrainingReadinessAnswer(state)
}

export function pickTrainingReadinessQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (needsTrainingReadinessQuestion(state)) {
    return {
      question: TRAINING_READINESS_QUESTION,
      reason: 'Open to short courses, licences, or certifications?',
    }
  }
  return { question: null, reason: 'Training readiness answered' }
}

/** @deprecated use needsTrainingReadinessQuestion */
export function needsCertOpennessQuestion(state: CareerBrainState): boolean {
  return needsTrainingReadinessQuestion(state)
}

export function isFastIncomeMode(profile: CareerProfile, state?: CareerBrainState): boolean {
  if (profile.constraints.includes('fast-income-mode')) return true
  return getWorkSpeed(state) === 'urgent' || profile.urgencyLevel === 'high'
}

export function isBuildProgressMode(profile: CareerProfile, state?: CareerBrainState): boolean {
  if (profile.constraints.includes('build-progress-mode')) return true
  if (isFastIncomeMode(profile, state)) return false
  return isCertOpen(profile, state)
}

export function isCertOpen(profile: CareerProfile, state?: CareerBrainState): boolean {
  if (profile.constraints.includes('open-to-certifications')) return true
  return getCertOpenness(state) === 'yes'
}

export function prefersDirectEmployment(profile: CareerProfile, state?: CareerBrainState): boolean {
  return (
    profile.constraints.includes('prefer-direct-work') ||
    profile.constraints.includes('direct-employment-focus') ||
    getCertOpenness(state) === 'direct_only'
  )
}

function inferUrgencyFromSituation(state: CareerBrainState, profile: CareerProfile): CareerProfile {
  let next = { ...profile }
  const goal = getUserGoal(state)
  const a = state.answers ?? {}

  const urgent =
    goal === 'urgent_work' ||
    (String(a.cb_entry_situation ?? '') === 'unemployed_urgent' &&
      String(a.cb_user_goal ?? '') !== 'unemployed') ||
    String(a.cb_entry_work_preference ?? '') === 'quick_income' ||
    String(a.cb_graduate_urgency ?? '') === 'urgent' ||
    String(a.cb_urgency ?? '').includes('urgent') ||
    getWorkSpeed(state) === 'urgent'

  if (urgent) {
    next.urgencyLevel = 'high'
    const constraints = new Set([...next.constraints, 'fast-income-mode'])
    const fieldLocked =
      next.constraints.includes('career-track-locked') ||
      next.constraints.includes('path-focus-education') ||
      next.constraints.includes('path-focus-experience') ||
      next.constraints.includes('field-first-education') ||
      Boolean(String(a.cb_first_job_study_field ?? '').trim()) ||
      Boolean(String(a.cb_field_income_strategy ?? '').includes('field_only'))
    if (!fieldLocked) {
      constraints.add('any-job-ok')
    }
    next.constraints = [...constraints]
    return next
  }

  if (getWorkSpeed(state) === 'invest_time') {
    next.urgencyLevel = 'low'
    next.constraints = [...new Set([...next.constraints, 'development-mode'])]
  } else if (next.urgencyLevel === 'low') {
    next.urgencyLevel = 'medium'
  }
  return next
}

export function applySpeedDevelopmentToProfile(
  profile: CareerProfile,
  state?: CareerBrainState
): CareerProfile {
  if (!state) return profile
  const cert = getCertOpenness(state)
  let next = inferUrgencyFromSituation(state, profile)

  if (cert === 'yes') {
    next.constraints = [
      ...new Set([
        ...next.constraints,
        'open-to-certifications',
        'skill-unlock-mode',
        'build-progress-mode',
      ]),
    ]
  } else if (cert === 'direct_only') {
    next.constraints = [
      ...new Set([...next.constraints, 'prefer-direct-work', 'direct-employment-focus']),
    ]
  }

  return next
}

type CertSuggestion = {
  name: string
  why: string
  unlocks: string
  domain?: CareerProfile['domain']
  studyAligned?: boolean
}

const CERT_CATALOG: Record<string, CertSuggestion[]> = {
  general: [
    {
      name: 'SIA security licence',
      why: 'Short course — unlocks security and door supervisor roles across the UK',
      unlocks: 'Security officer',
      domain: 'retail_customer_service',
    },
    {
      name: 'Forklift licence (FLT)',
      why: '1–3 day course — higher warehouse pay and more shifts',
      unlocks: 'Forklift operator',
      domain: 'driving_logistics',
    },
    {
      name: 'Digital support / admin basics',
      why: 'Beginner-friendly digital skills for office and remote support roles',
      unlocks: 'Digital support assistant',
      domain: 'IT_digital',
    },
  ],
  hospitality: [
    {
      name: 'Hospitality supervisor course',
      why: 'Short leadership training — step up from barista or retail into team lead',
      unlocks: 'Hospitality team leader',
      domain: 'hospitality',
    },
  ],
  care: [
    {
      name: 'Care assistant certification',
      why: 'Standard UK care entry — required for many care homes and support roles',
      unlocks: 'Care support worker',
      domain: 'care_support',
    },
    {
      name: 'Moving & Handling training',
      why: 'Often required alongside care roles',
      unlocks: 'Healthcare assistant',
      domain: 'healthcare',
    },
  ],
  construction: [
    {
      name: 'CSCS construction card',
      why: 'Required for most UK construction and site-access roles',
      unlocks: 'Site labourer / trade assistant',
      domain: 'construction_trades',
    },
    { name: 'Trade apprenticeship route', why: 'Earn while learning a skilled trade', unlocks: 'Trainee tradesperson' },
  ],
  finance: [
    { name: 'AAT / bookkeeping certificate', why: 'Recognised UK finance entry pathway', unlocks: 'Bookkeeping assistant' },
    { name: 'Excel & admin software skills', why: 'Quick digital upskill for office finance roles', unlocks: 'Finance admin assistant' },
  ],
  IT: [
    { name: 'Digital support / IT fundamentals', why: 'Beginner-friendly route into helpdesk and support', unlocks: 'IT support assistant' },
    { name: 'AI & digital tools basics', why: 'Growing demand for digital literacy in UK workplaces', unlocks: 'Digital support advisor' },
  ],
  driving: [
    { name: 'UK driving licence', why: 'Opens delivery and courier roles quickly', unlocks: 'Delivery driver' },
    { name: 'CPC / passenger licence (if applicable)', why: 'Progression for professional driving careers', unlocks: 'Courier / private hire' },
  ],
  law: [
    {
      name: 'Legal admin / paralegal short course',
      why: 'Practical UK legal sector entry while studying',
      unlocks: 'Legal admin assistant',
      domain: 'admin_business',
      studyAligned: true,
    },
    {
      name: 'Communication & customer service building',
      why: 'Strengthens UK workplace English for legal environments',
      unlocks: 'Legal receptionist',
      domain: 'admin_business',
      studyAligned: true,
    },
  ],
  healthcare: [
    { name: 'Care Certificate', why: 'Patient-facing hours while studying healthcare', unlocks: 'Healthcare assistant' },
    { name: 'First aid / manual handling', why: 'Often requested by NHS bank and care employers', unlocks: 'Care support worker' },
  ],
  interpreting: [
    {
      name: 'Community interpreting certificate',
      why: 'Uses bilingual skills for paid UK interpreting work',
      unlocks: 'Community interpreter',
      domain: 'admin_business',
    },
    { name: 'DPSI preparation pathway', why: 'Longer-term professional interpreting route', unlocks: 'Public service interpreter' },
  ],
}

function dedupeCerts(certs: CertSuggestion[]): CertSuggestion[] {
  const seen = new Set<string>()
  return certs.filter((c) => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
}

function certBucket(
  profile: CareerProfile,
  field: BridgeField,
  opts?: { generalOnly?: boolean }
): CertSuggestion[] {
  const blob = `${profile.studyField ?? ''} ${profile.workExperienceField ?? ''} ${profile.targetField ?? ''}`.toLowerCase()
  const out: CertSuggestion[] = [
    ...(CERT_CATALOG.general ?? []),
    ...(CERT_CATALOG.hospitality ?? []),
    ...(CERT_CATALOG.care ?? []).slice(0, 1),
    ...(CERT_CATALOG.construction ?? []).slice(0, 1),
  ]

  if (opts?.generalOnly) {
    out.push(...(CERT_CATALOG.care ?? []), ...(CERT_CATALOG.construction ?? []))
    if (/arabic|bilingual|interpreter|translator|urdu|polish|romanian/.test(blob)) {
      out.push(...(CERT_CATALOG.interpreting ?? []))
    }
    if (/physical|warehouse|quick_income/.test(blob)) {
      out.push(...(CERT_CATALOG.general ?? []).filter((c) => /forklift/i.test(c.name)))
    }
    return dedupeCerts(out)
  }

  if (/arabic|bilingual|interpreter|translator|urdu|polish|romanian/.test(blob)) {
    out.push(...(CERT_CATALOG.interpreting ?? []))
  }
  if (field === 'law' || /law|legal/.test(blob)) out.push(...(CERT_CATALOG.law ?? []))
  if (/care|health|nurse|medicine/.test(blob) || field === 'medicine' || field === 'nursing') {
    out.push(...(CERT_CATALOG.care ?? []))
  }
  if (/construct|trade|site|electric|plumb/.test(blob) || field === 'construction') {
    out.push(...(CERT_CATALOG.construction ?? []))
  }
  if (/account|finance|bookkeep|aat/.test(blob) || field === 'finance') {
    out.push(...(CERT_CATALOG.finance ?? []))
  }
  if (/comput|it\b|tech|software|digital/.test(blob) || field === 'computer_science') {
    out.push(...(CERT_CATALOG.IT ?? []))
  }
  if (/delivery|driver|courier|taxi/.test(blob)) {
    out.push(...(CERT_CATALOG.driving ?? []))
  }
  if (/hospitality|retail|barista|café|cafe|customer|people/.test(blob)) {
    out.push(...(CERT_CATALOG.hospitality ?? []))
  }

  return dedupeCerts(out)
}

export function wantsSkillUnlockMode(profile: CareerProfile, state?: CareerBrainState): boolean {
  if (profile.constraints.includes('skill-unlock-mode')) return true
  return (
    isBuildProgressMode(profile, state) &&
    isCertOpen(profile, state) &&
    !isFastIncomeMode(profile, state)
  )
}

function deprioritiseStudyAlignment(profile: CareerProfile): boolean {
  return (
    profile.constraints.includes('flexible-employment-mode') ||
    profile.constraints.includes('deprioritise-study-alignment')
  )
}

function certLimit(profile: CareerProfile, state?: CareerBrainState): number {
  return getCertOpenness(state) === 'yes' || profile.constraints.includes('open-to-certifications') ? 6 : 4
}

export function buildCertificationBuildNextRoles(
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  if (!wantsSkillUnlockMode(profile, state)) return []
  const field = inferBridgeField(profile.studyField, profile.targetField)
  const certs = certBucket(profile, field).slice(0, certLimit(profile, state))
  const domain = profile.domain
  return certs.map((c) =>
    rec(
      c.name,
      `Build Next — ${c.why}. Explore providers on Build Your Path.`,
      'build_next',
      c.domain ?? domain
    )
  )
}

export function buildCertificationSuggestions(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  if (!isBuildProgressMode(profile, state) || !isCertOpen(profile, state)) return []
  if (isCareerTrackLocked(state ?? { answers: {} }, profile) && profile.constraints.includes('field-only-mode')) {
    const field = inferBridgeField(profile.studyField, profile.targetField)
    return certBucket(profile, field)
      .slice(0, 5)
      .map(
        (c) => `${c.name} — ${c.why} (unlocks: ${c.unlocks}). Field-aligned upgrade for your chosen career path.`
      )
  }
  const field = inferBridgeField(profile.studyField, profile.targetField)
  const certs = certBucket(profile, field).slice(0, 5)
  return certs.map(
    (c) => `${c.name} — ${c.why} (unlocks: ${c.unlocks}). Realistic life upgrade, not back to school.`
  )
}

export function buildSpeedDevelopmentReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  const lines: string[] = []

  if (isFastIncomeMode(profile, state)) {
    lines.push(
      'Prioritising fast-hiring, realistic entry roles — training and long courses are de-prioritised when urgency is high.',
    )
    return lines
  }

  if (isCertOpen(profile, state)) {
    lines.push(
      'You are open to short courses, licences, and certifications — Build Next may include training pathways and qualification-based progression.',
      'LONG-TERM PATH stays connected to realistic career growth in your direction.',
    )
  } else if (getCertOpenness(state) === 'direct_only') {
    lines.push(
      'You prefer direct employment now — recommendations focus on jobs you can pursue with your current profile, not courses as the core path.',
    )
  }

  return lines
}

/** Strip cert-heavy build_next roles when user needs money fast. */
export function filterForFastIncome(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  if (!isFastIncomeMode(profile, state)) return recs
  const certHeavy = /certif|licen[cs]e|apprenticeship|nvq|degree|qualification|training course|after sia|after cscs/i
  return recs.map((r) => {
    if (r.track === 'build_next' && certHeavy.test(r.why + r.title)) {
      return {
        ...r,
        why: `${r.why} (Longer training deferred — focus on income first.)`,
      }
    }
    return r
  }).filter((r) => {
    if (r.track !== 'build_next') return true
    return !/intern|apprentice|trainee solicitor|registered nurse|chartered/i.test(r.title)
  })
}
