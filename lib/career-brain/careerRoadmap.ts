/**
 * Career Roadmap — strict WORK NOW / BUILD NEXT / LONG-TERM separation.
 * BUILD NEXT = courses & licences (career-aligned + fast employment upgrades).
 * LONG-TERM = professional direction — not what the user can do tomorrow.
 */

import {
  inferBridgeField,
  type BridgeField,
  getBridgeProfessionalTracks,
} from './bridgeRoleIntelligence'
import { getSpecialisationRecommendations } from './fieldSpecialisation'
import {
  getItExperienceLongTermRecommendations,
  shouldUseItExperienceLongTerm,
} from './itExperiencePath'
import { detectPathStrategyMode } from './pathStrategy'
import { wantsFlexibleEmploymentMode } from './flexibleEmploymentMode'
import {
  buildStyleAlignedLongTermRoles,
  filterRecommendationsByWorkStyle,
  getStyleAlignedFastUpgradeNames,
  resolveWorkStyle,
} from './workStylePreferences'
import {
  getCertOpenness,
  isCertOpen,
  isFastIncomeMode,
  wantsSkillUnlockMode,
} from './speedDevelopmentMode'
import {
  enforceCareerProgressionTracks,
  isCareerDestinationRole,
  isTrainingOrLicence,
  longTermDuplicatesTraining,
  normalizeTitle,
  titlesOverlap,
} from './careerProgressionValidation'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'
import { rec } from './resultBuilder'

type CourseDef = {
  name: string
  why: string
  domain: CareerProfile['domain']
  category: 'career_aligned' | 'fast_upgrade'
}

const FAST_EMPLOYMENT_UPGRADES: CourseDef[] = [
  {
    name: 'SIA security licence',
    why: 'Fast Employment Upgrade — short course unlocking security and door supervisor roles',
    domain: 'retail_customer_service',
    category: 'fast_upgrade',
  },
  {
    name: 'Forklift licence (FLT)',
    why: 'Fast Employment Upgrade — 1–3 day course for higher warehouse pay',
    domain: 'driving_logistics',
    category: 'fast_upgrade',
  },
  {
    name: 'First Aid Certificate',
    why: 'Fast Employment Upgrade — valued across care, hospitality, and events',
    domain: 'care_support',
    category: 'fast_upgrade',
  },
  {
    name: 'CSCS construction card',
    why: 'Fast Employment Upgrade — required for most UK construction sites',
    domain: 'construction_trades',
    category: 'fast_upgrade',
  },
  {
    name: 'Food Safety Certificate (Level 2)',
    why: 'Fast Employment Upgrade — required for many kitchen and hospitality roles',
    domain: 'hospitality',
    category: 'fast_upgrade',
  },
  {
    name: 'Care assistant certification',
    why: 'Fast Employment Upgrade — standard UK care entry in weeks',
    domain: 'care_support',
    category: 'fast_upgrade',
  },
  {
    name: 'Hospitality supervisor course',
    why: 'Fast Employment Upgrade — leadership step from barista or retail',
    domain: 'hospitality',
    category: 'fast_upgrade',
  },
  {
    name: 'Community interpreting certificate',
    why: 'Fast Employment Upgrade — uses bilingual skills for paid interpreting work',
    domain: 'admin_business',
    category: 'fast_upgrade',
  },
]

const CAREER_ALIGNED_BY_FIELD: Partial<Record<BridgeField, CourseDef[]>> = {
  business: [
    {
      name: 'Business Administration Certificate',
      why: 'Career-Aligned Development — office and business fundamentals for your field',
      domain: 'admin_business',
      category: 'career_aligned',
    },
    {
      name: 'Customer Service Certificate',
      why: 'Career-Aligned Development — UK communication and client-handling skills',
      domain: 'retail_customer_service',
      category: 'career_aligned',
    },
    {
      name: 'Excel for Business',
      why: 'Career-Aligned Development — spreadsheets and admin skills employers expect',
      domain: 'admin_business',
      category: 'career_aligned',
    },
    {
      name: 'Digital Marketing Basics',
      why: 'Career-Aligned Development — practical marketing skills alongside business study',
      domain: 'IT_digital',
      category: 'career_aligned',
    },
  ],
  marketing: [
    {
      name: 'Digital Marketing Basics',
      why: 'Career-Aligned Development — campaigns, content, and analytics foundations',
      domain: 'IT_digital',
      category: 'career_aligned',
    },
    {
      name: 'Social Media Marketing Certificate',
      why: 'Career-Aligned Development — hands-on digital marketing for your portfolio',
      domain: 'creative_media',
      category: 'career_aligned',
    },
  ],
  law: [
    {
      name: 'Legal Administration Training',
      why: 'Career-Aligned Development — practical UK legal sector admin skills',
      domain: 'admin_business',
      category: 'career_aligned',
    },
    {
      name: 'Legal Research Skills',
      why: 'Career-Aligned Development — casework and research techniques for legal support roles',
      domain: 'admin_business',
      category: 'career_aligned',
    },
    {
      name: 'Office Administration Certificate',
      why: 'Career-Aligned Development — professional environment skills for law firms',
      domain: 'admin_business',
      category: 'career_aligned',
    },
  ],
  computer_science: [
    {
      name: 'IT Support Fundamentals',
      why: 'Career-Aligned Development — helpdesk and troubleshooting basics',
      domain: 'IT_digital',
      category: 'career_aligned',
    },
    {
      name: 'CompTIA A+ preparation',
      why: 'Career-Aligned Development — recognised IT entry certification pathway',
      domain: 'IT_digital',
      category: 'career_aligned',
    },
    {
      name: 'Digital Skills Training',
      why: 'Career-Aligned Development — workplace tech literacy for IT careers',
      domain: 'IT_digital',
      category: 'career_aligned',
    },
  ],
  medicine: [
    {
      name: 'Care Certificate',
      why: 'Career-Aligned Development — patient-facing hours while studying healthcare',
      domain: 'care_support',
      category: 'career_aligned',
    },
    {
      name: 'NHS Preparation Training',
      why: 'Career-Aligned Development — NHS values, admin, and entry expectations',
      domain: 'healthcare',
      category: 'career_aligned',
    },
  ],
  nursing: [
    {
      name: 'Care Certificate',
      why: 'Career-Aligned Development — hands-on care hours for nursing applications',
      domain: 'care_support',
      category: 'career_aligned',
    },
    {
      name: 'Moving & Handling training',
      why: 'Career-Aligned Development — often required alongside care and NHS bank roles',
      domain: 'healthcare',
      category: 'career_aligned',
    },
  ],
  healthcare: [
    {
      name: 'Care Certificate',
      why: 'Career-Aligned Development — standard UK care and NHS bank entry',
      domain: 'care_support',
      category: 'career_aligned',
    },
    {
      name: 'NHS Preparation Training',
      why: 'Career-Aligned Development — NHS workplace readiness',
      domain: 'healthcare',
      category: 'career_aligned',
    },
  ],
  finance: [
    {
      name: 'AAT / bookkeeping certificate',
      why: 'Career-Aligned Development — recognised UK finance entry pathway',
      domain: 'finance_accounting',
      category: 'career_aligned',
    },
    {
      name: 'Excel for Business',
      why: 'Career-Aligned Development — finance admin and reporting skills',
      domain: 'finance_accounting',
      category: 'career_aligned',
    },
  ],
  animation: [
    {
      name: 'Video editing short course',
      why: 'Career-Aligned Development — portfolio-building creative software skills',
      domain: 'creative_media',
      category: 'career_aligned',
    },
    {
      name: 'Motion graphics fundamentals',
      why: 'Career-Aligned Development — After Effects and motion design basics',
      domain: 'animation_design',
      category: 'career_aligned',
    },
  ],
  media: [
    {
      name: 'Content production short course',
      why: 'Career-Aligned Development — filming, editing, and publishing basics',
      domain: 'creative_media',
      category: 'career_aligned',
    },
  ],
  psychology: [
    {
      name: 'Mental health awareness certificate',
      why: 'Career-Aligned Development — relevant for support and wellbeing roles',
      domain: 'care_support',
      category: 'career_aligned',
    },
    {
      name: 'Safeguarding training',
      why: 'Career-Aligned Development — required for many support and education settings',
      domain: 'education_training',
      category: 'career_aligned',
    },
  ],
  education: [
    {
      name: 'Teaching assistant preparation course',
      why: 'Career-Aligned Development — classroom support skills while studying',
      domain: 'education_training',
      category: 'career_aligned',
    },
  ],
  construction: [
    {
      name: 'Health & safety site awareness',
      why: 'Career-Aligned Development — site safety before CSCS and trade routes',
      domain: 'construction_trades',
      category: 'career_aligned',
    },
  ],
}

const EXPERIENCE_IT_COURSES: CourseDef[] = [
  {
    name: 'CompTIA IT Fundamentals',
    why: 'Experience-Aligned Development — IT foundation for support and tech roles',
    domain: 'IT_digital',
    category: 'career_aligned',
  },
  {
    name: 'Google IT Support Certificate',
    why: 'Experience-Aligned Development — structured helpdesk training pathway',
    domain: 'IT_digital',
    category: 'career_aligned',
  },
  {
    name: 'Excel & Data Skills',
    why: 'Experience-Aligned Development — data skills for IT and analyst progression',
    domain: 'IT_digital',
    category: 'career_aligned',
  },
  {
    name: 'Basic Networking Skills',
    why: 'Experience-Aligned Development — networking basics for systems careers',
    domain: 'IT_digital',
    category: 'career_aligned',
  },
]

const LONG_TERM_BY_FIELD: Partial<
  Record<BridgeField, Array<{ title: string; why: string; domain: CareerProfile['domain'] }>>
> = {
  business: [
    {
      title: 'Business Administrator',
      why: 'Long-Term Path — professional office career aligned with business studies',
      domain: 'admin_business',
    },
    {
      title: 'Operations Coordinator',
      why: 'Long-Term Path — coordinates teams, processes, and business operations',
      domain: 'admin_business',
    },
    {
      title: 'Sales Executive',
      why: 'Long-Term Path — commercial growth route from business background',
      domain: 'admin_business',
    },
    {
      title: 'Business Development Executive',
      why: 'Long-Term Path — client growth and partnership roles',
      domain: 'admin_business',
    },
    {
      title: 'Assistant Manager',
      why: 'Long-Term Path — leadership step in retail, hospitality, or office teams',
      domain: 'admin_business',
    },
  ],
  law: [
    {
      title: 'Legal Assistant',
      why: 'Long-Term Path — casework and legal support destination after training and UK experience',
      domain: 'admin_business',
    },
    {
      title: 'Paralegal',
      why: 'Long-Term Path — solicitor pathway bridge with UK legal experience',
      domain: 'admin_business',
    },
    {
      title: 'Legal Administrator',
      why: 'Long-Term Path — legal office operations and case coordination',
      domain: 'admin_business',
    },
    {
      title: 'Legal Researcher',
      why: 'Long-Term Path — research-focused legal career direction',
      domain: 'admin_business',
    },
    {
      title: 'Solicitor pathway',
      why: 'Long-Term Path — professional legal career with qualifications over time',
      domain: 'admin_business',
    },
  ],
  computer_science: [
    {
      title: 'IT Support Specialist',
      why: 'Long-Term Path — helpdesk and systems support career',
      domain: 'IT_digital',
    },
    {
      title: 'Junior Developer',
      why: 'Long-Term Path — software development with portfolio and mentorship',
      domain: 'IT_digital',
    },
    {
      title: 'Data Analyst',
      why: 'Long-Term Path — data and reporting career from computing background',
      domain: 'IT_digital',
    },
  ],
  medicine: [
    {
      title: 'Healthcare Coordinator',
      why: 'Long-Term Path — coordinates patient pathways and clinical admin',
      domain: 'healthcare',
    },
    {
      title: 'Clinical support career pathway',
      why: 'Long-Term Path — progression toward clinical medicine with UK experience',
      domain: 'healthcare',
    },
  ],
  nursing: [
    {
      title: 'Senior Care Worker',
      why: 'Long-Term Path — senior patient-facing role before registration',
      domain: 'care_support',
    },
    {
      title: 'Nursing pathway',
      why: 'Long-Term Path — registered nurse qualification route',
      domain: 'healthcare',
    },
  ],
  healthcare: [
    {
      title: 'Senior Care Worker',
      why: 'Long-Term Path — experienced care role with training progression',
      domain: 'care_support',
    },
    {
      title: 'Healthcare Coordinator',
      why: 'Long-Term Path — coordinates care teams and patient services',
      domain: 'healthcare',
    },
    {
      title: 'Nursing pathway',
      why: 'Long-Term Path — nursing qualification and registration route',
      domain: 'healthcare',
    },
  ],
  animation: [
    {
      title: 'Motion Designer',
      why: 'Long-Term Path — creative career aligned with animation study',
      domain: 'animation_design',
    },
    {
      title: 'Animator',
      why: 'Long-Term Path — studio or agency animation career with strong portfolio',
      domain: 'animation_design',
    },
  ],
  finance: [
    {
      title: 'Accounts Assistant',
      why: 'Long-Term Path — finance team progression from AAT or degree',
      domain: 'finance_accounting',
    },
    {
      title: 'Accountant pathway',
      why: 'Long-Term Path — chartered or AAT professional route',
      domain: 'finance_accounting',
    },
  ],
}

const FLEXIBLE_LONG_TERM: Array<{ title: string; why: string; domain: CareerProfile['domain'] }> = [
  {
    title: 'Hospitality / venue manager',
    why: 'Long-Term Path — management from flexible customer-facing UK experience',
    domain: 'hospitality',
  },
  {
    title: 'Operations support coordinator',
    why: 'Long-Term Path — business operations without requiring your degree field',
    domain: 'admin_business',
  },
  {
    title: 'Facilities supervisor',
    why: 'Long-Term Path — leadership in venues, cleaning, or security operations',
    domain: 'retail_customer_service',
  },
  {
    title: 'Logistics coordinator',
    why: 'Long-Term Path — office/logistics progression from warehouse experience',
    domain: 'driving_logistics',
  },
]

const GENERAL_UPGRADE_LONG_TERM: Array<{ title: string; why: string; domain: CareerProfile['domain'] }> =
  [
    {
      title: 'Security officer',
      why: 'Long-Term Path — stable role after SIA licence and UK experience',
      domain: 'retail_customer_service',
    },
    {
      title: 'Care support worker',
      why: 'Long-Term Path — patient-facing care career after certification',
      domain: 'care_support',
    },
    {
      title: 'Forklift operator',
      why: 'Long-Term Path — higher-pay warehouse role after FLT training',
      domain: 'driving_logistics',
    },
    {
      title: 'Community interpreter',
      why: 'Long-Term Path — professional interpreting with bilingual skills',
      domain: 'admin_business',
    },
    {
      title: 'Digital support assistant',
      why: 'Long-Term Path — office/remote support after digital skills training',
      domain: 'IT_digital',
    },
    {
      title: 'Logistics coordinator',
      why: 'Long-Term Path — coordination role from warehouse or delivery experience',
      domain: 'driving_logistics',
    },
  ]

function prioritizeCourses(courses: CourseDef[], preferredNames: string[]): CourseDef[] {
  if (!preferredNames.length) return courses
  const preferred = courses.filter((c) =>
    preferredNames.some((p) => c.name.toLowerCase().includes(p.toLowerCase().slice(0, 8)))
  )
  const rest = courses.filter((c) => !preferred.includes(c))
  return [...preferred, ...rest]
}

function isLikelyCourse(title: string): boolean {
  return isTrainingOrLicence(title)
}

function deprioritiseStudyAlignment(profile: CareerProfile): boolean {
  return (
    profile.constraints.includes('flexible-employment-mode') ||
    profile.constraints.includes('deprioritise-study-alignment')
  )
}

/** Rule 7 / Rule 4 — open to training (yes/maybe): employability growth via courses. */
export function wantsEmployabilityGrowthMode(
  profile: CareerProfile,
  state?: CareerBrainState
): boolean {
  if (profile.constraints.includes('prefer-direct-work')) return false
  return isCertOpen(profile, state) && !isFastIncomeMode(profile, state)
}

export function requiresTrainingBasedBuildNext(
  profile: CareerProfile,
  state?: CareerBrainState
): boolean {
  return getCertOpenness(state) === 'yes' || profile.constraints.includes('open-to-certifications')
}

function courseToRec(c: CourseDef): CareerBrainRecommendation {
  return rec(
    c.name,
    `${c.why}. Explore providers on Build Your Path — realistic upgrade in weeks, not years.`,
    'build_next',
    c.domain
  )
}

export function buildBuildNextCourses(
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  if (!isCertOpen(profile, state) || isFastIncomeMode(profile, state)) return []

  const field = inferBridgeField(profile.studyField, profile.targetField)
  const blob = `${profile.studyField ?? ''} ${profile.workExperienceField ?? ''} ${profile.targetField ?? ''}`.toLowerCase()
  const generalOnly = deprioritiseStudyAlignment(profile)
  const mode = detectPathStrategyMode(profile, state)
  const dualOrBridge = mode === 'hybrid_dual_path' || mode === 'bridge'

  const aligned = generalOnly ? [] : [...(CAREER_ALIGNED_BY_FIELD[field] ?? [])]
  if (!generalOnly && /business|management/.test(blob) && field !== 'business') {
    aligned.push(...(CAREER_ALIGNED_BY_FIELD.business ?? []).slice(0, 2))
  }
  if (!generalOnly && profile.constraints.includes('exp-it_technology')) {
    aligned.push(...EXPERIENCE_IT_COURSES.slice(0, 3))
  }

  const style = resolveWorkStyle(profile, state)
  const preferredFast = getStyleAlignedFastUpgradeNames(style)

  let fast = prioritizeCourses([...FAST_EMPLOYMENT_UPGRADES], preferredFast)
  if (/arabic|bilingual|interpreter|translator|urdu|polish|romanian/.test(blob)) {
    /* community interpreting already in fast list */
  }
  if (style === 'physical' || /physical|warehouse|quick_income/.test(blob)) {
    fast = fast.filter((c) => /forklift|cscs|sia|first aid|food safety/i.test(c.name))
  }
  if (style === 'office') {
    fast = fast.filter((c) => !/forklift|cscs|sia/i.test(c.name) || /digital support/i.test(c.name))
  }

  const alignedCap = dualOrBridge && !generalOnly ? 2 : 3
  const fastCap = dualOrBridge && !generalOnly ? 3 : generalOnly ? 6 : 4

  const seen = new Set<string>()
  const merged: CourseDef[] = []
  for (const c of [...aligned.slice(0, alignedCap), ...fast.slice(0, fastCap)]) {
    const key = c.name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(c)
  }

  return merged.slice(0, generalOnly ? 7 : 8).map(courseToRec)
}

export function buildLongTermProfessionalPath(
  profile: CareerProfile,
  state?: CareerBrainState,
  sourceLongTerm: CareerBrainRecommendation[] = []
): CareerBrainRecommendation[] {
  const mode = detectPathStrategyMode(profile, state)
  const field = inferBridgeField(profile.studyField, profile.targetField)

  if (mode === 'flexible_employment') {
    const style = resolveWorkStyle(profile, state)
    if (style === 'physical') return buildStyleAlignedLongTermRoles('physical')
    if (style === 'people') return buildStyleAlignedLongTermRoles('people')
    return FLEXIBLE_LONG_TERM.map((r) => rec(r.title, r.why, 'long_term', r.domain))
  }

  if (mode === 'bridge' || mode === 'hybrid_dual_path') {
    if (shouldUseItExperienceLongTerm(profile, state, field)) {
      const fromSource = sourceLongTerm.filter((r) => !isLikelyCourse(r.title))
      if (fromSource.length) return fromSource
      return getItExperienceLongTermRecommendations()
    }

    const pack = LONG_TERM_BY_FIELD[field]
    if (pack?.length) {
      return pack.map((r) => rec(r.title, r.why, 'long_term', r.domain))
    }
    const bridge = getBridgeProfessionalTracks(field, profile).longTerm
    if (bridge.length) return bridge
  }

  if (wantsSkillUnlockMode(profile, state) && mode === 'standard') {
    const style = resolveWorkStyle(profile, state)
    const styled = buildStyleAlignedLongTermRoles(style)
    if (styled.length) return styled
    return GENERAL_UPGRADE_LONG_TERM.map((r) => rec(r.title, r.why, 'long_term', r.domain))
  }

  const filteredSource = sourceLongTerm.filter((r) => !isLikelyCourse(r.title))
  if (filteredSource.length) {
    return filteredSource
  }

  if (wantsSkillUnlockMode(profile, state)) {
    return GENERAL_UPGRADE_LONG_TERM.map((r) => rec(r.title, r.why, 'long_term', r.domain))
  }

  const bridge = getBridgeProfessionalTracks(field, profile).longTerm
  if (bridge.length && !deprioritiseStudyAlignment(profile)) return bridge

  return FLEXIBLE_LONG_TERM.slice(0, 3).map((r) => rec(r.title, r.why, 'long_term', r.domain))
}

function dedupeAcrossTracks(
  workNow: CareerBrainRecommendation[],
  buildNext: CareerBrainRecommendation[],
  longTerm: CareerBrainRecommendation[]
): {
  workNow: CareerBrainRecommendation[]
  buildNext: CareerBrainRecommendation[]
  longTerm: CareerBrainRecommendation[]
} {
  const workKeys = workNow.map((r) => normalizeTitle(r.title))

  const cleanBuild = buildNext.filter((r) => {
    if (isLikelyCourse(r.title)) return true
    return !workKeys.some((w) => titlesOverlap(w, r.title))
  })

  const buildKeys = cleanBuild.map((r) => normalizeTitle(r.title))
  const cleanLong = longTerm.filter((r) => {
    if (longTermDuplicatesTraining(r, buildNext)) return false
    if (workKeys.some((w) => titlesOverlap(w, r.title))) return false
    if (
      !isLikelyCourse(r.title) &&
      buildKeys.some((b) => titlesOverlap(b, r.title) && !isLikelyCourse(r.title))
    ) {
      return false
    }
    return true
  })

  const dedupe = (items: CareerBrainRecommendation[]) => {
    const out: CareerBrainRecommendation[] = []
    for (const item of items) {
      if (out.some((o) => titlesOverlap(o.title, item.title))) continue
      out.push(item)
    }
    return out
  }

  return {
    workNow: dedupe(workNow),
    buildNext: dedupe(cleanBuild),
    longTerm: dedupe(cleanLong),
  }
}

/** Final assembly — enforces journey: Work Now → Build Next → Long-Term Path. */
export function assembleCareerRoadmap(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  if (profile.constraints.includes('pathway-deterministic-locked')) {
    const workNow = recs.filter((r) => r.track === 'work_now')
    const buildNext = recs.filter((r) => r.track === 'build_next')
    const longTerm = recs.filter((r) => r.track === 'long_term')
    const backup = recs.filter((r) => r.track === 'backup_income')
    const separated = dedupeAcrossTracks(workNow, buildNext, longTerm)
    let assembled = [...separated.workNow, ...backup, ...separated.buildNext, ...separated.longTerm]

    if (isCertOpen(profile, state) && !isFastIncomeMode(profile, state)) {
      const { mergeFieldAlignedTraining } = require('./courseRecommendationLayer') as typeof import('./courseRecommendationLayer')
      assembled = mergeFieldAlignedTraining(assembled, profile, state)
    }

    if (wantsSkillUnlockMode(profile, state)) {
      const upgradedLong = buildLongTermProfessionalPath(
        profile,
        state,
        assembled.filter((r) => r.track === 'long_term')
      )
      if (upgradedLong.length) {
        assembled = [...assembled.filter((r) => r.track !== 'long_term'), ...upgradedLong]
      }
    }

    const finalSeparated = dedupeAcrossTracks(
      assembled.filter((r) => r.track === 'work_now'),
      assembled.filter((r) => r.track === 'build_next'),
      assembled.filter((r) => r.track === 'long_term')
    )
    return [...finalSeparated.workNow, ...backup, ...finalSeparated.buildNext, ...finalSeparated.longTerm]
  }

  let workNow = recs.filter((r) => r.track === 'work_now' || r.track === 'backup_income')
  let buildNext = recs.filter((r) => r.track === 'build_next')
  let longTerm = recs.filter((r) => r.track === 'long_term')
  const backup = recs.filter((r) => r.track === 'backup_income')

  workNow = workNow.filter((r) => r.track === 'work_now')

  const hasFieldSpecialisation = !!getSpecialisationRecommendations(state)?.length

  if (!hasFieldSpecialisation) {
    buildNext = buildNext.filter((r) => !isLikelyCourse(r.title) || buildNext.length <= 2)
  }

  if (!hasFieldSpecialisation) {
    const resolvedLong = buildLongTermProfessionalPath(profile, state, longTerm)
    if (resolvedLong.length) {
      longTerm = resolvedLong
    }
  }

  longTerm = longTerm.filter(
    (r) => isCareerDestinationRole(r.title) && !longTermDuplicatesTraining(r, buildNext)
  )

  const mode = detectPathStrategyMode(profile, state)
  const careerDirectionLongTerm = mode === 'bridge' || mode === 'hybrid_dual_path'

  const styled = {
    workNow: filterRecommendationsByWorkStyle(workNow, profile, state),
    buildNext: filterRecommendationsByWorkStyle(buildNext, profile, state),
    longTerm: careerDirectionLongTerm
      ? longTerm
      : filterRecommendationsByWorkStyle(longTerm, profile, state),
  }

  const separated = dedupeAcrossTracks(styled.workNow, styled.buildNext, styled.longTerm)

  const enforced = enforceCareerProgressionTracks(
    separated.workNow,
    separated.buildNext,
    separated.longTerm,
    profile,
    state
  )

  const assembled: import('./types').CareerBrainRecommendation[] = [
    ...enforced.workNow,
    ...backup,
    ...enforced.buildNext,
    ...enforced.longTerm,
  ]

  const { mergeFieldAlignedTraining } = require('./courseRecommendationLayer') as typeof import('./courseRecommendationLayer')
  return mergeFieldAlignedTraining(assembled, profile, state)
}

export function buildRoadmapJourneyReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  const mode = detectPathStrategyMode(profile, state)
  const lines = [
    'Career path planner mode — not a job list. Roadmap: WORK NOW → BUILD NEXT → LONG-TERM PATH.',
    'Work Now answers: "What can this person realistically do right now?"',
    isCertOpen(profile, state) && !isFastIncomeMode(profile, state)
      ? 'Build Next answers: "How do I improve?" — courses, licences, and skills (not job titles). Build Your Path for providers.'
      : 'Build Next answers: "What realistic bridge step comes after initial UK work?"',
  ]

  if (mode === 'hybrid_dual_path') {
    lines.push(
      'Open to both: work style shapes immediate income and fast upgrades; career direction (studies/interests) shapes Long-Term Path job destinations.',
      'Long-Term Path answers: "What job could I realistically become?" — never repeat Build Next training items.'
    )
  } else if (deprioritiseStudyAlignment(profile)) {
    lines.push('Long-Term Path: flexible-sector job destinations — Rule 3 (any job is fine) active.')
  } else {
    lines.push('Long-Term Path: career destinations unlocked by training — not another list of courses.')
  }

  return lines
}
