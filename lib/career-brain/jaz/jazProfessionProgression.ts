/**
 * Profession-specific career ladders — built from JAZ conversation evidence.
 */

import {
  isSoftwareIcTrack,
  isSoftwareManagementTrack,
  pickEducationLadder,
  pickHealthcareLadder,
  pickSoftwareLadder,
} from '../growCareerProfessionLadders'
import { buildEvidencePhrase } from '../growCareerEvidenceReasoning'
import { buildJazUnderstanding, inferJazProfessionTrack } from './jazUnderstanding'
import type { JazProfessionTrack, JazUnderstanding } from './jazTypes'
import { labelGrowCareerExperienceYears, resolveGrowCareerCurrentJobTitle } from '../growCareerPath'
import { extractRoleCore } from '../growCareerGrowthAdvisor'
import type { CareerBrainState } from '../types'
import type { DynamicProgression } from '../growCareerGrowthAdvisor'

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function str(state: CareerBrainState, key: string): string {
  return String(answers(state)[key] ?? '').trim()
}

function arr(state: CareerBrainState, key: string): string[] {
  const raw = answers(state)[key]
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string' && raw.trim()) return [raw]
  return []
}

function baseProgression(
  workNow: string,
  buildNext: string,
  longTerm: string,
  state: CareerBrainState,
  reasonParts: string[]
): DynamicProgression {
  const devTime = str(state, 'jaz_dev_time') || str(state, 'cb_grow_dev_time') || '3_12_months'
  const nextStepTimeline =
    devTime === 'under_3_months'
      ? '3–9 months'
      : devTime === '3_12_months'
        ? '6–18 months'
        : devTime === '1_2_years'
          ? '12–24 months'
          : '18–36 months'
  const longTermTimeline =
    devTime === 'under_3_months' ? '2–4 years' : devTime === '3_12_months' ? '3–5 years' : '4–7 years'

  return {
    workNowTitle: workNow,
    buildNextTitle: buildNext,
    longTermTitle: longTerm,
    nextStepReason: reasonParts.join(' '),
    nextStepTimeline,
    longTermTimeline,
  }
}

function inferEducationProgression(state: CareerBrainState, u: JazUnderstanding): DynamicProgression {
  const jobTitle = u.jobTitle ?? 'Teaching Assistant'
  const qual = str(state, 'jaz_edu_qualification')
  const responsibilities = arr(state, 'jaz_edu_responsibilities')
  const ladder = pickEducationLadder(state, jobTitle)

  const workNow = jobTitle.replace(/\b(junior|senior)\b/gi, '').trim() || ladder.workNowTitle
  let buildNext = ladder.buildNextTitle
  let longTerm = ladder.longTermTitle

  if (qual === 'qts' || /qualified teacher/i.test(jobTitle)) {
    buildNext = 'Senior Teacher / Subject Lead'
    longTerm = 'Head of Department (possible future direction)'
  }

  const reasonParts = [
    buildEvidencePhrase(state, 'education'),
    responsibilities.length
      ? `Your classroom responsibilities (${responsibilities.slice(0, 2).join(', ')}) support the next rung: ${buildNext}.`
      : `Your next realistic step in UK schools is ${buildNext} — not a change of sector.`,
  ]

  return baseProgression(workNow, buildNext, longTerm, state, reasonParts)
}

function inferSoftwareProgression(state: CareerBrainState, u: JazUnderstanding): DynamicProgression {
  const jobTitle = u.jobTitle ?? 'Software Developer'
  const stack = str(state, 'jaz_tech_stack')
  const architecture = str(state, 'jaz_tech_architecture')
  const progression = str(state, 'jaz_tech_progression')

  const stackLabel = stack ? stack.replace(/_/g, ' ') : 'your stack'
  const ladder = pickSoftwareLadder(state, jobTitle)
  const workNow = jobTitle
  let buildNext = ladder.buildNextTitle
  let longTerm = ladder.longTermTitle

  if (isSoftwareIcTrack(state) && !isSoftwareManagementTrack(state)) {
    if (/engineering manager|head of engineering|director/i.test(buildNext)) {
      buildNext = 'Mid-Level Developer'
    }
    if (/engineering manager|head of engineering|director/i.test(longTerm)) {
      longTerm = progression === 'specialist' ? 'Staff Engineer' : 'Senior Developer (possible future direction)'
    }
  }

  if (progression === 'specialist' && buildNext === 'Senior Developer') {
    longTerm = 'Staff Engineer (possible future direction)'
  }
  if (progression === 'product') {
    longTerm = 'Technical Product Lead (possible future direction)'
  }

  const archLabel = architecture ? architecture.replace(/_/g, ' ') : 'delivery'
  const reasonParts = [
    buildEvidencePhrase(state, 'software'),
    `Your ${stackLabel} stack, ${labelGrowCareerExperienceYears(state)} experience, and ${archLabel} exposure support ${buildNext} as the immediate next step.`,
    'This stays inside software engineering — not a generic employment fallback.',
  ]
  return baseProgression(workNow, buildNext, longTerm, state, reasonParts)
}

function inferHealthcareProgression(state: CareerBrainState, u: JazUnderstanding): DynamicProgression {
  const jobTitle = u.jobTitle ?? 'Healthcare Professional'
  const specialty = str(state, 'jaz_health_specialty')
  const sector = str(state, 'jaz_health_sector')
  const ladder = pickHealthcareLadder(state, jobTitle)

  const workNow = jobTitle
  const buildNext = ladder.buildNextTitle
  let longTerm = ladder.longTermTitle

  if (specialty === 'mental_health' && /band 7|clinical lead/i.test(longTerm)) {
    longTerm = 'Band 7 Clinical Nurse Specialist (possible future direction)'
  }

  const reasonParts = [
    buildEvidencePhrase(state, 'healthcare'),
    `In ${sector ? sector.replace(/_/g, ' ') : 'UK healthcare'} with ${specialty ? specialty.replace(/_/g, ' ') : 'your clinical area'} focus, ${buildNext} is the immediate next rung.`,
    'Progression stays in healthcare — not retail or warehouse roles.',
  ]
  return baseProgression(workNow, buildNext, longTerm, state, reasonParts)
}

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase())
}

function inferCreativeProgression(state: CareerBrainState, u: JazUnderstanding): DynamicProgression {
  const jobTitle = u.jobTitle ?? 'Designer'
  const core = titleCase(extractRoleCore(jobTitle))
  const portfolio = str(state, 'jaz_creative_portfolio')
  const progression = str(state, 'jaz_creative_progression')
  const seniority = str(state, 'jaz_creative_seniority')

  let workNow = titleCase(jobTitle)
  let buildNext = `Senior ${core}`
  let longTerm = progression === 'creative_direction' ? 'Creative Director' : `Lead ${core}`

  if (seniority === 'senior' || /senior/i.test(jobTitle)) {
    workNow = /senior/i.test(jobTitle) ? titleCase(jobTitle) : `Senior ${core}`
    buildNext = progression === 'creative_direction' ? 'Creative Director' : `Lead ${core}`
    longTerm = progression === 'freelance' ? 'Senior Freelance / Own Clients' : 'Creative Director'
  } else if (portfolio === 'none' || portfolio === 'basic') {
    buildNext = core
    longTerm = `Senior ${core}`
  } else if (progression === 'art_direction') {
    longTerm = 'Art Director'
  }

  const reasonParts = [
    `Portfolio status (${portfolio || 'from your answers'}) supports ${buildNext} as the next step in ${core}.`,
    'Path stays in creative/media — not generic customer service roles.',
  ]
  return baseProgression(workNow, buildNext, longTerm, state, reasonParts)
}

function inferEngineeringProgression(state: CareerBrainState, u: JazUnderstanding): DynamicProgression {
  const jobTitle = u.jobTitle ?? 'Engineer'
  const core = titleCase(extractRoleCore(jobTitle))
  const qual = str(state, 'jaz_eng_qualification')
  const specialism = str(state, 'jaz_eng_specialism')
  const progression = str(state, 'jaz_eng_progression')
  const seniority = str(state, 'jaz_eng_seniority')

  let workNow = titleCase(jobTitle)
  let buildNext = `Senior ${core}`
  let longTerm = progression === 'chartered' ? `Chartered ${core}` : progression === 'engineering_manager' ? 'Engineering Manager' : `Lead ${core}`

  if (seniority === 'graduate' || /graduate|junior/i.test(jobTitle)) {
    buildNext = core
    longTerm = progression === 'engineering_manager' ? 'Engineering Manager' : `Senior ${core}`
  } else if (progression === 'project_manager') {
    buildNext = 'Project Engineer / Coordinator'
    longTerm = 'Project Manager'
  } else if (qual === 'chartered') {
    longTerm = `Principal ${core} / Engineering Manager`
  }

  const reasonParts = [
    `${qual ? qual.replace(/_/g, ' ') + ' qualification' : 'Your engineering background'} in ${specialism || 'your discipline'} supports ${buildNext}.`,
    'Progression remains in engineering.',
  ]
  return baseProgression(workNow, buildNext, longTerm, state, reasonParts)
}

function inferFinanceProgression(state: CareerBrainState, u: JazUnderstanding): DynamicProgression {
  const jobTitle = u.jobTitle ?? 'Accountant'
  const qual = str(state, 'jaz_fin_qualification')
  const specialism = str(state, 'jaz_fin_specialism')
  const progression = str(state, 'jaz_fin_progression')
  const seniority = str(state, 'jaz_fin_seniority')

  let workNow = jobTitle
  let buildNext = 'Senior Accountant'
  let longTerm = progression === 'controller' ? 'Financial Controller' : 'Finance Manager'

  if (qual === 'none' || qual === 'aats') {
    buildNext = 'AAT Level 4 / Assistant Accountant'
    longTerm = 'Qualified Accountant (ACCA/CIMA pathway)'
  } else if (seniority === 'partly_qualified') {
    buildNext = 'Part-Qualified Accountant'
    longTerm = 'Qualified Accountant'
  } else if (progression === 'specialist') {
    longTerm = `${specialism || 'Technical'} Specialist (Tax/Audit)`
  }

  const reasonParts = [
    `${qual.replace(/_/g, ' ') || 'Your finance background'} and ${specialism || 'reporting'} work indicate ${buildNext} next.`,
    'Finance progression — not generic admin roles.',
  ]
  return baseProgression(workNow, buildNext, longTerm, state, reasonParts)
}

export function inferProfessionProgression(state: CareerBrainState): DynamicProgression | null {
  const u = buildJazUnderstanding(state)
  const jobTitle = u.jobTitle ?? resolveGrowCareerCurrentJobTitle(state)
  if (!jobTitle || jobTitle === 'Professional') return null

  const track = u.professionTrack ?? inferJazProfessionTrack(jobTitle)

  switch (track) {
    case 'education':
      return inferEducationProgression(state, u)
    case 'software':
      return inferSoftwareProgression(state, u)
    case 'healthcare':
      return inferHealthcareProgression(state, u)
    case 'creative':
      return inferCreativeProgression(state, u)
    case 'engineering':
      return inferEngineeringProgression(state, u)
    case 'finance':
      return inferFinanceProgression(state, u)
    default:
      return null
  }
}

export const GENERIC_FALLBACK_JOB_PATTERN =
  /warehouse|retail assistant|shop assistant|hospitality|barista|kitchen porter|waiter|waitress|care assistant|customer service advisor|picker.?packer|cleaner \(commercial\)/i

export function isGenericFallbackJob(title: string, track: JazProfessionTrack | null): boolean {
  if (!GENERIC_FALLBACK_JOB_PATTERN.test(title)) return false
  if (!track || track === 'general') return true
  return true
}

export function getProfessionTrack(state: CareerBrainState): JazProfessionTrack {
  const u = buildJazUnderstanding(state)
  const title = u.jobTitle ?? resolveGrowCareerCurrentJobTitle(state)
  return u.professionTrack ?? inferJazProfessionTrack(title)
}
