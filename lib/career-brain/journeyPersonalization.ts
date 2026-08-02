/**
 * Personalized journey summary and practical next steps — Rule 2, 4, 6, 7.
 */

import { inferCareerTrackFamily, type CareerTrackFamily } from './careerTrackAlignment'
import {
  getCommittedCareerPathLabel,
  hasCommittedCareerPath,
  outcomeForCommittedPath,
  resolvePathDirectionLabel,
  whyFitForRecommendation,
} from './pathContext'
import { readinessForTrack, detectPathStrategyMode, type PathStrategyMode } from './pathStrategy'
import { getExperienceTier } from './entryClassification'
import { getFieldAlignment } from './fieldAlignment'
import { isFirstJobPath, studyFieldLabel } from './firstJobEducationPath'
import { isStartNewCareerGoal } from './userGoal'
import { getCertOpenness, getWorkSpeed } from './speedDevelopmentMode'
import { resolveWorkStyle, workStyleLabel } from './workStylePreferences'
import type {
  CareerBrainRecommendation,
  CareerBrainState,
  CareerProfile,
  CareerPathRole,
} from './types'

function answers(state?: CareerBrainState): Record<string, unknown> {
  return state?.answers ?? {}
}

function joinClauses(clauses: string[]): string {
  if (clauses.length === 0) return ''
  if (clauses.length === 1) return clauses[0]
  if (clauses.length === 2) return `${clauses[0]} and ${clauses[1]}`
  return `${clauses.slice(0, -1).join(', ')}, and ${clauses[clauses.length - 1]}`
}

function hasDrivingLicence(profile: CareerProfile, state?: CareerBrainState): boolean {
  const a = answers(state)
  return a.cb_uk_driving_licence === 'yes' || a.cb_driving_licence === 'yes' || profile.licences.length > 0
}

function englishClause(level: string | null): string | null {
  switch (level) {
    case 'fluent':
      return 'strong English skills'
    case 'good':
    case 'comfortable':
      return 'good workplace English'
    case 'intermediate':
    case 'functional':
      return 'developing workplace English'
    case 'basic':
      return 'basic English — improving this will unlock more roles'
    default:
      return null
  }
}

function situationClause(state?: CareerBrainState): string | null {
  const a = answers(state)
  const situation = String(a.cb_entry_situation ?? '')
  if (isFirstJobPath(state ?? { answers: {} })) return 'you are seeking your first job'
  if (String(a.cb_user_goal ?? '') === 'unemployed') return 'you are unemployed and looking for work'
  if (situation === 'graduate_little_exp') return 'you are a recent graduate building UK experience'
  if (situation === 'unemployed_urgent') return 'you need work urgently'
  if (isStartNewCareerGoal(String(a.cb_user_goal ?? ''))) return 'you are starting a new career in the UK'
  if (situation === 'career_change') return 'you are planning a career change'
  if (situation === 'new_to_uk' || state?.answers?.cb_new_to_uk === 'yes') {
    return state?.answers?.cb_international_experience === 'yes'
      ? 'you are new to the UK with international experience to transfer'
      : 'you are new to the UK and building local work history'
  }
  if (situation === 'student_part_time') return 'you are a student looking for part-time work'
  if (situation === 'exploring') return 'you are exploring realistic UK career options'
  return null
}

/** Path label for explanations — committed field first, then role signals (never unrelated domain fallback). */
export function inferRecommendedPathLabelFromRoles(
  workNow: CareerPathRole[] | CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): string {
  return resolvePathDirectionLabel(workNow, profile, state)
}

function outcomeForTrack(
  pathLabel: string,
  workNow: CareerPathRole[],
  profile: CareerProfile,
  state?: CareerBrainState
): string {
  const top = workNow.slice(0, 2).map((r) => r.title.toLowerCase())
  const tier = state ? getExperienceTier(state) : null
  const buildingHistory =
    tier === 'no_experience' ||
    profile.yearsOfExperience === 0 ||
    profile.experienceCountry === 'non-UK'

  if (/office|administration|data entry/i.test(pathLabel) || /data entry|office admin|reception|dispatch/i.test(top.join(' '))) {
    return buildingHistory
      ? 'Entry-level administration and data-entry roles provide a realistic starting point while helping you build UK work history.'
      : 'Office and administration roles offer a stable route with clear progression into coordination and management.'
  }
  if (/logistics|driving/i.test(pathLabel)) {
    return 'Logistics and transport roles offer fast entry with licences and experience leading to better-paid coordination roles.'
  }
  if (/customer|retail/i.test(pathLabel)) {
    return 'Customer-facing roles offer quick entry income with a realistic ladder toward team leadership.'
  }
  if (/it|technology/i.test(pathLabel)) {
    return 'IT support and technical entry roles build toward specialist certifications and higher-responsibility tech careers.'
  }
  if (/legal/i.test(pathLabel)) {
    return 'Legal administration entry routes support your qualification while you build UK work history.'
  }
  if (/care|healthcare/i.test(pathLabel)) {
    return 'Care and support roles offer regulated entry with progression into senior care and coordination.'
  }
  if (isFirstJobPath(state ?? { answers: {} }) && getFieldAlignment(state ?? { answers: {} }) === 'no') {
    return 'This balances urgent income now with Build Next steps so your education still supports long-term growth.'
  }
  if (/engineering/i.test(pathLabel)) {
    return 'Engineering entry routes build UK experience while keeping Build Next and Long-Term aligned with your discipline.'
  }
  return 'Work Now, Build Next, and Long-Term stay on the same career path as you build UK experience.'
}

/** "Why this path?" — references actual answers and final Work Now roles. */
export function buildWhyThisPathExplanation(
  profile: CareerProfile,
  state?: CareerBrainState,
  workNow?: CareerPathRole[]
): string {
  const clauses: string[] = []
  const a = answers(state)

  const situation = situationClause(state)
  if (situation) clauses.push(situation)

  const tier = state ? getExperienceTier(state) : null
  if (tier === 'no_experience' && !situation?.includes('first job')) {
    clauses.push('you have little or no work experience yet')
  }

  const eng = englishClause(profile.englishLevel)
  if (eng) clauses.push(eng)

  if (hasDrivingLicence(profile, state)) {
    clauses.push('a UK driving licence')
  } else if (a.cb_uk_driving_licence === 'no') {
    clauses.push('no UK driving licence yet')
  }

  const style = resolveWorkStyle(profile, state)
  if (profile.constraints.includes('non-physical') || style === 'office') {
    clauses.push('a preference for office-based or non-physical work')
  } else if (profile.constraints.includes('physical-work') || style === 'physical') {
    clauses.push('a preference for physical or practical work')
  } else if (profile.constraints.includes('no-customer-facing')) {
    clauses.push('a preference for roles with minimal customer contact')
  } else if (style === 'people' || String(a.cb_entry_work_preference) === 'customer_facing') {
    clauses.push('a preference for customer-facing work')
  }

  const speed = getWorkSpeed(state)
  if (speed === 'urgent' && !situation?.includes('urgently')) {
    clauses.push('an urgent need for income')
  }

  const cert = getCertOpenness(state)
  if (cert === 'yes') clauses.push('willingness to take short training')
  else if (cert === 'direct_only') clauses.push('limited interest in further study right now')

  if (
    isFirstJobPath(state ?? { answers: {} }) &&
    ['yes', 'both'].includes(getFieldAlignment(state ?? { answers: {} }) ?? '')
  ) {
    clauses.push(
      `a ${studyFieldLabel(String(a.cb_first_job_study_field ?? profile.studyField ?? 'qualification'))} background you want to use`
    )
  }

  const pathLabel = inferRecommendedPathLabelFromRoles(workNow ?? [], profile, state)
  const reason =
    clauses.length > 0
      ? joinClauses(clauses)
      : 'your answers point to realistic UK entry roles with room to grow'

  const outcome = hasCommittedCareerPath(profile, state)
    ? outcomeForCommittedPath(pathLabel, profile, state)
    : outcomeForTrack(pathLabel, workNow ?? [], profile, state)

  if (workNow?.length) {
    const roleNames = workNow
      .slice(0, 2)
      .map((r) => r.title)
      .join(' and ')
    const fieldPhrase = hasCommittedCareerPath(profile, state)
      ? getCommittedCareerPathLabel(profile, state) ?? pathLabel
      : pathLabel
    return `Based on your profile — ${reason} — ${roleNames} support your ${fieldPhrase} pathway. ${outcome}`
  }

  return `Based on your profile — ${reason}. ${outcome}`
}

export function buildCareerLadderSummary(
  workNow: CareerPathRole[],
  buildNext: CareerPathRole[],
  longTerm: CareerPathRole[]
): string {
  const w = workNow.slice(0, 2).map((r) => r.title).join(' / ')
  const b = buildNext.slice(0, 3).map((r) => r.title).join(' / ')
  const l = longTerm.slice(0, 3).map((r) => r.title).join(' / ')
  if (!w && !b && !l) return ''
  return [w, b, l].filter(Boolean).join(' → ')
}

/** Rule 2 — short personalized summary from actual answers and recommendations. */
export function buildPersonalizedJourneySummary(
  profile: CareerProfile,
  state?: CareerBrainState,
  workNow?: CareerPathRole[]
): string {
  return buildWhyThisPathExplanation(profile, state, workNow)
}

/** Rule 4 — positive framing for no-experience users. */
export function softenBarrierLanguage(text: string): string {
  return text
    .replace(/\blimited uk work experience\b/gi, 'building UK work history and local references')
    .replace(/\black of experience\b/gi, 'early career stage')
    .replace(/\blimited experience\b/gi, 'developing experience')
    .replace(/\bno experience\b/gi, 'early career stage')
}

/** Rule 6 — practical next steps matched to the recommended path. */
export function buildPracticalNextSteps(
  profile: CareerProfile,
  state?: CareerBrainState,
  workNow?: CareerPathRole[]
): Array<{ action: string; label: string; href?: string }> {
  const cert = getCertOpenness(state)
  const urgent = getWorkSpeed(state) === 'urgent' || profile.urgencyLevel === 'high'
  const steps: Array<{ action: string; label: string; href?: string }> = []

  const committed = getCommittedCareerPathLabel(profile, state)
  const family: CareerTrackFamily | null = workNow?.length
    ? inferCareerTrackFamily(
        workNow.map((r) => ({
          title: r.title,
          why: r.why,
          track: 'work_now' as const,
          field_tag: r.domain,
          domain: r.domain,
          source: r.source ?? 'fallback',
        })),
        profile,
        state
      )
    : null

  if (committed && /engineering/i.test(committed)) {
    steps.push({
      action: 'JOB_FINDER',
      label: 'Search graduate and technician mechanical engineering roles',
      href: '/job-finder',
    })
    steps.push({
      action: 'BUILD_YOUR_PATH',
      label: 'Explore CAD, design, and engineering graduate development courses',
      href: '/build-your-path',
    })
    return steps.slice(0, 4)
  }

  steps.push({
    action: 'CREATE_CV',
    label: urgent
      ? 'Build a quick UK-style CV for your target roles'
      : 'Build or improve your CV for this career path',
    href: '/cv-builder-v2',
  })

  if (family === 'office_admin') {
    steps.push({
      action: 'BUILD_YOUR_PATH',
      label: 'Explore admin and business support courses',
      href: '/build-your-path',
    })
    steps.push({
      action: 'GUIDANCE',
      label: 'Practise interview answers for admin and data-entry roles',
    })
    if (cert === 'yes') {
      steps.push({
        action: 'BUILD_YOUR_PATH',
        label: 'Improve Microsoft Office and Excel skills',
        href: '/build-your-path',
      })
    }
  } else if (family === 'driving_logistics') {
    steps.push({
      action: 'JOB_FINDER',
      label: urgent ? 'Find delivery and warehouse jobs hiring now' : 'Search delivery, warehouse, and logistics roles',
      href: '/job-finder',
    })
    if (cert === 'yes') {
      steps.push({
        action: 'BUILD_YOUR_PATH',
        label: 'Explore forklift or HGV training options',
        href: '/build-your-path',
      })
    }
  } else if (family === 'it') {
    steps.push({
      action: 'BUILD_YOUR_PATH',
      label: 'Explore IT support certification (CompTIA / Google IT)',
      href: '/build-your-path',
    })
    steps.push({
      action: 'GUIDANCE',
      label: 'Practise basic technical interview questions',
    })
  } else if (family === 'customer_service') {
    steps.push({
      action: 'JOB_FINDER',
      label: urgent ? 'Apply to retail and hospitality roles hiring now' : 'Search customer-facing entry roles',
      href: '/job-finder',
    })
    steps.push({
      action: 'GUIDANCE',
      label: 'Practise customer service interview scenarios',
    })
  } else if (family === 'legal') {
    steps.push({
      action: 'BUILD_YOUR_PATH',
      label: 'Explore legal administration and research skills courses',
      href: '/build-your-path',
    })
    steps.push({
      action: 'JOB_FINDER',
      label: 'Search legal admin and reception entry roles',
      href: '/job-finder',
    })
  } else {
    if (urgent) {
      steps.push({
        action: 'JOB_FINDER',
        label: 'Apply to 10–20 hiring-now roles this week',
        href: '/job-finder',
      })
    } else {
      steps.push({
        action: 'JOB_FINDER',
        label: 'Search and save matching entry roles',
        href: '/job-finder',
      })
    }
    if (cert === 'yes') {
      steps.push({
        action: 'BUILD_YOUR_PATH',
        label: 'Explore a short course or licence on Build Your Path',
        href: '/build-your-path',
      })
    }
  }

  return steps.slice(0, 4)
}

function stripJourneySuffix(why: string): string {
  return why
    .split(/\sWhy this fits:/i)[0]
    .split(/\sWhy now:/i)[0]
    .split(/\sNext step:/i)[0]
    .split(/\sReadiness:/i)[0]
    .trim()
}

function readinessText(
  track: CareerBrainRecommendation['track'],
  profile: CareerProfile,
  mode: PathStrategyMode
): string {
  if (track === 'backup_income') return 'optional backup income only'
  return readinessForTrack(track, profile, mode).replace(/^Readiness:\s*/i, '')
}

function pickNextTitle(titles: string[], index: number): string | undefined {
  if (!titles.length) return undefined
  return titles[Math.min(index, titles.length - 1)]
}

/** Cleaner card copy — Why this fits / Next step / Readiness. */
export function enrichRecommendationsWithJourneyContext(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  if (profile.constraints.includes('career-change-path')) {
    return recs
  }
  const workNow = recs.filter((r) => r.track === 'work_now')
  const buildNext = recs.filter((r) => r.track === 'build_next')
  const longTerm = recs.filter((r) => r.track === 'long_term')
  const buildTitles = buildNext.map((r) => r.title)
  const longTitles = longTerm.map((r) => r.title)
  const mode = detectPathStrategyMode(profile, state)

  let workIdx = 0
  let buildIdx = 0

  return recs.map((rec) => {
    if (rec.track === 'backup_income') return rec
    if (/why this fits:|next step:|readiness:/i.test(rec.why)) return rec

    const base = stripJourneySuffix(rec.why)
    const whyFit = whyFitForRecommendation(rec, profile, state)
    let nextStep: string

    if (rec.track === 'work_now') {
      const target = pickNextTitle(buildTitles, workIdx++)
      nextStep = target
        ? `after you start earning, move toward ${target.toLowerCase()}`
        : 'complete a Build Next course or licence after initial UK work'
    } else if (rec.track === 'build_next') {
      const target = pickNextTitle(longTitles, buildIdx++)
      nextStep = target
        ? `opens a path toward ${target.toLowerCase()} over 3–5 years`
        : 'leads to supervisory and management roles in your Long-Term Path'
    } else {
      nextStep = 'greater responsibility, better salary, and career growth over time'
    }

    const readiness = readinessText(rec.track, profile, mode)

    return {
      ...rec,
      why: `${base} Why this fits: ${whyFit}. Next step: ${nextStep}. Readiness: ${readiness}.`,
    }
  })
}

/** @deprecated use enrichRecommendationsWithJourneyContext */
export function enrichRecommendationWhy(
  rec: CareerBrainRecommendation,
  profile: CareerProfile,
  state?: CareerBrainState,
  longTermSample?: string
): CareerBrainRecommendation {
  const enriched = enrichRecommendationsWithJourneyContext([rec], profile, state)
  return enriched[0] ?? rec
}

export function enrichPathRoleWhy(
  role: CareerPathRole,
  track: CareerBrainRecommendation['track'],
  profile: CareerProfile,
  state?: CareerBrainState,
  longTermSample?: string
): CareerPathRole {
  const enriched = enrichRecommendationWhy(
    { ...role, track, field_tag: role.domain },
    profile,
    state,
    longTermSample
  )
  return { ...role, why: enriched.why }
}
