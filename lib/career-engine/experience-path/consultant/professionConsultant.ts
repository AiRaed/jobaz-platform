/**
 * UK Career Consultant — reasons from profession archetype + interview answers.
 * Composes atomic UK facts into a full roadmap; does not use per-profession templates.
 */

import { careerHubPathHref } from '@/lib/career-hub/myPlan'
import { resolveExperienceSpecialisationLabel } from '../experienceSpecialisations'
import { INDUSTRY_CAREER_HUB, JOB, CV, lookupExperienceBlueprint } from '../dynamic/ukExperienceRegistry'
import type { ExperienceIndustryId, ExperiencePathAnswers, ExperienceTier } from '../types'
import type { GeneratedExperienceProfile, ExperienceRoadmapInsights } from '../dynamic/types'
import type { CourseEntry, CvImprovement, EssentialAction, JobEntry } from '@/lib/career-engine/shared/planTypes'
import { getProfessionArchetype } from './professionInterview'
import { ARCHETYPE_FACTS, employerExpectations, jobKeywordsForSpecialisation } from './ukProfessionFacts'
import { resolveCareerProgression } from './careerProgression'
import { getSpecProfileFacts } from './specFollowUps'
import {
  parseExperienceSpecialisations,
  formatCombinedLabels,
} from './multiSelect'
import {
  mergeExperienceProfiles,
  getPathReadiness,
  buildCombinedReadinessSummary,
  type PathReadiness,
} from './mergeProfessionProfiles'
import { analyzeProfessionContext, contextToSkills, mergeProfessionContexts } from './dynamicProfessionAnalysis'
import { dedupeStringList } from '@/lib/career-engine/shared/dedupeActions'
import {
  resolvePortfolioEvidence,
  shouldRequirePortfolioEvidence,
} from './portfolioQuestions'
import type { UkFact } from './ukProfessionFacts'

let lastInsights: ExperienceRoadmapInsights | null = null
let lastProgression: ReturnType<typeof resolveCareerProgression> | null = null

export function getConsultantInsights(): ExperienceRoadmapInsights | null {
  return lastInsights
}

export function getCareerProgression(): ReturnType<typeof resolveCareerProgression> | null {
  return lastProgression
}

export function getMultiPathReadiness(): PathReadiness[] {
  return getPathReadiness()
}

function asRecord(answers: ExperiencePathAnswers): Record<string, string> {
  return answers as unknown as Record<string, string>
}

function englishIsLow(level: string): boolean {
  return level === 'beginner' || level === 'basic'
}

export function inferExperienceTier(answers: ExperiencePathAnswers): ExperienceTier {
  const specs = parseExperienceSpecialisations(answers as unknown as Record<string, string>)
  const spec = specs.join(',') || answers.experience_specialisation || ''
  const years = answers.years_experience

  if (specs.some((s) => /site_manager|finance_manager|sales_manager|hotel_duty_manager|head_chef|warehouse_supervisor|security_supervisor|finance_business_partner|tax_accountant/.test(s))) {
    return 'manager'
  }
  if (specs.some((s) => /supervisor|sous_chef|restaurant_supervisor|dispatch_clerk/.test(s)) || answers.kitchen_level === 'sous_head') {
    return 'supervisor'
  }
  if (answers.highest_position === 'director' || answers.highest_position === 'manager') return 'manager'
  if (answers.highest_position === 'supervisor') return 'supervisor'
  if (answers.management_experience === 'yes' && years !== '1_2') return 'supervisor'
  if (years === '10_plus' || years === '6_10') return 'senior'
  if (specs.some((s) => /senior_accountant|financial_analyst|credit_controller/.test(s))) return 'senior'
  if (years === '3_5' && (answers.highest_position === 'senior_specialist' || answers.role_seniority === 'step_up')) {
    return 'senior'
  }
  return 'skilled'
}

function applicableFacts(
  archetype: ReturnType<typeof getProfessionArchetype>,
  answers: Record<string, string>,
  specId?: string
): UkFact[] {
  const archetypeFacts = ARCHETYPE_FACTS[archetype] ?? ARCHETYPE_FACTS.general
  const specFacts = specId ? getSpecProfileFacts(specId) : []
  return [...archetypeFacts, ...specFacts].filter((f) => {
    if (f.appliesWhen && !f.appliesWhen(answers)) return false
    return true
  })
}

function missingFacts(facts: UkFact[], answers: Record<string, string>): UkFact[] {
  return facts.filter((f) => {
    if (f.satisfiedWhen?.(answers)) return false
    return true
  })
}

function factToAction(f: UkFact, priority: 'critical' | 'recommended'): EssentialAction {
  return {
    id: f.id,
    title: f.title,
    description: f.description,
    href: f.href,
    priority,
  }
}

function buildJobs(label: string, specId: string, tier: ExperienceTier): Record<ExperienceTier, JobEntry[]> {
  const keywords = jobKeywordsForSpecialisation(specId, label)
  const blueprint = lookupExperienceBlueprint(specId, label)

  if (blueprint?.jobs?.length) {
    const make = blueprint.jobs.map((j) => ({
      title: j.title,
      searchKeyword: j.keyword,
      seniority: j.seniority ?? ('mid' as const),
      salaryRange: j.salary,
    }))
    return {
      skilled: make.filter((j) => j.seniority !== 'senior'),
      senior: make,
      supervisor: make.filter((j) => j.seniority !== 'junior'),
      manager: make.filter((j) => j.seniority === 'senior' || j.seniority === 'mid'),
    }
  }

  const base: JobEntry[] = keywords.map((kw, i) => ({
    title: i === 0 ? label : i === 1 ? `${label} (UK)` : `Senior ${label}`,
    searchKeyword: kw,
    seniority: i === 2 ? 'senior' : 'mid',
  }))

  return {
    skilled: base.filter((j) => j.seniority !== 'senior'),
    senior: base,
    supervisor: base,
    manager: base.filter((j) => j.seniority === 'senior'),
  }
}

function buildCvImprovements(
  label: string,
  gaps: UkFact[],
  skills: string[],
  portfolioConfig: ReturnType<typeof resolvePortfolioEvidence>
): CvImprovement[] {
  const items: CvImprovement[] = []

  if (portfolioConfig) {
    items.push({
      id: 'portfolio',
      title: portfolioConfig.cvTitle,
      description: portfolioConfig.cvDescription,
      href: CV,
      priority: 1,
    })
  }

  const licenceGaps = gaps.filter((f) => f.kind === 'licence' || f.kind === 'registration')
  if (licenceGaps.length > 0) {
    items.push({
      id: 'licences_cv',
      title: 'Licences & Registrations on CV',
      description: `List ${licenceGaps.map((g) => g.title).join(', ')} prominently — UK recruiters scan for compliance first.`,
      href: CV,
      priority: 2,
    })
  }

  items.push({
    id: 'exp_section',
    title: `${label} Experience Section`,
    description: `Lead with UK-relevant job titles, employers, dates, and measurable achievements.`,
    href: CV,
    priority: 3,
  })

  if (skills.length > 0) {
    items.push({
      id: 'skills_cv',
      title: 'Skills Employers Expect',
      description: skills.slice(0, 5).join(' · '),
      href: CV,
      priority: 4,
    })
  }

  return items.slice(0, 5)
}

function buildCourses(gaps: UkFact[], openToCerts: boolean, careerHubPathId: string): CourseEntry[] {
  if (!openToCerts) return []
  const courses: CourseEntry[] = []
  for (const g of gaps) {
    if (g.course && !courses.some((c) => c.id === g.course!.id)) {
      courses.push({ ...g.course, pathId: careerHubPathId })
    }
  }
  return courses.slice(0, 4)
}

function buildOutsideUkActions(label: string): EssentialAction[] {
  return [
    {
      id: 'experience_mapping',
      title: 'Experience Mapping',
      description: `Translate your overseas ${label.toLowerCase()} role into UK job titles, metrics, and regulator-recognised skills.`,
      href: CV,
      priority: 'critical',
    },
  ]
}

function buildInsights(
  label: string,
  answers: ExperiencePathAnswers,
  gaps: UkFact[],
  mandatory: EssentialAction[],
  skills: string[],
  portfolioRequired: boolean,
  progression: ReturnType<typeof resolveCareerProgression>
): ExperienceRoadmapInsights {
  const experienceGaps: string[] = []
  if (answers.experience_country === 'outside_uk') experienceGaps.push('UK experience translation on CV')
  if (answers.uk_work_experience === 'no') experienceGaps.push('UK work experience')
  if (englishIsLow(answers.english_level)) experienceGaps.push('English for UK interviews')
  gaps.forEach((g) => {
    if (g.priority === 'mandatory' && !experienceGaps.includes(g.title)) experienceGaps.push(g.title)
  })

  const blueprint = lookupExperienceBlueprint(answers.experience_specialisation, label)

  return {
    fastestEntryRoute:
      blueprint?.fastestRoute ??
      `Complete mandatory UK requirements for ${label.toLowerCase()} → align CV to UK titles → targeted applications at your experience level`,
    longTermPath: progression.ladder,
    alternativeRoles: blueprint?.alternativeRoles ?? [],
    interviewPreparation: [
      ...(blueprint?.interviewTips ?? []),
      `Prepare competency examples for UK ${label.toLowerCase()} interviews.`,
    ],
    experienceGaps: dedupeStringList(experienceGaps).slice(0, 6),
    complianceNotes: dedupeStringList(
      gaps
        .filter((g) => g.kind === 'licence' || g.kind === 'registration' || g.kind === 'compliance')
        .map((g) => g.description)
    ).slice(0, 6),
    skillsEmployersExpect: skills,
    portfolioRequired,
    dailyActions: [
      mandatory[0] ? `Priority: ${mandatory[0].title}` : `Update your ${label} CV for UK employers`,
      'Apply to 2–3 matched UK roles at your experience level',
      gaps[0] ? `Action: ${gaps[0].title}` : 'Review mandatory licences on your roadmap',
    ],
    ukAdvice: blueprint?.ukAdvice ?? [
      `Do not downgrade to entry-level — your ${label.toLowerCase()} experience should transfer at the same level unless regulation requires re-qualification.`,
    ],
  }
}

export function analyzeProfessionSingle(
  answers: ExperiencePathAnswers,
  specId: string,
  labelOverride?: string
): GeneratedExperienceProfile {
  const industryId = answers.industry
  const label =
    labelOverride ??
    resolveExperienceSpecialisationLabel(industryId, specId, answers.experience_specialisation_other)
  const archetype = getProfessionArchetype(specId, industryId)
  const record = asRecord(answers)
  const blueprint = lookupExperienceBlueprint(specId, label)
  const careerHubPathId = blueprint?.careerHubPathId ?? INDUSTRY_CAREER_HUB[industryId] ?? 'office-admin'

  const facts = applicableFacts(archetype, record, specId)
  const gaps = missingFacts(facts, record)

  const mandatoryFacts = gaps.filter((f) => f.priority === 'mandatory')
  const recommendedFacts = gaps.filter((f) => f.priority === 'recommended' || f.priority === 'optional')

  const mandatory = mandatoryFacts.map((f) => factToAction(f, 'critical'))
  const recommended = recommendedFacts.map((f) => factToAction(f, 'recommended'))

  const outsideUkActions =
    answers.experience_country === 'outside_uk' ? buildOutsideUkActions(label) : []

  const essentialActions: EssentialAction[] = [...mandatory, ...recommended]

  if (englishIsLow(answers.english_level)) {
    essentialActions.push({
      id: 'improve_english',
      title: 'Improve English',
      description: `Stronger English is needed for interviews and ${label.toLowerCase()} roles with UK clients or teams.`,
      priority: 'critical',
    })
  }

  const portfolioConfig = resolvePortfolioEvidence(industryId, archetype, specId, label)
  const portfolioRequired = shouldRequirePortfolioEvidence(
    industryId,
    archetype,
    specId,
    label,
    Boolean(blueprint?.portfolioRequired)
  )

  const professionContext = analyzeProfessionContext(specId, industryId, record)
  const skills = contextToSkills(professionContext).filter((s, i, arr) => arr.indexOf(s) === i)

  const cvImprovements = buildCvImprovements(label, gaps, skills, portfolioConfig)
  const courses = buildCourses(gaps, answers.open_to_certifications === 'yes', careerHubPathId)
  const tier = inferExperienceTier(answers)
  const progression = resolveCareerProgression(answers, label, tier)
  lastProgression = progression
  const jobs = buildJobs(label, specId, tier)
  const goals = progression.goals
  const timelines = progression.timelines

  const insights = buildInsights(label, answers, gaps, mandatory, skills, portfolioRequired, progression)
  insights.skillsEmployersExpect = [
    ...professionContext.dailyResponsibilities.slice(0, 2).map((r) => `Experience: ${r}`),
    ...skills,
  ].slice(0, 10)
  lastInsights = insights

  const keyword = label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const missions = [
    mandatory[0]
      ? { id: mandatory[0].id, label: `Start: ${mandatory[0].title}`, href: mandatory[0].href ?? CV, target: 1 }
      : { id: 'cv', label: `Update ${label} CV`, href: CV, target: 1 },
    { id: 'apply', label: 'Apply to 5 matching UK jobs', href: JOB(keyword), target: 5 },
    { id: 'save', label: 'Save 3 relevant jobs', href: JOB(keyword), target: 3 },
    courses[0]
      ? {
          id: 'course',
          label: `Research: ${courses[0].title}`,
          href: careerHubPathHref(careerHubPathId),
          target: 1,
        }
      : { id: 'interview', label: 'Interview practice', href: '/interview-coach', target: 1 },
  ]

  const regulated =
    archetype === 'dental' ||
    archetype === 'nursing' ||
    archetype === 'regulated_health' ||
    Boolean(blueprint?.regulated)

  return {
    id: `${industryId}:${specId}`,
    industryId: industryId as ExperienceIndustryId,
    specialisationId: specId,
    label,
    careerHubPathId,
    goals,
    timelines,
    jobs,
    essentialActions,
    outsideUkActions,
    courses,
    cvImprovements,
    missions,
    recognitionSummary: `Your ${label} experience transfers to the UK — complete profession-specific requirements before applying at your level.`,
    skillsExpected: skills,
    insights,
    regulated,
  }
}

export function analyzeProfession(answers: ExperiencePathAnswers): GeneratedExperienceProfile {
  const industryId = answers.industry
  const specIds = parseExperienceSpecialisations(answers as unknown as Record<string, string>)

  if (specIds.length <= 1) {
    const specId = specIds[0] || (industryId === 'other' ? 'other_role' : industryId)
    const profile = analyzeProfessionSingle(answers, specId)
    lastInsights = profile.insights
    lastProgression = resolveCareerProgression(
      answers,
      profile.label,
      inferExperienceTier(answers)
    )
    return profile
  }

  const labels = specIds.map((id) =>
    resolveExperienceSpecialisationLabel(industryId, id, answers.experience_specialisation_other)
  )
  const combinedLabel = formatCombinedLabels(labels)
  const profiles = specIds.map((id, i) => analyzeProfessionSingle(answers, id, labels[i]))
  const merged = mergeExperienceProfiles(profiles, combinedLabel, specIds, labels)

  lastInsights = merged.insights
  lastProgression = resolveCareerProgression(answers, combinedLabel, inferExperienceTier(answers))

  const pathSummary = buildCombinedReadinessSummary(getPathReadiness())
  merged.insights = {
    ...merged.insights,
    fastestEntryRoute: pathSummary,
  }

  return merged
}
