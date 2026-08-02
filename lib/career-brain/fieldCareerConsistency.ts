/**
 * Field alignment & career consistency — domain ladders, cross-sector gates, progression logic.
 */

import { inferBridgeField } from './bridgeRoleIntelligence'
import { getFieldIncomeStrategy, isCareerTrackLocked } from './careerTrackLock'
import { inferCareerTrackFamily } from './careerTrackAlignment'
import { getFieldAlignment, isFieldAlignmentNo, isFieldAlignmentYes, isFieldAlignmentBoth } from './fieldAlignment'
import { allowsGenericEmployabilityOnly } from './bridgeRoleIntelligence'
import { getUserGoal, isStartNewCareerGoal } from './userGoal'
import { isHighBarrierField } from './dualPathMode'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'

export type ProfessionalDomain =
  | 'science'
  | 'business'
  | 'computer_science'
  | 'engineering'
  | 'design_creative'
  | 'healthcare'
  | 'legal'
  | 'general'

type DomainLadder = {
  label: string
  workNow: string[]
  buildNext: string[]
  longTerm: string[]
  workNowPattern: RegExp
  buildNextPattern: RegExp
  longTermPattern: RegExp
}

export const DOMAIN_PROGRESSION_LADDERS: Record<ProfessionalDomain, DomainLadder> = {
  science: {
    label: 'Science & Laboratory',
    workNow: ['Laboratory Assistant', 'Lab Technician (entry)', 'Research Support Assistant'],
    buildNext: ['Science Technician training', 'Laboratory Skills Certificate', 'Quality Control basics'],
    longTerm: ['Laboratory Supervisor', 'Research Technician', 'Quality Control Specialist'],
    workNowPattern: /laboratory|lab assistant|lab technician|research assistant|research support|science technician|science assistant|quality inspector \(junior\)/i,
    buildNextPattern: /science technician|laboratory|quality control|research skills|lab skills/i,
    longTermPattern: /laboratory supervisor|research technician|quality control|science coordinator|lab manager/i,
  },
  business: {
    label: 'Business & Administration',
    workNow: ['Office Assistant', 'Admin Assistant', 'Business Support Administrator'],
    buildNext: ['Administration Courses', 'Microsoft Office Certification', 'Business Administration Certificate'],
    longTerm: ['Operations Manager', 'Project Coordinator', 'Office Manager'],
    workNowPattern: /office assistant|admin assistant|business support|sales support admin|office admin/i,
    buildNextPattern: /administration|business admin|microsoft office|bookkeeping|customer service cert/i,
    longTermPattern: /operations manager|project coordinator|office manager|business administrator|operations coordinator/i,
  },
  computer_science: {
    label: 'IT & Computer Science',
    workNow: ['IT Support Assistant', 'Junior IT Support', 'QA Tester (junior)'],
    buildNext: ['CompTIA A+', 'Google IT Support Certificate', 'Junior Web Developer'],
    longTerm: ['Software Engineer', 'Systems Analyst', 'IT Support Specialist'],
    workNowPattern: /it support|helpdesk|technical support|qa tester|digital support|junior developer/i,
    buildNextPattern: /comptia|google it|networking|junior web|software developer|technical cert/i,
    longTermPattern: /software engineer|systems analyst|systems admin|developer|cybersecurity|data analyst/i,
  },
  engineering: {
    label: 'Engineering',
    workNow: ['Engineering Technician Assistant', 'Junior Design Engineer', 'Graduate Mechanical Engineer'],
    buildNext: ['Professional CAD / FEA development', 'Graduate Engineer (trainee)', 'Chartered Engineer pathway briefing'],
    longTerm: ['Project Engineer', 'Mechanical Design Engineer', 'Engineering Manager'],
    workNowPattern: /engineering technician|design engineer|graduate engineer|cad|r&d assistant|manufacturing engineer/i,
    buildNextPattern: /cad|fea|graduate engineer|chartered engineer|hnc|btec|lean|six sigma|process safety/i,
    longTermPattern: /project engineer|engineering manager|design engineer|r&d engineer|senior engineer|incorporated engineer/i,
  },
  design_creative: {
    label: 'Design & Creative',
    workNow: ['Design Assistant', 'Junior Designer', 'Production Assistant (part-time)'],
    buildNext: ['Video editing short course', 'Motion graphics fundamentals', 'Content production short course'],
    longTerm: ['Senior Designer', 'Creative Lead', 'Motion Designer'],
    workNowPattern: /design assistant|junior designer|production assistant|motion graphics|social media content|video editor/i,
    buildNextPattern: /video editing|motion graphics|content production|creative marketing|portfolio/i,
    longTermPattern: /senior designer|creative lead|motion designer|animator|creative director|content producer/i,
  },
  healthcare: {
    label: 'Healthcare & Care',
    workNow: ['Care Assistant', 'Healthcare Support Worker', 'Healthcare Assistant'],
    buildNext: ['Care Certificate', 'Moving & Handling training', 'Senior Healthcare Assistant'],
    longTerm: ['Senior Care Worker', 'Healthcare Coordinator', 'Senior Healthcare Professional Pathway'],
    workNowPattern: /care assistant|healthcare support|healthcare assistant|support worker|clinical support/i,
    buildNextPattern: /care certificate|moving|handling|senior healthcare|nhs preparation/i,
    longTermPattern: /healthcare coordinator|senior care|team leader \(care\)|care home supervisor|clinical support career/i,
  },
  legal: {
    label: 'Legal',
    workNow: ['Legal Receptionist', 'Legal Admin Assistant', 'Casework Assistant'],
    buildNext: ['Legal Administration Training', 'Legal Research Skills'],
    longTerm: ['Legal Assistant', 'Paralegal', 'Legal Administrator'],
    workNowPattern: /legal reception|legal admin|casework|paralegal|legal assistant/i,
    buildNextPattern: /legal administration|legal research|office administration certificate/i,
    longTermPattern: /legal assistant|paralegal|legal administrator|legal researcher|solicitor pathway/i,
  },
  general: {
    label: 'General employability',
    workNow: ['Retail Assistant', 'Warehouse Operative', 'Admin Assistant'],
    buildNext: ['Customer Service Certification', 'Team Leader Training'],
    longTerm: ['Team Supervisor', 'Operations Coordinator', 'Store Manager'],
    workNowPattern: /retail|warehouse|admin|customer service|kitchen porter/i,
    buildNextPattern: /customer service|team leader|forklift|certification|training/i,
    longTermPattern: /supervisor|coordinator|manager|team leader/i,
  },
}

const UNRELATED_SECTOR_LONG_TERM =
  /office manager|retail manager|store manager|area manager|warehouse supervisor|barista|kitchen porter/i

function makeRec(
  title: string,
  why: string,
  track: CareerBrainRecommendation['track'],
  domain: CareerProfile['domain']
): CareerBrainRecommendation {
  return { title, why, track, field_tag: domain, domain, source: 'fallback' }
}

export function inferProfessionalDomain(
  profile: CareerProfile,
  state?: CareerBrainState
): ProfessionalDomain {
  const studySlug = String(state?.answers?.cb_first_job_study_field ?? '').trim()
  const studentStudy = String(state?.answers?.cb_student_study_field ?? '').trim().toLowerCase()
  const study = `${studySlug} ${studentStudy} ${profile.studyField ?? ''} ${profile.workExperienceField ?? ''}`.toLowerCase()

  if (studySlug === 'science' || studentStudy === 'science' || /biology|chemistry|physics|laboratory|biotech|life science/.test(study)) {
    return 'science'
  }
  if (studySlug === 'it_computing' || /computer science|software|computing|developer|cyber|data science/.test(study)) {
    return 'computer_science'
  }
  if (studySlug === 'engineering' || /mechanical|electrical|civil|manufacturing engineer|design engineer/.test(study)) {
    return 'engineering'
  }
  if (studySlug === 'business_management' || /business|management|mba/.test(study)) {
    return 'business'
  }
  if (studySlug === 'arts_design' || studySlug === 'media_communications' || /design|creative|animation|media|graphic/.test(study)) {
    return 'design_creative'
  }
  if (studySlug === 'healthcare' || /healthcare|nursing|care support|clinical/.test(study)) {
    return 'healthcare'
  }
  if (studySlug === 'law' || studentStudy === 'law' || /legal|law\b|paralegal/.test(study)) {
    return 'legal'
  }

  const bridge = inferBridgeField(profile.studyField, profile.targetField)
  const map: Partial<Record<typeof bridge, ProfessionalDomain>> = {
    computer_science: 'computer_science',
    engineering: 'engineering',
    business: 'business',
    finance: 'business',
    marketing: 'design_creative',
    animation: 'design_creative',
    media: 'design_creative',
    medicine: 'healthcare',
    nursing: 'healthcare',
    healthcare: 'healthcare',
    social_care: 'healthcare',
    law: 'legal',
  }
  return map[bridge] ?? 'general'
}

export function userWantsFieldAlignedCareer(state: CareerBrainState, profile: CareerProfile): boolean {
  if (isFieldAlignmentNo(state)) return false
  if (allowsGenericEmployabilityOnly(profile, state)) return false
  if (isFieldAlignmentYes(state) || isFieldAlignmentBoth(state)) return true
  if (profile.wantsSameField === true) return true
  const strategy = getFieldIncomeStrategy(state)
  if (strategy === 'field_only' || strategy === 'field_with_backup') return true
  return isCareerTrackLocked(state, profile)
}

export type CrossSectorDecision = {
  allowed: boolean
  reasons: string[]
}

/** Cross-sector roles only when one of the four explicit conditions applies. */
export function evaluateCrossSectorRecommendation(
  state: CareerBrainState,
  profile: CareerProfile
): CrossSectorDecision {
  const reasons: string[] = []

  if (isStartNewCareerGoal(getUserGoal(state)) || profile.wantsCareerChange) {
    reasons.push('You indicated a career change — exploring a new sector is appropriate.')
    return { allowed: true, reasons }
  }

  if (isFieldAlignmentNo(state)) {
    reasons.push('You chose roles outside your study field or prioritise immediate employability.')
    return { allowed: true, reasons }
  }

  if (allowsGenericEmployabilityOnly(profile, state)) {
    reasons.push('Immediate income is prioritised over field alignment.')
    return { allowed: true, reasons }
  }

  const strategy = getFieldIncomeStrategy(state)
  if (strategy === 'any_work_ok') {
    reasons.push('You are open to any work for now.')
    return { allowed: true, reasons }
  }

  const domain = inferProfessionalDomain(profile, state)
  const bridge = inferBridgeField(profile.studyField, profile.targetField)
  if (isHighBarrierField(bridge) && strategy !== 'field_only') {
    reasons.push(
      'Your qualification may need significant UK retraining — a faster-employment path can run alongside field-aligned progression.'
    )
    return { allowed: true, reasons }
  }

  if (domain === 'general') {
    return { allowed: true, reasons: ['No single professional field is locked yet.'] }
  }

  return { allowed: false, reasons: [] }
}

export function isIrrationalLongTermTransition(
  workNowTitles: string[],
  buildNextTitles: string[],
  longTermTitle: string,
  domain: ProfessionalDomain | null
): boolean {
  const lt = longTermTitle.toLowerCase()
  const workBlob = workNowTitles.join(' ').toLowerCase()
  const buildBlob = buildNextTitles.join(' ').toLowerCase()

  if (/laboratory|lab assistant|lab technician|research support|science assistant/i.test(workBlob)) {
    if (UNRELATED_SECTOR_LONG_TERM.test(lt) && !DOMAIN_PROGRESSION_LADDERS.science.longTermPattern.test(lt)) {
      return true
    }
  }

  if (/engineering technician|junior engineer|graduate engineer|cad|design engineer|r&d assistant/i.test(workBlob)) {
    if (/retail manager|store manager|warehouse supervisor|barista/i.test(lt) && !DOMAIN_PROGRESSION_LADDERS.engineering.longTermPattern.test(lt)) {
      return true
    }
  }

  if (/it support|helpdesk|technical support|qa tester|junior developer|junior it/i.test(workBlob)) {
    if (/warehouse supervisor|warehouse team leader|picker|packer|logistics coordinator/i.test(lt) && !DOMAIN_PROGRESSION_LADDERS.computer_science.longTermPattern.test(lt)) {
      return true
    }
  }

  if (!domain || domain === 'general') return false

  const ladder = DOMAIN_PROGRESSION_LADDERS[domain]
  if (ladder.longTermPattern.test(lt)) return false
  if (!ladder.workNowPattern.test(workBlob)) return false

  if (UNRELATED_SECTOR_LONG_TERM.test(lt)) return true

  // Work Now is domain-aligned but Long-Term sits outside that ladder (e.g. science → operations coordinator).
  return true
}

function domainForLadder(domain: ProfessionalDomain): CareerProfile['domain'] {
  switch (domain) {
    case 'computer_science':
      return 'IT_digital'
    case 'engineering':
      return 'construction_trades'
    case 'design_creative':
      return 'creative_media'
    case 'healthcare':
      return 'healthcare'
    case 'legal':
    case 'business':
      return 'admin_business'
    default:
      return 'no_experience_general'
  }
}

export function repairLongTermForFieldConsistency(
  longTerm: CareerBrainRecommendation[],
  workNow: CareerBrainRecommendation[],
  buildNext: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const domain = inferProfessionalDomain(profile, state)
  const workTitles = workNow.map((r) => r.title)
  const buildTitles = buildNext.map((r) => r.title)
  const ladder = DOMAIN_PROGRESSION_LADDERS[domain]
  const d = domainForLadder(domain)

  const kept = longTerm.filter(
    (item) => !isIrrationalLongTermTransition(workTitles, buildTitles, item.title, domain)
  )

  if (kept.length >= 2) return kept

  const replacements = ladder.longTerm.map((title) =>
    makeRec(
      title,
      `Long-Term Path — ${ladder.label} progression building on your Work Now and Build Next steps`,
      'long_term',
      d
    )
  )

  const titles = new Set(kept.map((r) => r.title.toLowerCase()))
  for (const rec of replacements) {
    if (kept.length >= 3) break
    if (titles.has(rec.title.toLowerCase())) continue
    kept.push(rec)
    titles.add(rec.title.toLowerCase())
  }

  return kept.slice(0, 5)
}

export function applyFieldCareerConsistencyRules(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  if (profile.constraints.includes('pathway-deterministic-locked')) {
    return recs
  }
  if (profile.constraints.includes('career-change-path')) {
    return recs
  }

  const s = state ?? { answers: {} }
  let workNow = recs.filter((r) => r.track === 'work_now')
  const buildNext = recs.filter((r) => r.track === 'build_next')
  const backup = recs.filter((r) => r.track === 'backup_income')
  const other = recs.filter(
    (r) => r.track !== 'work_now' && r.track !== 'build_next' && r.track !== 'long_term' && r.track !== 'backup_income'
  )

  const domain = inferProfessionalDomain(profile, s)
  const fieldAligned = userWantsFieldAlignedCareer(s, profile)

  if (fieldAligned && domain !== 'general') {
    const ladder = DOMAIN_PROGRESSION_LADDERS[domain]
    const d = domainForLadder(domain)
    if (workNow.length && !workNow.some((r) => ladder.workNowPattern.test(r.title))) {
      const inject = ladder.workNow.slice(0, 2).map((title) =>
        makeRec(title, `Work Now — closest realistic UK entry into ${ladder.label}`, 'work_now', d)
      )
      workNow = [...inject, ...workNow]
    }
  }

  const longTerm = fieldAligned
    ? repairLongTermForFieldConsistency(
        recs.filter((r) => r.track === 'long_term'),
        workNow,
        buildNext,
        profile,
        s
      )
    : recs.filter((r) => r.track === 'long_term')

  return [...workNow, ...buildNext, ...longTerm, ...backup, ...other]
}

export function buildFieldCareerConsistencyReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  if (!state) return []
  const lines: string[] = [
    'Career intelligence — recommendations balance education, experience, English level, UK readiness, interests, and your stated preferences (not degree title alone).',
  ]

  const domain = inferProfessionalDomain(profile, state)
  const ladder = DOMAIN_PROGRESSION_LADDERS[domain]
  if (userWantsFieldAlignedCareer(state, profile)) {
    lines.push(
      `Field alignment active — Work Now, Build Next, and Long-Term stay within ${ladder.label} wherever realistic, with the closest UK entry point first.`
    )
  }

  const cross = evaluateCrossSectorRecommendation(state, profile)
  if (cross.allowed && cross.reasons.length) {
    lines.push(cross.reasons[0]!)
  } else if (userWantsFieldAlignedCareer(state, profile)) {
    lines.push('Unrelated sectors are not suggested simply because they have more vacancies.')
  }

  if (isFieldAlignmentBoth(state)) {
    lines.push(
      'Path A (career-aligned): field Work Now where possible, domain-matched Build Next, and Long-Term progression.',
      'Path B (faster employment): flexible income roles — compare both before choosing.'
    )
  }

  if (profile.englishLevel) {
    lines.push(`English confidence (${profile.englishLevel}) shapes which communication-heavy roles are realistic now.`)
  }

  return lines
}

export function buildCareerPathComparisonSummary(
  profile: CareerProfile,
  state?: CareerBrainState
): string | null {
  if (!state) return null
  const domain = inferProfessionalDomain(profile, state)
  const ladder = DOMAIN_PROGRESSION_LADDERS[domain]
  const cross = evaluateCrossSectorRecommendation(state, profile)

  if (!userWantsFieldAlignedCareer(state, profile) && !cross.allowed) return null

  const pathA = `${ladder.workNow.slice(0, 2).join(' → ')} → ${ladder.buildNext[0] ?? 'training'} → ${ladder.longTerm[0] ?? 'long-term goal'}`
  const pathB = 'Retail / hospitality / warehouse roles for faster income while you build UK experience'

  if (isFieldAlignmentBoth(state) || (cross.allowed && userWantsFieldAlignedCareer(state, profile))) {
    return [
      'Compare your options:',
      `A) Career-aligned pathway — ${pathA}.`,
      `B) Faster-employment pathway — ${pathB}.`,
      cross.reasons[0] ?? 'You can pursue aligned progression while keeping flexible income options open.',
    ].join(' ')
  }

  return null
}

export function validateFieldCareerConsistencyIssues(
  workNow: CareerBrainRecommendation[],
  buildNext: CareerBrainRecommendation[],
  longTerm: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  const issues: string[] = []
  const domain = inferProfessionalDomain(profile, state)
  const workTitles = workNow.map((r) => r.title)
  const buildTitles = buildNext.map((r) => r.title)

  if (workNow.length === 0) issues.push('Work Now must show immediate income options')
  if (buildNext.length === 0) issues.push('Build Next must show 3–12 month progression steps')
  if (longTerm.length === 0) issues.push('Long-Term Path must show 3–5 year destinations')
  if (longTerm.length > 0 && buildNext.length === 0) {
    issues.push('Long-Term Path must not appear without Build Next intermediate steps')
  }

  for (const item of longTerm) {
    if (isIrrationalLongTermTransition(workTitles, buildTitles, item.title, domain)) {
      issues.push(`Long-Term "${item.title}" does not logically follow Work Now and Build Next`)
    }
  }

  return issues
}
