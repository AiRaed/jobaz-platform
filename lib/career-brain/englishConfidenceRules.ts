/**
 * English confidence rules — shape Work Now, Build Next, and Long-Term by level.
 *
 * Critical rules enforced here:
 * - English level comes only from cb_english (never education).
 * - Work Now roles requiring stronger English than selected are excluded.
 * - Basic English: heavy penalty / exclusion for customer-facing roles.
 * - Fluent English: boost for office and professional pathways.
 */

import { isCareerTrackLocked } from './careerTrackLock'
import { specialisationRoleKeywords } from './fieldSpecialisation'
import { getCertOpenness } from './speedDevelopmentMode'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'

function makeRec(
  title: string,
  why: string,
  track: CareerBrainRecommendation['track'],
  domain: CareerProfile['domain']
): CareerBrainRecommendation {
  return { title, why, track, field_tag: domain, domain, source: 'fallback' }
}

export type EnglishConfidenceLevel = 'basic' | 'intermediate' | 'good' | 'fluent'

type EnglishRuleSet = {
  label: string
  workNowPrioritize: RegExp
  workNowAvoid: RegExp
  workNowInject: string[]
  buildNextTitles: string[]
  longTermTitles: string[]
  allowCustomerFacing: boolean
  allowOffice: boolean
}

export const ENGLISH_CONFIDENCE_RULES: Record<EnglishConfidenceLevel, EnglishRuleSet> = {
  basic: {
    label: 'Basic — simple tasks only',
    workNowPrioritize:
      /warehouse operative|cleaner|kitchen assistant|kitchen porter|factory operative|production operative|labourer|site labour|picker|packer/i,
    workNowAvoid:
      /receptionist|office assistant|office admin|administrator|customer service|sales assistant|call centre|data entry|paralegal|legal assistant|recruitment/i,
    workNowInject: ['Warehouse Operative', 'Cleaner (commercial)', 'Kitchen Assistant', 'Factory Operative'],
    buildNextTitles: ['English classes', 'Forklift Licence', 'CSCS Card'],
    longTermTitles: ['Warehouse Team Leader', 'HGV Driver', 'Logistics Coordinator'],
    allowCustomerFacing: false,
    allowOffice: false,
  },
  intermediate: {
    label: 'Intermediate — everyday communication',
    workNowPrioritize:
      /retail assistant|warehouse operative|delivery driver|courier|logistics assistant|care assistant|care support|picker|packer/i,
    workNowAvoid:
      /receptionist|office administrator|office manager|recruitment assistant|sales executive|paralegal|legal assistant/i,
    workNowInject: ['Retail Assistant', 'Warehouse Operative', 'Delivery Driver', 'Care Assistant'],
    buildNextTitles: ['Forklift Licence', 'CPC Qualification', 'Team Leader Training'],
    longTermTitles: ['Logistics Coordinator', 'Transport Planner', 'Fleet Supervisor'],
    allowCustomerFacing: true,
    allowOffice: false,
  },
  good: {
    label: 'Good — comfortable at work',
    workNowPrioritize:
      /customer service|retail assistant|receptionist|office assistant|sales assistant|admin assistant|administrator/i,
    workNowAvoid: /hgv driver|site labour|factory operative|kitchen porter/i,
    workNowInject: [
      'Customer Service Advisor',
      'Retail Assistant',
      'Receptionist',
      'Office Assistant',
      'Sales Assistant',
    ],
    buildNextTitles: ['Supervisor Training', 'Administration Courses', 'Team Leader Training'],
    longTermTitles: ['Office Manager', 'Operations Coordinator', 'Customer Service Manager', 'Logistics Coordinator'],
    allowCustomerFacing: true,
    allowOffice: true,
  },
  fluent: {
    label: 'Fluent',
    workNowPrioritize:
      /office assistant|administrator|admin assistant|recruitment assistant|customer service|sales executive|receptionist|coordinator|data entry/i,
    workNowAvoid: /kitchen porter|site labour|factory operative/i,
    workNowInject: [
      'Office Assistant',
      'Administrator',
      'Recruitment Assistant',
      'Customer Service Advisor',
      'Sales Executive',
      'Receptionist',
    ],
    buildNextTitles: ['Management Training', 'Professional Certifications', 'Specialist Training'],
    longTermTitles: [
      'Operations Manager',
      'Office Manager',
      'Project Coordinator',
      'HR Coordinator',
      'Logistics Manager',
    ],
    allowCustomerFacing: true,
    allowOffice: true,
  },
}

const CUSTOMER_FACING = /retail assistant|barista|waiter|waitress|customer service|sales assistant|receptionist|call centre|hospitality|host\b|front of house/i
const OFFICE_BASED = /office|admin|reception|data entry|clerical|coordinator|paralegal|recruitment|hr assistant/i
const PROFESSIONAL_PATHWAY =
  /office manager|operations manager|hr coordinator|project coordinator|recruitment assistant|sales executive|administrator|paralegal|solicitor pathway|operations coordinator/i

const ENGLISH_LEVEL_RANK: Record<EnglishConfidenceLevel, number> = {
  basic: 1,
  intermediate: 2,
  good: 3,
  fluent: 4,
}

function minEnglishRequiredForRole(
  title: string,
  track: CareerBrainRecommendation['track']
): EnglishConfidenceLevel {
  const t = title.toLowerCase()
  if (track === 'long_term') {
    if (PROFESSIONAL_PATHWAY.test(t) || /manager|director|coordinator|specialist consultant/i.test(t)) {
      return 'good'
    }
    return 'intermediate'
  }
  if (track === 'build_next') {
    if (/administration courses|management training|professional cert/i.test(t)) return 'good'
    return 'basic'
  }
  if (PROFESSIONAL_PATHWAY.test(t) || /sales executive|recruitment assistant/i.test(t)) return 'fluent'
  if (OFFICE_BASED.test(t) || /customer service advisor|receptionist|sales assistant|office assistant/i.test(t)) {
    return 'good'
  }
  if (CUSTOMER_FACING.test(t) || /care assistant|care support|delivery driver|courier/i.test(t)) {
    return 'intermediate'
  }
  return 'basic'
}

export function roleRequiresStrongerEnglishThanSelected(
  title: string,
  track: CareerBrainRecommendation['track'],
  profile: CareerProfile
): boolean {
  const userLevel = normalizeEnglishConfidenceLevel(profile.englishLevel)
  if (!userLevel) return false
  const required = minEnglishRequiredForRole(title, track)
  return ENGLISH_LEVEL_RANK[required] > ENGLISH_LEVEL_RANK[userLevel]
}

export function normalizeEnglishConfidenceLevel(
  level: string | null | undefined
): EnglishConfidenceLevel | null {
  if (!level) return null
  const v = level.toLowerCase().trim()
  if (v === 'functional') return 'intermediate'
  if (v === 'comfortable') return 'good'
  if (v === 'basic' || v === 'intermediate' || v === 'good' || v === 'fluent') return v
  return null
}

export function getEnglishConfidenceLabel(level: string | null | undefined): string | null {
  const normalized = normalizeEnglishConfidenceLevel(level)
  if (!normalized) return null
  return ENGLISH_CONFIDENCE_RULES[normalized].label
}

export function getEnglishConfidenceRules(level: string | null | undefined): EnglishRuleSet | null {
  const normalized = normalizeEnglishConfidenceLevel(level)
  if (!normalized) return null
  return ENGLISH_CONFIDENCE_RULES[normalized]
}

function isFieldCommittedPath(profile: CareerProfile, state?: CareerBrainState): boolean {
  if (isCareerTrackLocked(state ?? { answers: {} }, profile)) return true
  if (specialisationRoleKeywords(state)) return true
  if (profile.constraints.includes('field-first-education') || profile.constraints.includes('field-only-mode')) {
    return true
  }
  if (profile.wantsSameField === true && profile.studyField) return true
  if (profile.wantsCareerChange) return true
  if (profile.constraints.includes('bridge-role-mode')) return true
  return false
}

/** Score adjustment for ranking — higher is better. */
export function englishConfidenceRoleScore(
  title: string,
  track: CareerBrainRecommendation['track'],
  profile: CareerProfile
): number {
  const rules = getEnglishConfidenceRules(profile.englishLevel)
  if (!rules) return 0

  const t = title.toLowerCase()
  let score = 0

  if (track === 'work_now') {
    if (rules.workNowPrioritize.test(t)) score += 35
    if (rules.workNowAvoid.test(t)) score -= 50
    if (normalizeEnglishConfidenceLevel(profile.englishLevel) === 'basic' && CUSTOMER_FACING.test(t)) {
      score -= 70
    } else if (!rules.allowCustomerFacing && CUSTOMER_FACING.test(t)) {
      score -= 45
    }
    if (!rules.allowOffice && OFFICE_BASED.test(t)) score -= 45
    if (normalizeEnglishConfidenceLevel(profile.englishLevel) === 'fluent') {
      if (OFFICE_BASED.test(t) || PROFESSIONAL_PATHWAY.test(t)) score += 30
    }
  }

  if (track === 'build_next') {
    for (const template of rules.buildNextTitles) {
      if (titleMatchesTemplate(t, template)) score += 30
    }
  }

  if (track === 'long_term') {
    for (const template of rules.longTermTitles) {
      if (titleMatchesTemplate(t, template)) score += 30
    }
  }

  return score
}

function titleMatchesTemplate(title: string, template: string): boolean {
  const parts = template.toLowerCase().split(/\s+/).filter(Boolean)
  return parts.every((p) => title.includes(p))
}

export function isRoleExcludedByEnglishRules(
  title: string,
  track: CareerBrainRecommendation['track'],
  profile: CareerProfile,
  state?: CareerBrainState
): boolean {
  void state
  const rules = getEnglishConfidenceRules(profile.englishLevel)
  if (!rules) return false

  if (roleRequiresStrongerEnglishThanSelected(title, track, profile)) {
    return track === 'work_now'
  }

  if (track !== 'work_now') return false

  const t = title.toLowerCase()
  if (rules.workNowAvoid.test(t)) return true
  if (!rules.allowOffice && OFFICE_BASED.test(t)) return true
  if (!rules.allowCustomerFacing && CUSTOMER_FACING.test(t) && !rules.workNowPrioritize.test(t)) {
    return true
  }
  if (normalizeEnglishConfidenceLevel(profile.englishLevel) === 'basic' && CUSTOMER_FACING.test(t)) {
    return true
  }
  return false
}

function domainForEnglishTemplates(profile: CareerProfile): CareerProfile['domain'] {
  if (profile.domain === 'driving_logistics' || profile.domain === 'admin_business') return profile.domain
  if (profile.constraints.includes('non-physical')) return 'admin_business'
  return 'retail_customer_service'
}

function certAwareBuildNextTitles(
  level: EnglishConfidenceLevel,
  state?: CareerBrainState
): string[] {
  const rules = ENGLISH_CONFIDENCE_RULES[level]
  const titles = rules.buildNextTitles
  if (getCertOpenness(state) !== 'direct_only') return titles.slice(0, 3)

  const licencePattern = /forklift|cscs|cpc|hgv|sia|licence|license|certification|certificate/i
  const filtered = titles.filter((title) => !licencePattern.test(title))
  if (filtered.length >= 2) return filtered.slice(0, 3)
  if (filtered.length === 1) return filtered
  return ['Team Leader Training']
}

function mergeEnglishProgressionTemplates(
  recs: CareerBrainRecommendation[],
  level: EnglishConfidenceLevel,
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const rules = ENGLISH_CONFIDENCE_RULES[level]
  const domain = domainForEnglishTemplates(profile)
  const other = recs.filter((r) => r.track !== 'build_next' && r.track !== 'long_term')

  const buildNext = certAwareBuildNextTitles(level, state).map((title) =>
    makeRec(title, `Build Next — aligned with ${rules.label.toLowerCase()}`, 'build_next', domain)
  )
  const longTerm = rules.longTermTitles.slice(0, 3).map((title) =>
    makeRec(title, `Long-Term Path — progression for ${rules.label.toLowerCase()}`, 'long_term', domain)
  )

  return [...other, ...buildNext, ...longTerm]
}

function injectEnglishWorkNowPriorities(
  recs: CareerBrainRecommendation[],
  level: EnglishConfidenceLevel,
  profile: CareerProfile
): CareerBrainRecommendation[] {
  const rules = ENGLISH_CONFIDENCE_RULES[level]
  const domain = domainForEnglishTemplates(profile)
  const workNow = recs.filter((r) => r.track === 'work_now')
  const titles = new Set(workNow.map((r) => r.title.toLowerCase()))
  const extras: CareerBrainRecommendation[] = []
  let injected = 0

  for (const title of rules.workNowInject) {
    if (injected >= 2) break
    const key = title.toLowerCase()
    if (titles.has(key)) continue
    if ([...titles].some((existing) => titleMatchesTemplate(existing, title))) continue
    extras.push(
      makeRec(
        title,
        `Work Now — prioritised for ${rules.label.toLowerCase()}`,
        'work_now',
        domain
      )
    )
    titles.add(key)
    injected++
  }

  if (!extras.length) return recs
  const rest = recs.filter((r) => r.track !== 'work_now')
  return [...extras, ...workNow, ...rest]
}

export function applyEnglishConfidenceRules(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const level = normalizeEnglishConfidenceLevel(profile.englishLevel)
  if (!level) return recs

  let next = recs.filter(
    (r) => !isRoleExcludedByEnglishRules(r.title, r.track, profile, state)
  )

  if (!isFieldCommittedPath(profile, state)) {
    next = injectEnglishWorkNowPriorities(next, level, profile)
    next = mergeEnglishProgressionTemplates(next, level, profile, state)
  }

  return next
}

export function buildEnglishConfidenceReasoning(profile: CareerProfile): string[] {
  const rules = getEnglishConfidenceRules(profile.englishLevel)
  if (!rules) return []

  const lines = [`English confidence (${rules.label}) shapes Work Now, Build Next, and Long-Term paths.`]

  switch (normalizeEnglishConfidenceLevel(profile.englishLevel)) {
    case 'basic':
      lines.push(
        'Focus: minimal communication roles (warehouse, cleaning, kitchen, factory).',
        'Avoid: customer-facing and office-based Work Now roles until English improves.'
      )
      break
    case 'intermediate':
      lines.push(
        'Focus: everyday workplace communication — retail, logistics, care, and limited customer contact.',
        'Build Next emphasises licences and team leader training.'
      )
      break
    case 'good':
      lines.push(
        'Focus: customer-facing and administrative entry roles.',
        'Build Next moves toward supervisor and administration courses.'
      )
      break
    case 'fluent':
      lines.push(
        'All entry pathways considered — strong weighting toward office, administration, and professional routes.'
      )
      break
    default:
      break
  }

  return lines
}

export function buildEnglishDevelopmentPlanContent(
  profile: CareerProfile,
  workNowTitles: string[]
): {
  currentLevel: string
  limitations: string[]
  accessibleJobsNow: string[]
  benefitsOfImproving: string[]
  unlockedLater: string[]
  suggestedActions: string[]
} | null {
  const level = normalizeEnglishConfidenceLevel(profile.englishLevel)
  if (!level || level === 'fluent') return null

  const rules = ENGLISH_CONFIDENCE_RULES[level]
  const accessible = workNowTitles.length
    ? workNowTitles.slice(0, 4)
    : level === 'basic'
      ? ['Warehouse Operative', 'Cleaner', 'Kitchen Assistant', 'Factory Operative']
      : level === 'intermediate'
        ? ['Retail Assistant', 'Warehouse Operative', 'Delivery Driver', 'Care Assistant']
        : ['Customer Service Advisor', 'Retail Assistant', 'Receptionist', 'Office Assistant']

  const limitations =
    level === 'basic'
      ? [
          'Complex phone calls and detailed customer complaints may be difficult',
          'Office admin, reception, and professional roles usually need stronger workplace English',
          'Written applications and interview answers may need extra support',
        ]
      : level === 'intermediate'
        ? [
            'Some professional or specialist roles may still need stronger written English',
            'Fast-paced customer-facing roles in busy environments can be harder at first',
          ]
        : [
            'Senior management and specialist professional roles may still need stronger written English in some sectors',
          ]

  const unlockedLater =
    level === 'basic'
      ? ['Retail Assistant', 'Delivery Driver', 'Care Assistant', 'Customer Service Advisor', 'Office Assistant']
      : level === 'intermediate'
        ? ['Customer Service Advisor', 'Receptionist', 'Office Assistant', 'Sales Assistant', 'Operations Coordinator']
        : ['Office Manager', 'Customer Service Manager', 'Operations Manager', 'Project Coordinator']

  return {
    currentLevel: rules.label,
    limitations,
    accessibleJobsNow: accessible,
    benefitsOfImproving: [
      'More customer-facing and office roles become realistic',
      'Stronger interview performance and clearer CV wording',
      'Better pay and progression into team leader and coordinator roles',
    ],
    unlockedLater,
    suggestedActions:
      level === 'basic'
        ? [
            'Practise workplace English 15–20 minutes daily (listening + speaking)',
            'Apply to roles with minimal spoken English while improving step by step',
            'Consider ESOL or functional skills English if available locally',
            'Build Next: English classes alongside practical licences (forklift, CSCS) where relevant',
          ]
        : [
            'Practise workplace English daily — focus on customer phrases and workplace vocabulary',
            'Build a simple UK-style CV with clear bullet points',
            'Target roles with everyday communication before moving into office-heavy roles',
          ],
  }
}
