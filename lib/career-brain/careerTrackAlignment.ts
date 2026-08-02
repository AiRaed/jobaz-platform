/**
 * Career track families — Work Now drives Build Next and Long-Term consistency.
 */

import { inferBridgeField, type BridgeField } from './bridgeRoleIntelligence'
import {
  DOMAIN_PROGRESSION_LADDERS,
  inferProfessionalDomain,
  userWantsFieldAlignedCareer,
} from './fieldCareerConsistency'
import { getSpecialisationRecommendations, getSpecialisationValue } from './fieldSpecialisation'
import { wantsDualPathMode } from './dualPathMode'
import { prefersDirectEmployment } from './speedDevelopmentMode'
import { resolveWorkStyle } from './workStylePreferences'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'

export type CareerTrackFamily =
  | 'office_admin'
  | 'driving_logistics'
  | 'customer_service'
  | 'it'
  | 'security'
  | 'care'
  | 'legal'
  | 'creative'

type TrackLadder = {
  label: string
  buildNext: string[]
  longTerm: string[]
}

export const TRACK_LADDERS: Record<CareerTrackFamily, TrackLadder> = {
  office_admin: {
    label: 'Office & Administration',
    buildNext: [
      'Microsoft Office Certification',
      'Advanced Excel',
      'Business Administration Certificate',
      'Customer Service Certification',
      'Bookkeeping Basics',
    ],
    longTerm: [
      'Office Administrator',
      'Office Manager',
      'Operations Coordinator',
      'Business Support Manager',
    ],
  },
  driving_logistics: {
    label: 'Driving & Logistics',
    buildNext: ['Forklift Licence', 'HGV Training', 'CPC Qualification', 'Logistics Operations'],
    longTerm: [
      'Logistics Coordinator',
      'Transport Planner',
      'Fleet Supervisor',
      'Operations Supervisor',
    ],
  },
  customer_service: {
    label: 'Retail & Customer Service',
    buildNext: [
      'Customer Service Certification',
      'Team Leader Training',
      'CRM Systems Basics',
      'Hospitality Supervisor Course',
    ],
    longTerm: ['Customer Service Team Leader', 'Store Manager', 'Area Manager', 'Retail Operations Manager'],
  },
  it: {
    label: 'IT & Technology',
    buildNext: ['Google IT Support Certificate', 'CompTIA A+', 'Networking Skills', 'Technical Certifications'],
    longTerm: ['IT Support Specialist', 'Systems Administrator', 'Cybersecurity Analyst', 'Software Developer'],
  },
  security: {
    label: 'Security',
    buildNext: ['SIA Licence', 'CCTV Licence', 'Security Team Leader'],
    longTerm: ['Security Supervisor', 'Security Manager', 'Regional Security Manager'],
  },
  care: {
    label: 'Care & Healthcare',
    buildNext: ['Care Certificate', 'Moving & Handling training', 'Senior Healthcare Assistant'],
    longTerm: ['Senior Care Worker', 'Healthcare Coordinator', 'Team Leader (care)', 'Care Home Supervisor'],
  },
  legal: {
    label: 'Legal & Administration',
    buildNext: [
      'Junior Legal Assistant',
      'Legal Administrator',
      'Casework Officer',
    ],
    longTerm: ['Legal Assistant', 'Paralegal', 'Legal Operations Coordinator'],
  },
  creative: {
    label: 'Creative & Media',
    buildNext: [
      'Content Producer',
      'Junior Marketing Executive',
      'Digital Content Coordinator',
    ],
    longTerm: ['Motion Designer', 'Marketing Manager', 'Content Strategist'],
  },
}

/** Role-based Build Next when user is not open to courses or licences. */
const DIRECT_EMPLOYMENT_BUILD_NEXT: Partial<Record<CareerTrackFamily, string[]>> = {
  office_admin: ['Senior admin assistant', 'Operations support coordinator', 'Team administrator'],
  driving_logistics: ['Warehouse team leader', 'Shift coordinator (logistics)', 'Senior warehouse operative'],
  customer_service: [
    'Team supervisor (retail/hospitality)',
    'Shift coordinator',
    'Customer experience team leader',
  ],
  it: ['Junior IT support', 'Technical support assistant', 'Helpdesk coordinator'],
  security: ['Security team leader', 'Site supervisor', 'Operations coordinator'],
  care: ['Senior healthcare assistant', 'Care team leader', 'Support worker coordinator'],
  legal: ['Legal admin assistant', 'Casework assistant', 'Legal coordinator'],
  creative: ['Content Producer', 'Junior Marketing Executive', 'Digital Content Coordinator'],
}

const OFFICE_WORK_NOW =
  /data entry|office admin|reception|clerical|business support|dispatch|scheduling|transport admin|bookkeep|finance admin|paralegal|legal admin|legal reception/i

const LOGISTICS_WORK_NOW =
  /warehouse|forklift|picker|packer|delivery|driver|courier|hgv|logistics operative|transport operative/i

const CUSTOMER_WORK_NOW =
  /retail|shop assistant|sales assistant|barista|waiter|hospitality|customer service|call centre|host\b|front of house/i

const ENGINEERING_WORK_NOW =
  /mechanical|electrical|civil|engineering technician|cad technician|manufacturing engineer|graduate engineer|design engineer|r&d|process engineer|project assistant/i

const IT_WORK_NOW = /it support|helpdesk|technical support|junior it|digital support|qa tester|software/i

const SECURITY_WORK_NOW = /security officer|door supervisor|cctv|sia/i

const CARE_WORK_NOW = /care assistant|support worker|healthcare assistant|nursing|nhs|patient/i

const LEGAL_WORK_NOW = /legal|paralegal|law|casework|legal reception/i

const CREATIVE_WORK_NOW = /animator|motion|video|creative|content|design|production assistant|social media/i

const SCIENCE_WORK_NOW =
  /laboratory|lab assistant|lab technician|research assistant|research support|science technician|science assistant|quality control/i

const LOGISTICS_BUILD =
  /forklift|hgv|cpc|logistics operations|warehouse supervisor|cscs construction|picker packer/i

const OFFICE_BUILD =
  /microsoft office|advanced excel|business administration|bookkeeping|customer service cert|office administration|excel for business|digital support \/ admin|project coordination|data analysis/i

const CUSTOMER_BUILD = /customer service cert|team leader training|crm|hospitality supervisor|food safety/i

const IT_BUILD = /comptia|google it support|networking|technical cert|it support fundamentals/i

function scoreFamily(blob: string, pattern: RegExp): number {
  const matches = blob.match(new RegExp(pattern.source, 'gi'))
  return matches?.length ?? 0
}

/** Infer primary career track from Work Now titles (preferences override domain noise). */
export function inferCareerTrackFamily(
  workNow: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerTrackFamily {
  const blob = workNow.map((r) => r.title).join(' ').toLowerCase()
  const style = resolveWorkStyle(profile, state)
  const nonPhysical = profile.constraints.includes('non-physical')
  const noCustomer = profile.constraints.includes('no-customer-facing')

  if (
    state &&
    userWantsFieldAlignedCareer(state, profile) &&
    inferProfessionalDomain(profile, state) === 'science' &&
    SCIENCE_WORK_NOW.test(blob)
  ) {
    return 'office_admin'
  }

  if (!wantsDualPathMode(profile, state)) {
    const studyFamily = studyFieldTrackFamily(profile, state)
    if (studyFamily === 'legal' && LEGAL_WORK_NOW.test(blob)) return 'legal'
    if (studyFamily === 'it' && IT_WORK_NOW.test(blob)) return 'it'
    if (studyFamily === 'care' && CARE_WORK_NOW.test(blob)) return 'care'
    if (studyFamily === 'creative' && CREATIVE_WORK_NOW.test(blob)) return 'creative'
    if (studyFamily === 'office_admin' && OFFICE_WORK_NOW.test(blob) && !LEGAL_WORK_NOW.test(blob)) {
      return 'office_admin'
    }
  }

  const scores: Array<{ family: CareerTrackFamily; score: number }> = [
    { family: 'office_admin', score: scoreFamily(blob, OFFICE_WORK_NOW) * 3 },
    { family: 'driving_logistics', score: scoreFamily(blob, LOGISTICS_WORK_NOW) * 3 },
    { family: 'customer_service', score: scoreFamily(blob, CUSTOMER_WORK_NOW) * 3 },
    { family: 'it', score: scoreFamily(blob, IT_WORK_NOW) * 3 },
    { family: 'security', score: scoreFamily(blob, SECURITY_WORK_NOW) * 3 },
    { family: 'care', score: scoreFamily(blob, CARE_WORK_NOW) * 3 },
    { family: 'legal', score: scoreFamily(blob, LEGAL_WORK_NOW) * 3 },
    { family: 'creative', score: scoreFamily(blob, CREATIVE_WORK_NOW) * 3 },
  ]

  if (noCustomer) {
    const cs = scores.find((s) => s.family === 'customer_service')
    if (cs) cs.score = Math.max(0, cs.score - 5)
  }
  if (nonPhysical) {
    const lg = scores.find((s) => s.family === 'driving_logistics')
    if (lg) lg.score = Math.max(0, lg.score - 8)
    const office = scores.find((s) => s.family === 'office_admin')
    if (office) office.score += 6
  }
  if (nonPhysical || style === 'office') {
    const office = scores.find((s) => s.family === 'office_admin')
    if (office && scoreFamily(blob, OFFICE_WORK_NOW) > 0 && !IT_WORK_NOW.test(blob) && !LEGAL_WORK_NOW.test(blob)) {
      office.score += 4
    }
  }
  if (style === 'physical') {
    const lg = scores.find((s) => s.family === 'driving_logistics')
    if (lg) lg.score += 4
  }
  if (style === 'people') {
    const cs = scores.find((s) => s.family === 'customer_service')
    if (cs) cs.score += 4
  }
  if (style === 'technical') {
    const it = scores.find((s) => s.family === 'it')
    if (it) it.score += 4
  }

  scores.sort((a, b) => b.score - a.score)
  if (scores[0]?.score > 0) return scores[0].family

  const fieldBlob = `${profile.workExperienceField ?? ''} ${profile.studyField ?? ''} ${profile.targetField ?? ''}`.toLowerCase()
  if (/legal|law|paralegal/.test(fieldBlob)) return 'legal'
  if (/it|comput|software|technology/.test(fieldBlob)) return 'it'
  if (/care|health|nursing/.test(fieldBlob)) return 'care'
  if (/animat|creative|design|media/.test(fieldBlob)) return 'creative'
  if (/security|sia/.test(fieldBlob)) return 'security'
  if (/science|biology|chemistry|physics|laboratory|lab technician/.test(fieldBlob) && SCIENCE_WORK_NOW.test(blob)) {
    return 'office_admin'
  }
  if (/engineer|mechanical|electrical|civil|manufacturing|cad technician/i.test(fieldBlob)) return 'it'
  if (nonPhysical || style === 'office') return 'office_admin'
  if (style === 'physical') return 'driving_logistics'
  if (style === 'people') return 'customer_service'

  return 'office_admin'
}

export function trackLabel(family: CareerTrackFamily): string {
  return TRACK_LADDERS[family].label
}

/** Dual-path / open-both — degree-aligned training and destinations stay even when Work Now is flexible. */
export function isStudyAlignedProgression(title: string, profile: CareerProfile): boolean {
  const field = inferBridgeField(profile.studyField, profile.targetField)
  const t = title.toLowerCase()
  const byField: Partial<Record<BridgeField, RegExp>> = {
    law: /legal|paralegal|casework|solicitor|legal admin|legal research|legal assistant/i,
    computer_science: /it support|comptia|google it|helpdesk|software|developer|cyber|networking|technical support|data analyst/i,
    medicine: /healthcare|clinical|medical|pharmacy|nhs|care assistant|health/i,
    nursing: /healthcare|nursing|care|nhs|clinical/i,
    healthcare: /healthcare|care|nhs|clinical|support worker/i,
    animation: /animator|motion|video|creative|content|design|production/i,
    engineering: /engineering|technician|cad|site assistant/i,
    finance: /finance|account|bookkeep|payroll|audit/i,
    business: /business admin|marketing|operations|administration certificate/i,
  }
  const pattern = byField[field]
  return pattern ? pattern.test(t) : false
}

export function studyFieldTrackFamily(
  profile: CareerProfile,
  state?: CareerBrainState
): CareerTrackFamily | null {
  const spec = getSpecialisationValue(state ?? { answers: {} })
  if (spec === 'software') return 'it'
  if (spec && ['mechanical', 'civil', 'electrical', 'industrial', 'chemical'].includes(spec)) {
    return null
  }

  const study = (profile.studyField ?? '').toLowerCase()
  if (/software engineer|computer engineer|software engineering|developer|cyber|data analytics/i.test(study)) {
    return 'it'
  }
  if (/mechanical|civil engineer|electrical engineer|process engineer|manufacturing engineer/i.test(study)) {
    return null
  }

  const field = inferBridgeField(profile.studyField, profile.targetField)
  const map: Partial<Record<BridgeField, CareerTrackFamily>> = {
    law: 'legal',
    computer_science: 'it',
    medicine: 'care',
    nursing: 'care',
    healthcare: 'care',
    animation: 'creative',
    engineering: 'it',
    finance: 'office_admin',
    business: 'office_admin',
  }
  return map[field] ?? null
}

export function buildNextMatchesTrack(title: string, family: CareerTrackFamily): boolean {
  const t = title.toLowerCase()
  switch (family) {
    case 'office_admin':
      return OFFICE_BUILD.test(t) || /junior|assistant|trainee|coordinator/i.test(t)
    case 'driving_logistics':
      return LOGISTICS_BUILD.test(t) || /senior warehouse|senior driver|forklift operator/i.test(t)
    case 'customer_service':
      return CUSTOMER_BUILD.test(t) || /senior retail|team leader/i.test(t)
    case 'it':
      return (
        IT_BUILD.test(t) ||
        /junior it|technical support|solidworks|cad|hnc|btec|mechanical|cloud fundamentals|graduate software|process safety|18th edition|ecs|lean|six sigma/i.test(
          t
        )
      )
    case 'security':
      return /sia|cctv|security team leader|first aid/i.test(t)
    case 'care':
      return /care certificate|moving|senior healthcare|nhs preparation/i.test(t)
    case 'legal':
      return /legal administration|legal research|office administration certificate/i.test(t)
    case 'creative':
      return /video editing|motion graphics|content production|senior production/i.test(t)
    default:
      return true
  }
}

export function longTermMatchesTrack(title: string, family: CareerTrackFamily): boolean {
  const t = title.toLowerCase()
  const ladder = TRACK_LADDERS[family].longTerm.map((x) => x.toLowerCase())
  if (ladder.some((l) => t.includes(l) || l.includes(t))) return true

  switch (family) {
    case 'office_admin':
      return /office admin|office manager|operations coordinator|business support|administrator|coordinator|manager/i.test(t) &&
        !LOGISTICS_WORK_NOW.test(t)
    case 'driving_logistics':
      return /logistics|transport|fleet|delivery|warehouse supervisor|operations supervisor|planner/i.test(t)
    case 'customer_service':
      return /store manager|area manager|retail|customer|team leader|hospitality|venue manager/i.test(t)
    case 'it':
      return /it support|systems admin|cyber|software|developer|analyst|helpdesk|design engineer|process engineer|chemical engineer|civil engineer|industrial engineer|electrical engineer/i.test(
        t
      )
    case 'security':
      return /security supervisor|security manager|regional security/i.test(t)
    case 'care':
      return /care|healthcare|nursing|supervisor/i.test(t)
    case 'legal':
      return /legal|paralegal|solicitor|casework/i.test(t)
    case 'creative':
      return /animator|motion|creative|content|producer|director/i.test(t)
    default:
      return true
  }
}

export function buildNextConflictsWithTrack(title: string, family: CareerTrackFamily): boolean {
  const t = title.toLowerCase()
  if (family === 'office_admin' && LOGISTICS_BUILD.test(t)) return true
  if (family === 'office_admin' && /sia licence|cscs construction|care assistant cert|food safety/i.test(t)) return true
  if (family === 'office_admin' && IT_BUILD.test(t) && !OFFICE_BUILD.test(t)) return true
  if (family === 'driving_logistics' && OFFICE_BUILD.test(t) && !LOGISTICS_BUILD.test(t)) return true
  if (family === 'customer_service' && LOGISTICS_BUILD.test(t)) return true
  if (family === 'it' && LOGISTICS_BUILD.test(t) && !IT_BUILD.test(t)) return true
  if (family === 'legal' && LOGISTICS_BUILD.test(t) && !/legal/i.test(t)) return true
  return false
}

function domainAlignedTrackLadder(
  workNow: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): TrackLadder | null {
  if (!state || !userWantsFieldAlignedCareer(state, profile)) return null
  const domain = inferProfessionalDomain(profile, state)
  if (domain !== 'science' && domain !== 'engineering') return null

  const dl = DOMAIN_PROGRESSION_LADDERS[domain]
  const blob = workNow.map((r) => r.title).join(' ')
  if (!dl.workNowPattern.test(blob) && !SCIENCE_WORK_NOW.test(blob)) return null

  if (prefersDirectEmployment(profile, state)) {
    const directBuild =
      domain === 'science'
        ? ['Laboratory Technician', 'Quality Control Coordinator', 'Research Support Officer']
        : ['Junior Engineer', 'CAD Technician', 'Engineering Coordinator']
    return { label: dl.label, buildNext: directBuild, longTerm: dl.longTerm }
  }

  return { label: dl.label, buildNext: dl.buildNext, longTerm: dl.longTerm }
}

export function getTrackLadder(
  workNow: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): TrackLadder {
  const specPack = getSpecialisationRecommendations(state, profile)
  if (specPack?.length) {
    const buildNext = specPack.filter((r) => r.track === 'build_next').map((r) => r.title)
    const longTerm = specPack.filter((r) => r.track === 'long_term').map((r) => r.title)
    if (prefersDirectEmployment(profile, state)) {
      const family = inferCareerTrackFamily(workNow, profile, state)
      const direct = DIRECT_EMPLOYMENT_BUILD_NEXT[family] ?? buildNext
      return {
        label: 'Field specialisation',
        buildNext: direct.length ? direct : buildNext,
        longTerm,
      }
    }
    return {
      label: 'Field specialisation',
      buildNext,
      longTerm,
    }
  }

  const domainLadder = domainAlignedTrackLadder(workNow, profile, state)
  if (domainLadder) return domainLadder

  if (wantsDualPathMode(profile, state)) {
    const studyFamily = studyFieldTrackFamily(profile, state)
    if (studyFamily) {
      const ladder = TRACK_LADDERS[studyFamily]
      if (prefersDirectEmployment(profile, state)) {
        const direct = DIRECT_EMPLOYMENT_BUILD_NEXT[studyFamily] ?? DIRECT_EMPLOYMENT_BUILD_NEXT.office_admin!
        return { ...ladder, buildNext: direct }
      }
      return ladder
    }
  }
  const family = inferCareerTrackFamily(workNow, profile, state)
  const ladder = TRACK_LADDERS[family]
  if (prefersDirectEmployment(profile, state)) {
    const direct = DIRECT_EMPLOYMENT_BUILD_NEXT[family] ?? []
    return {
      ...ladder,
      buildNext: direct.length ? direct : ['Team supervisor (retail/hospitality)', 'Shift coordinator'],
    }
  }
  return ladder
}
