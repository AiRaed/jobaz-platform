/**
 * Builds a structured career profile from UK Career Assistant state + answers.
 */

import type { UkCareerAssistantState } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import type { CareerProfile } from './types'

function str(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null
  if (Array.isArray(v)) return v.map(String).join(', ')
  return String(v)
}

function includes(val: unknown, tokens: string[]): boolean {
  const s = String(val ?? '').toLowerCase()
  return tokens.some((t) => s.includes(t))
}

function englishLevel(language: unknown): CareerProfile['ukReadiness']['englishLevel'] {
  const v = String(language ?? '').toLowerCase()
  if (v === 'fluent') return 'fluent'
  if (v === 'comfortable') return 'comfortable'
  if (v === 'simple_instructions' || v === 'functional') return 'functional'
  if (v === 'basic' || v === 'poor') return 'basic'
  return null
}

function inferSegment(
  answers: Record<string, unknown>,
  path: string | null | undefined
): CareerProfile['careerDirection']['userSegment'] {
  const edu = answers.edu
  const exp = answers.exp
  const lang = englishLevel(answers.language)

  if (path === 'PATH_1' || (edu === 'no' && exp === 'no')) return 'entry_level'
  if (path === 'PATH_3' && exp === 'no') return 'graduate'
  if (path === 'PATH_4') return 'career_changer'
  if (includes(answers.goal_gate, ['any_job', 'main_job']) && exp === 'no') return 'unemployed'
  if (lang === 'basic' || lang === 'functional') return 'migrant'
  if (exp === 'yes' && path === 'PATH_5') return 'experienced'
  return 'unknown'
}

function buildMemorySnippets(answers: Record<string, unknown>, profile: CareerProfile): string[] {
  const snippets: string[] = []

  const field = str(answers.experience_field) ?? str(answers.education_field)
  if (field) snippets.push(`Background includes ${field.replace(/_/g, ' ')}`)

  const country =
    str(answers.education_country) ??
    str(answers.origin_country) ??
    str(answers.country_of_experience)
  if (country) snippets.push(`Education or experience linked to ${country}`)

  if (includes(field, ['hospitality', 'restaurant', 'hotel'])) {
    snippets.push(
      country
        ? `Customer-facing hospitality experience (${country}) — transferable to UK retail, hotels, or front desk`
        : 'Customer-facing hospitality experience — transferable to UK retail or front-desk roles'
    )
  }

  if (/engineer|mechanical|electrical|software|civil/i.test(field ?? '')) {
    snippets.push('Engineering or technical education — UK technician or graduate routes may apply')
  }

  const lang = profile.ukReadiness.englishLevel
  if (lang === 'basic' || lang === 'functional') {
    snippets.push('English is still developing — simpler roles and support steps may help')
  }

  if (profile.workExperience.hasExperience && profile.workExperience.industries.length) {
    snippets.push(
      `Work experience in ${profile.workExperience.industries.slice(0, 2).join(' and ')}`
    )
  }

  if (profile.careerDirection.wantsCareerChange) {
    snippets.push('Interested in changing career direction in the UK')
  }

  if (profile.barriers.lackOfExperience) {
    snippets.push('Limited formal UK work experience so far')
  }

  return snippets.slice(0, 6)
}

function computeCompleteness(profile: CareerProfile): number {
  let score = 0
  const checks = [
    profile.education.level,
    profile.workExperience.hasExperience !== undefined,
    profile.ukReadiness.englishLevel,
    profile.preferences.preferredIndustry ?? profile.workExperience.industries[0],
    profile.careerDirection.longTermGoal ?? profile.careerDirection.userSegment !== 'unknown',
    profile.ukReadiness.drivingLicence !== null,
  ]
  for (const c of checks) {
    if (c) score += 1
  }
  return Math.round((score / checks.length) * 100)
}

export function buildCareerProfile(state: UkCareerAssistantState): CareerProfile {
  const answers = state.answers ?? {}
  const path = state.path ?? null

  const jazJobTitle = str(answers.jaz_job_title) ?? str(answers.currentJobTitle)
  const isGrowCareer = String(answers.cb_user_goal ?? '') === 'grow_career'
  const growFieldSlug = str(answers.cb_grow_field)

  const expField = str(answers.experience_field)
  const eduField = str(answers.education_field) ?? str(answers.field_of_study)
  const hasExp =
    answers.exp === 'yes' ||
    answers.exp === true ||
    Boolean(expField) ||
    Boolean(jazJobTitle) ||
    isGrowCareer

  const industries: string[] = []
  if (expField) industries.push(expField)
  if (growFieldSlug && isGrowCareer) industries.push(growFieldSlug.replace(/_/g, ' '))
  if (eduField && !industries.includes(eduField)) industries.push(eduField)

  const transferable: string[] = []
  const strengths = answers.strengths ?? answers.transferable_strengths
  if (Array.isArray(strengths)) transferable.push(...strengths.map(String))
  else if (strengths) transferable.push(String(strengths))

  if (includes(answers.people_comfort, ['comfortable', 'okay'])) {
    transferable.push('Customer service & communication')
  }
  if (includes(expField, ['warehouse', 'logistics'])) {
    transferable.push('Reliability, physical stamina, team coordination')
  }
  if (includes(expField, ['hospitality', 'restaurant'])) {
    transferable.push('Customer service, pace under pressure, teamwork')
  }
  if (includes(expField, ['trades', 'construction'])) {
    transferable.push('Practical skills, safety awareness, hands-on problem solving')
  }
  if (includes(expField, ['office', 'admin'])) {
    transferable.push('Organisation, attention to detail, digital admin')
  }

  const rel = str(answers.rel)
  const ukRecognition =
    rel === 'yes' ? 'yes' : rel === 'no' ? 'no' : rel === 'not_sure' ? 'not_sure' : null

  const transport = str(answers.transport)
  const drivingLicence =
    transport && !includes(transport, ['no_licence', 'public'])
      ? true
      : transport
        ? false
        : null

  const customerFacing =
    includes(answers.people_comfort, ['comfortable', 'okay']) ||
    includes(answers.customer_interaction, ['yes', 'comfortable'])
      ? true
      : includes(answers.people_comfort, ['prefer_not', 'avoid']) ||
          includes(answers.customer_interaction, ['avoid'])
        ? false
        : null

  const wantsChange =
    path === 'PATH_4' ||
    includes(answers.intent, ['change', 'redirect', 'different']) ||
    includes(answers.goal_gate, ['change'])

  const confidenceLevel: CareerProfile['careerDirection']['confidenceLevel'] =
    includes(answers.confidence, ['low', 'unsure', 'not']) || answers.confidence === 'low'
      ? 'low'
      : includes(answers.confidence, ['high', 'confident'])
        ? 'high'
        : 'medium'

  const barriers: CareerProfile['barriers'] = {
    confidence: confidenceLevel === 'low',
    lackOfExperience: !hasExp,
    language: englishLevel(answers.language) === 'basic',
    unclearDirection:
      includes(answers.goal_gate, ['not_sure']) || includes(answers.intent, ['not_sure']),
    missingQualifications: ukRecognition === 'no' || answers.edu === 'no',
    interviewFear: includes(answers.interview_comfort, ['nervous', 'fear', 'low']),
    transport: drivingLicence === false,
    burnout:
      includes(answers.stress_tolerance, ['low', 'burnout']) ||
      includes(answers.priorities, ['less_stress']),
  }

  const profile: CareerProfile = {
    education: {
      level: str(answers.education_level) ?? (answers.edu === 'yes' ? 'has_qualifications' : null),
      field: eduField,
      country: str(answers.education_country) ?? str(answers.origin_country),
      graduationYear: str(answers.graduation_year),
      ukRecognition,
    },
    workExperience: {
      hasExperience: hasExp,
      industries,
      roles: jazJobTitle ? [jazJobTitle] : str(answers.job_title) ? [String(answers.job_title)] : [],
      years:
        str(answers.jaz_years) ??
        str(answers.cb_grow_years) ??
        str(answers.years_experience) ??
        str(answers.experience_years),
      responsibilities: Array.isArray(answers.responsibilities)
        ? answers.responsibilities.map(String)
        : [],
      tools: Array.isArray(answers.tools) ? answers.tools.map(String) : [],
      transferableSkills: [...new Set(transferable)],
    },
    ukReadiness: {
      englishLevel: englishLevel(answers.language),
      certifications: Array.isArray(answers.certifications)
        ? answers.certifications.map(String)
        : str(answers.training_interest)
          ? [String(answers.training_interest)]
          : [],
      drivingLicence,
      workEligibility: str(answers.work_rights) ?? str(answers.visa_status),
      location: str(answers.location) ?? str(answers.uk_city),
    },
    preferences: {
      preferredIndustry:
        (isGrowCareer && growFieldSlug ? growFieldSlug.replace(/_/g, ' ') : null) ??
        str(answers.preferred_industry) ??
        expField,
      workStyle: str(answers.work_style),
      remote: includes(answers.work_style, ['remote', 'hybrid']) ? true : null,
      physicalWork: !includes(answers.physical_ability, ['prefer_non', 'health', 'light_only'])
        ? includes(answers.physical_ability, ['no_limitations'])
        : false,
      customerFacing,
      shiftWork: includes(answers.shift_availability, ['flexible', 'evenings', 'weekends']),
      salaryGoals: str(answers.salary_expectation) ?? str(answers.income_goal),
    },
    careerDirection: {
      wantsSameField: isGrowCareer || path === 'PATH_5' ? true : wantsChange ? false : null,
      wantsCareerChange: wantsChange && !isGrowCareer,
      confidenceLevel,
      longTermGoal: str(answers.long_term_goal) ?? str(answers.goal_gate),
      userSegment: inferSegment(answers, path),
    },
    barriers,
    aiInsights: {
      employabilityScore: 0,
      strongestAreas: [],
      biggestRisks: [],
      recommendedPaths: [],
      recommendedSectors: [],
      urgencyLevel: 'medium',
      jobReady: false,
      realisticSalaryBand: null,
      missingSkills: [],
      fastestCertifications: [],
      easiestEntryRoles: [],
    },
    memorySnippets: [],
    profileCompleteness: 0,
    lastUpdatedAt: new Date().toISOString(),
  }

  profile.memorySnippets = buildMemorySnippets(answers, profile)
  profile.profileCompleteness = computeCompleteness(profile)

  return profile
}

export function syncCareerAdvisorOnState(state: UkCareerAssistantState): UkCareerAssistantState {
  const profile = buildCareerProfile(state)
  return {
    ...state,
    career_profile: profile,
  }
}
