import { careerHubPathHref } from '@/lib/career-hub/myPlan'
import { analyzeProfession, getConsultantInsights, getCareerProgression, getMultiPathReadiness } from './consultant'
import { normalizeExperienceAnswers } from './consultant/interviewDedup'
import { parseExperienceSpecialisations } from './consultant/multiSelect'
import { buildCombinedReadinessSummary } from './consultant/mergeProfessionProfiles'
import { resolveExperienceSpecialisationLabel, EXPERIENCE_INDUSTRY_LABELS } from './experienceSpecialisations'
import { getProfessionArchetype } from './consultant/professionInterview'
import type {
  ExperiencePathAnswers,
  ExperiencePathResult,
  ExperienceTier,
  HighestPosition,
  YearsExperience,
} from './types'
import type { EnglishLevel, EssentialAction, JobEntry } from '@/lib/career-engine/shared/planTypes'
import type { GeneratedExperienceProfile } from './dynamic/types'
import {
  dedupeEssentialActions,
  dedupeCvImprovements,
  hasEssentialActionKey,
} from '@/lib/career-engine/shared/dedupeActions'

const GRADUATE_FORBIDDEN = /graduate|trainee|apprentice|intern|entry.?level/i

function jobFinderHref(keyword: string, location: string): string {
  const loc = location && location !== 'UK-wide' ? `&location=${encodeURIComponent(location)}` : ''
  return `/job-finder?query=${encodeURIComponent(keyword)}${loc}`
}

function englishIsLow(level: EnglishLevel): boolean {
  return level === 'beginner' || level === 'basic'
}

function resolveTier(answers: ExperiencePathAnswers): ExperienceTier {
  const specs = parseExperienceSpecialisations(answers as unknown as Record<string, string>)
  const { years_experience, highest_position, management_experience } = answers

  if (specs.some((s) => /site_manager|finance_manager|sales_manager|hotel_duty_manager|head_chef|warehouse_supervisor|security_supervisor|finance_business_partner|tax_accountant|engineering_manager|customer_service_manager|marketing_manager|brand_manager|head_teacher|hr_manager|facilities_manager|production_supervisor/.test(s))) {
    return 'manager'
  }
  if (specs.some((s) => /supervisor|sous_chef|restaurant_supervisor|customer_service_team_leader|cleaning_supervisor|cover_supervisor|production_supervisor/.test(s)) || answers.kitchen_level === 'sous_head') {
    return 'supervisor'
  }

  if (highest_position === 'director' || highest_position === 'manager') return 'manager'
  if (highest_position === 'supervisor') return 'supervisor'
  if (management_experience === 'yes' && years_experience !== '1_2') return 'supervisor'
  if (years_experience === '10_plus' || years_experience === '6_10') return 'senior'
  if (years_experience === '3_5' && (highest_position === 'senior_specialist' || answers.role_seniority === 'step_up')) {
    return 'senior'
  }
  return 'skilled'
}

function yearsWeight(years: YearsExperience): number {
  const map: Record<YearsExperience, number> = { '1_2': 1, '3_5': 2, '6_10': 3, '10_plus': 4 }
  return map[years]
}

function shouldForbidDowngrade(answers: ExperiencePathAnswers): boolean {
  return yearsWeight(answers.years_experience) >= 2 || (answers.highest_position ?? 'skilled_worker') !== 'skilled_worker'
}

function pickJobs(profile: GeneratedExperienceProfile, answers: ExperiencePathAnswers): JobEntry[] {
  const tier = resolveTier(answers)
  let pool = [...(profile.jobs[tier] ?? profile.jobs.skilled)]

  if (shouldForbidDowngrade(answers)) {
    pool = pool.filter((j) => !GRADUATE_FORBIDDEN.test(`${j.title} ${j.searchKeyword}`))
  }

  if (tier === 'senior' || tier === 'manager' || tier === 'supervisor') {
    pool = pool.filter((j) => j.seniority !== 'graduate' && j.seniority !== 'junior')
  }

  const seen = new Set<string>()
  const out: JobEntry[] = []
  for (const job of pool) {
    const key = job.searchKeyword.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(job)
  }
  return out.slice(0, 4)
}

const DRIVING_ARCHETYPES = new Set(['passenger_transport', 'hgv_commercial', 'delivery_driver'])

function needsDrivingLicence(answers: ExperiencePathAnswers): boolean {
  const spec = answers.experience_specialisation ?? ''
  const archetype = getProfessionArchetype(spec, answers.industry)
  if (DRIVING_ARCHETYPES.has(archetype)) return true
  if (answers.industry === 'driving_transport') return true
  return /driver|courier|chauffeur|forklift|hgv|delivery/i.test(spec)
}

function hasUkDrivingLicence(answers: ExperiencePathAnswers): boolean {
  if (answers.uk_driving_licence === 'yes' || answers.driving_licence === 'yes') return true
  return false
}

function computeEstimatedPathway(
  answers: ExperiencePathAnswers,
  mandatoryCount: number,
  profile: GeneratedExperienceProfile
): string {
  let score = 0

  if (answers.experience_country === 'outside_uk') score += 3
  if (answers.uk_work_experience === 'no') score += 2
  if (englishIsLow(answers.english_level)) score += 2
  else if (answers.english_level === 'intermediate') score += 1
  if (answers.open_to_certifications === 'no') score += 1
  if (profile.regulated) score += 2
  score += Math.min(mandatoryCount, 4)

  if (profile.essentialActions.filter((a) => a.priority === 'critical').length >= 3) score += 1

  if (
    answers.experience_country === 'uk' &&
    answers.uk_work_experience === 'yes' &&
    !englishIsLow(answers.english_level) &&
    score <= 3
  ) {
    return '1–3 months'
  }
  if (score <= 5) return '3–6 months'
  return '6–12 months'
}

function buildEssentialActions(
  profile: GeneratedExperienceProfile,
  answers: ExperiencePathAnswers
): EssentialAction[] {
  const roadmap: EssentialAction[] = []
  let step = 1

  if (answers.experience_country === 'outside_uk') {
    for (const action of profile.outsideUkActions) {
      roadmap.push({ ...action, step: step++ })
    }
  }

  for (const action of profile.essentialActions.filter((a) => a.priority === 'critical')) {
    roadmap.push({ ...action, step: step++ })
  }

  for (const action of profile.essentialActions.filter((a) => a.priority === 'recommended')) {
    roadmap.push({ ...action, step: step++ })
  }

  if (englishIsLow(answers.english_level)) {
    if (!hasEssentialActionKey(roadmap, 'improve_english')) {
      roadmap.push({
        id: 'improve_english',
        step: step++,
        title: 'Improve English',
        description: `Stronger English is needed for interviews and ${profile.label.toLowerCase()} roles with UK clients or teams.`,
        priority: 'critical',
      })
    }
  }

  if (answers.uk_work_experience === 'no') {
    if (!hasEssentialActionKey(roadmap, 'uk_work_experience')) {
      roadmap.push({
        id: 'uk_experience',
        step: step++,
        title: 'UK Work Experience',
        description: 'Even short-term UK work strengthens applications — consider contract or agency roles in your field.',
        href: jobFinderHref(profile.jobs.skilled[0]?.searchKeyword ?? profile.label, answers.preferred_location),
        priority: 'recommended',
      })
    }
  }

  if (
    !hasUkDrivingLicence(answers) &&
    needsDrivingLicence(answers) &&
    !hasEssentialActionKey(roadmap, 'uk_driving_licence')
  ) {
    roadmap.push({
      id: 'driving',
      step: step++,
      title: 'UK Driving Licence',
      description: 'A valid UK driving licence expands job options in your field.',
      priority: 'recommended',
    })
  }

  const topJob = profile.jobs.skilled[0]?.searchKeyword ?? profile.label
  if (!hasEssentialActionKey(roadmap, 'apply_uk_roles')) {
    roadmap.push({
      id: 'apply_uk_roles',
      step: step++,
      title: 'Apply for UK Roles',
      description: 'Target roles matching your experience level — do not downgrade to entry-level unless regulation requires it.',
      href: jobFinderHref(topJob, answers.preferred_location),
      priority: 'recommended',
    })
  }

  return dedupeEssentialActions(roadmap).map((action, index) => ({
    ...action,
    step: index + 1,
  }))
}

function buildCourses(
  profile: GeneratedExperienceProfile,
  _answers: ExperiencePathAnswers
): ExperiencePathResult['recommendedCourses'] {
  // Always surface course types for the route (affiliate Apply Now only when published).
  const courses = profile.courses.slice(0, 3)
  return courses.map((c) => ({
    ...c,
    href: careerHubPathHref(c.pathId ?? profile.careerHubPathId),
  }))
}

function formatGoal(role: string): string {
  const t = role.trim()
  if (t.startsWith('BUILD:')) return `Build a ${t.slice(6).trim()} in the UK`
  if (/^Become a |^Build a /i.test(t)) return / in the UK$/i.test(t) ? t : `${t} in the UK`
  if (/ in the UK$/i.test(t)) return `Become a ${t}`
  return `Become a ${t} in the UK`
}

function buildMissions(
  profile: GeneratedExperienceProfile,
  answers: ExperiencePathAnswers,
  jobs: JobEntry[]
): ExperiencePathResult['missions'] {
  const location = answers.preferred_location || 'UK-wide'
  const base = profile.missions.map((m) => ({
    ...m,
    href: m.href.includes('/job-finder') && !m.href.includes('location=') && location !== 'UK-wide'
      ? `${m.href}${m.href.includes('?') ? '&' : '?'}location=${encodeURIComponent(location)}`
      : m.href,
  }))

  if (base.length >= 4) return base

  const top = jobs[0]
  return [
    { id: 'cv', label: `Update ${profile.label} experience on CV`, href: '/cv-builder-v2', target: 1 },
    { id: 'apply', label: 'Apply to 5 matching jobs', href: top ? jobFinderHref(top.searchKeyword, location) : '/job-finder', target: 5 },
    { id: 'save', label: 'Save 3 matching jobs', href: top ? jobFinderHref(top.searchKeyword, location) : '/job-finder', target: 3 },
    { id: 'cert', label: 'Complete required certification', href: careerHubPathHref(profile.careerHubPathId), target: 1 },
  ]
}

function computeReadiness(
  answers: ExperiencePathAnswers,
  actions: EssentialAction[],
  profile: GeneratedExperienceProfile
): ExperiencePathResult['careerReadiness'] {
  const mandatory: string[] = []
  const recommended: string[] = []
  const addMandatory = (label: string) => {
    if (!mandatory.includes(label)) mandatory.push(label)
  }
  const addRecommended = (label: string) => {
    if (!recommended.includes(label) && !mandatory.includes(label)) recommended.push(label)
  }

  const years = yearsWeight(answers.years_experience)
  let score = 40 + years * 8

  if (answers.experience_country === 'uk') score += 10
  if (answers.uk_work_experience === 'yes') {
    score += 12
  } else {
    addRecommended('UK Work Experience')
  }

  if (englishIsLow(answers.english_level)) {
    addMandatory('English Improvement')
    score -= 15
  } else if (answers.english_level === 'intermediate') {
    addRecommended('English Improvement')
    score -= 5
  } else {
    score += 8
  }

  if (answers.experience_country === 'outside_uk' && !hasEssentialActionKey(actions, 'uk_qualification_recognition')) {
    addMandatory('UK Qualification Recognition')
    score -= 8
  }

  if (
    !hasUkDrivingLicence(answers) &&
    needsDrivingLicence(answers)
  ) {
    addMandatory('Required UK Licence')
  }

  for (const a of actions) {
    if (a.priority !== 'critical') continue
    const labels: Record<string, string> = {
      experience_mapping: 'Experience Mapping',
      qualification_recognition: 'UK Qualification Recognition',
      enic: 'UK Qualification Recognition',
      professional_certification: 'Mandatory Industry Certification',
      improve_english: 'English Improvement',
      '18th': 'Mandatory Industry Certification',
      ecs: 'Mandatory Industry Certification',
      nvq: 'Mandatory Industry Certification',
      sia: 'Mandatory Industry Certification',
      dbs: 'Enhanced DBS Check',
      food_hygiene: 'Mandatory Industry Certification',
      cscs: 'CSCS Card',
      cpc: 'Driver CPC',
      sage: 'UK Software Skills',
    }
    addMandatory(labels[a.id] ?? a.title)
  }

  if (answers.open_to_certifications === 'no') {
    addRecommended('Professional Certifications')
    score -= 6
  } else {
    const hasRecommendedCert = profile.essentialActions.some((a) => a.priority === 'recommended')
    if (hasRecommendedCert) addRecommended('Advanced Certification')
  }

  if (profile.outsideUkActions.some((a) => /membership|body|register/i.test(a.title))) {
    addRecommended('Professional Membership')
  } else if (profile.regulated) {
    addRecommended('Professional Membership')
  }

  if (profile.insights.portfolioRequired) {
    addRecommended('Portfolio')
  }

  if (answers.management_experience === 'yes' && resolveTier(answers) !== 'manager') {
    addRecommended('Leadership Evidence')
  }

  if (profile.regulated || ['construction', 'electrician', 'chef'].includes(answers.industry)) {
    addRecommended('Health & Safety')
  }

  const missing = [...mandatory, ...recommended]

  if (englishIsLow(answers.english_level)) score = Math.min(score, 42)
  if (answers.experience_country === 'outside_uk' && answers.uk_work_experience === 'no' && englishIsLow(answers.english_level)) {
    score = Math.min(score, 34)
  }
  if (answers.experience_country === 'uk' && answers.uk_work_experience === 'yes' && missing.length <= 2) {
    score = Math.max(score, 62)
  }
  if (years >= 3 && answers.uk_work_experience === 'yes') {
    score = Math.max(score, 55)
  }

  score = Math.max(18, Math.min(88, Math.round(score)))

  const yearsLabel: Record<ExperiencePathAnswers['years_experience'], string> = {
    '1_2': '1–2',
    '3_5': '3–5',
    '6_10': '6–10',
    '10_plus': '10+',
  }

  const pathReadiness = getMultiPathReadiness()
  let summary =
    mandatory.length === 0
      ? `Your ${yearsLabel[answers.years_experience]} years of ${profile.label.toLowerCase()} experience transfers well to the UK — focus on applications.`
      : mandatory.length <= 2
        ? `Strong transferable experience — complete mandatory requirements, then optional improvements.`
        : `Your experience is valuable — work through mandatory UK requirements to match roles at your level.`

  if (pathReadiness.length > 1) {
    summary = buildCombinedReadinessSummary(pathReadiness)
    const readyCount = pathReadiness.filter((p) => p.ready).length
    score = Math.round(
      pathReadiness.reduce((sum, p) => sum + p.score, 0) / pathReadiness.length
    )
    score = Math.max(18, Math.min(88, score + readyCount * 4))
  }

  const interviewReadiness: ExperiencePathResult['careerReadiness']['interviewReadiness'] =
    englishIsLow(answers.english_level) ? 'low' : answers.english_level === 'intermediate' ? 'medium' : 'high'

  return {
    score,
    interviewReadiness,
    summary,
    missing: missing.slice(0, 6),
    mandatoryRequirements: mandatory.slice(0, 5),
    recommendedImprovements: recommended.slice(0, 5),
    pathReadiness: pathReadiness.length > 1 ? pathReadiness : undefined,
  }
}

export function buildExperiencePathResult(answers: ExperiencePathAnswers): ExperiencePathResult {
  const normalized = normalizeExperienceAnswers(answers) as ExperiencePathAnswers
  const profile = analyzeProfession(normalized)
  const tier = resolveTier(normalized)
  const location = normalized.preferred_location || 'UK-wide'
  const specialisationLabel = resolveExperienceSpecialisationLabel(
    normalized.industry,
    normalized.experience_specialisation,
    normalized.experience_specialisation_other
  )
  const jobs = pickJobs(profile, normalized)
  const essentialActions = buildEssentialActions(profile, normalized)
  const courses = buildCourses(profile, normalized)
  const careerInsights = getConsultantInsights()
  const progression = getCareerProgression()

  let cvImprovements = [...profile.cvImprovements]
  if (normalized.management_experience === 'yes') {
    const hasLeadership = cvImprovements.some((c) => /leadership/i.test(c.title))
    if (!hasLeadership) {
      cvImprovements.push({
        id: 'leadership',
        title: 'Leadership Evidence',
        description: 'Document team size, budgets, KPIs, and staff you managed or trained.',
        href: '/cv-builder-v2',
        priority: 5,
      })
    }
  }

  if (answers.experience_country === 'outside_uk') {
    cvImprovements.push({
      id: 'uk_titles',
      title: 'UK Job Title Translation',
      description: 'Map your overseas role titles to UK equivalents employers will recognise.',
      href: '/cv-builder-v2',
      priority: 6,
    })
  }

  cvImprovements = dedupeCvImprovements(
    cvImprovements.sort((a, b) => a.priority - b.priority)
  ).slice(0, 5)

  const careerTimeline = progression?.ladder ?? profile.timelines[tier]
  const goalRole = progression?.nextRole ?? profile.goals[tier]
  const careerReadiness = computeReadiness(normalized, essentialActions, profile)

  return {
    pathId: 'work_in_experience',
    field: normalized.industry,
    fieldLabel: EXPERIENCE_INDUSTRY_LABELS[normalized.industry],
    specialisation: normalized.experience_specialisation,
    specialisationLabel,
    answers: normalized as unknown as Record<string, string>,
    goal: formatGoal(goalRole),
    estimatedPathway: computeEstimatedPathway(
      normalized,
      careerReadiness.mandatoryRequirements?.length ?? 0,
      profile
    ),
    workNow: jobs.map((j) => ({ ...j, href: jobFinderHref(j.searchKeyword, location) })),
    essentialActions,
    recommendedCourses: courses,
    cvImprovements,
    careerTimeline,
    careerTimelineCurrentIndex: progression?.currentIndex,
    careerTimelineTargetIndex: progression?.nextIndex,
    missions: buildMissions(profile, normalized, jobs),
    careerReadiness,
    careerInsights: careerInsights
      ? {
          fastestEntryRoute: careerInsights.fastestEntryRoute,
          longTermPath: careerInsights.longTermPath,
          alternativeRoles: careerInsights.alternativeRoles,
          interviewPreparation: careerInsights.interviewPreparation,
          experienceGaps: careerInsights.experienceGaps,
          complianceNotes: careerInsights.complianceNotes,
          portfolioRequired: careerInsights.portfolioRequired,
          dailyActions: careerInsights.dailyActions,
          skillsEmployersExpect: careerInsights.skillsEmployersExpect,
        }
      : undefined,
    location,
  }
}
