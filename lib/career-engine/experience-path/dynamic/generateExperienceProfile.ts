/**
 * Dynamic UK experience roadmap generator — one unique roadmap per specialisation.
 */

import {
  experienceSpecialisationAllowsFreeText,
  resolveExperienceSpecialisationLabel,
} from '../experienceSpecialisations'
import { resolveCareerProgression } from '../consultant/careerProgression'
import { inferExperienceTier } from '../consultant/professionConsultant'
import { getProfessionArchetype } from '../consultant/professionInterview'
import { resolvePortfolioEvidence, shouldRequirePortfolioEvidence } from '../consultant/portfolioQuestions'
import type { ExperienceIndustryId, ExperiencePathAnswers, ExperienceTier } from '../types'
import { INDUSTRY_CAREER_HUB, JOB, CV, lookupExperienceBlueprint } from './ukExperienceRegistry'
import type {
  ExperienceJobBlueprint,
  ExperienceRoadmapInsights,
  ExperienceSpecialisationBlueprint,
  GeneratedExperienceProfile,
} from './types'
import type { CourseEntry, CvImprovement, EssentialAction, JobEntry } from '@/lib/career-engine/shared/planTypes'

let lastInsights: ExperienceRoadmapInsights | null = null

export function getLastExperienceInsights(): ExperienceRoadmapInsights | null {
  return lastInsights
}

const DEFAULT_TIMELINE: Record<ExperienceTier, string[]> = {
  skilled: ['Skilled role', 'Experienced professional', 'Senior specialist', 'Supervisor', 'Manager'],
  senior: ['Experienced professional', 'Senior specialist', 'Team lead', 'Supervisor', 'Manager'],
  supervisor: ['Senior specialist', 'Supervisor', 'Team manager', 'Operations manager', 'Director'],
  manager: ['Supervisor', 'Manager', 'Senior manager', 'Director', 'Head of department'],
}

function tierGoals(label: string): Record<ExperienceTier, string> {
  return {
    skilled: label,
    senior: `Senior ${label}`,
    supervisor: `${label} Supervisor`,
    manager: `${label} Manager`,
  }
}

function filterReqs(
  blueprint: ExperienceSpecialisationBlueprint | null,
  answers: ExperiencePathAnswers
) {
  if (!blueprint?.requirements) return []
  return blueprint.requirements.filter((r) => {
    if (r.overseasOnly && answers.experience_country !== 'outside_uk') return false
    if (r.ukOnly && answers.experience_country !== 'uk') return false
    return true
  })
}

function blueprintToJobs(
  blueprint: ExperienceSpecialisationBlueprint | null,
  label: string,
  keyword: string
): Record<ExperienceTier, JobEntry[]> {
  const make = (jobs: ExperienceJobBlueprint[]): JobEntry[] =>
    jobs.map((j) => ({
      title: j.title,
      searchKeyword: j.keyword,
      seniority: j.seniority ?? 'mid',
      salaryRange: j.salary,
    }))

  const fromBlueprint = blueprint?.jobs?.length
    ? make(blueprint.jobs)
    : [
        { title: label, searchKeyword: keyword, seniority: 'mid' as const },
        { title: `Senior ${label}`, searchKeyword: `senior ${keyword}`, seniority: 'senior' as const },
        { title: `${label} (UK)`, searchKeyword: `${keyword} UK`, seniority: 'mid' as const },
      ]

  return {
    skilled: fromBlueprint.filter((j) => j.seniority !== 'senior'),
    senior: fromBlueprint,
    supervisor: fromBlueprint.filter((j) => j.seniority !== 'junior'),
    manager: fromBlueprint.filter((j) => j.seniority === 'senior' || j.seniority === 'mid'),
  }
}

function buildInsights(
  blueprint: ExperienceSpecialisationBlueprint | null,
  label: string,
  answers: ExperiencePathAnswers,
  mandatory: EssentialAction[],
  skills: string[],
  progression: ReturnType<typeof resolveCareerProgression>,
  portfolioRequired: boolean
): ExperienceRoadmapInsights {
  const gaps: string[] = []
  if (answers.experience_country === 'outside_uk') gaps.push('UK experience translation on CV')
  if (answers.uk_work_experience === 'no') gaps.push('UK work experience')
  if (['beginner', 'basic'].includes(answers.english_level)) gaps.push('English for UK interviews')
  mandatory.forEach((a) => {
    if (a.priority === 'critical' && !gaps.includes(a.title)) gaps.push(a.title)
  })

  return {
    fastestEntryRoute:
      blueprint?.fastestRoute ??
      `Map your ${label.toLowerCase()} experience to UK titles → complete mandatory requirements → targeted applications`,
    longTermPath: progression.ladder,
    alternativeRoles: blueprint?.alternativeRoles ?? [],
    interviewPreparation: [
      ...(blueprint?.interviewTips ?? []),
      `Prepare STAR examples for UK ${label.toLowerCase()} competency interviews.`,
    ],
    experienceGaps: gaps.slice(0, 6),
    complianceNotes: mandatory
      .filter((a) => /licence|registration|DBS|SIA|GDC|NMC|HCPC|GPhC|CSCS|ECS|CPC|PHV/i.test(a.title))
      .map((a) => a.description),
    skillsEmployersExpect: skills,
    portfolioRequired,
    dailyActions: [
      mandatory[0] ? `Priority: ${mandatory[0].title}` : `Update your ${label} CV for UK employers`,
      'Apply to 2–3 matched UK roles at your experience level',
      'Review mandatory licences and registrations on your roadmap',
    ],
    ukAdvice: blueprint?.ukAdvice ?? [
      `Do not downgrade to entry-level roles — your ${label.toLowerCase()} experience should transfer at the same level.`,
    ],
  }
}

export function generateExperienceProfile(answers: ExperiencePathAnswers): GeneratedExperienceProfile {
  const industryId = answers.industry
  const specId = answers.experience_specialisation
  const label = resolveExperienceSpecialisationLabel(
    industryId,
    specId,
    answers.experience_specialisation_other
  )
  const keyword = label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const blueprint = lookupExperienceBlueprint(specId, label)
  const careerHubPathId = blueprint?.careerHubPathId ?? INDUSTRY_CAREER_HUB[industryId] ?? 'office-admin'
  const archetype = getProfessionArchetype(specId, industryId)
  const portfolioConfig = resolvePortfolioEvidence(industryId, archetype, specId, label)
  const portfolioRequired = shouldRequirePortfolioEvidence(
    industryId,
    archetype,
    specId,
    label,
    Boolean(blueprint?.portfolioRequired)
  )

  const reqs = filterReqs(blueprint, answers)
  const mandatory = reqs
    .filter((r) => r.tier === 'mandatory')
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      href: r.href,
      priority: 'critical' as const,
    }))
  const recommended = reqs
    .filter((r) => r.tier === 'recommended')
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      href: r.href,
      priority: 'recommended' as const,
    }))

  const essentialActions: EssentialAction[] = [...mandatory, ...recommended]

  const outsideUkActions: EssentialAction[] =
    answers.experience_country === 'outside_uk'
      ? [
          {
            id: 'experience_mapping',
            title: 'Experience Mapping',
            description: `Translate your overseas ${label.toLowerCase()} role into UK job titles, metrics, and regulator-recognised skills.`,
            href: CV,
            priority: 'critical',
          },
        ]
      : []

  const skillsExpected =
    blueprint?.skillsExpected ??
    (portfolioRequired
      ? ['Portfolio evidence', 'UK-format CV', 'Technical competency', 'Communication']
      : ['UK-format CV', 'Role-specific competency', 'Health & safety awareness', 'Communication'])

  const cvImprovements: CvImprovement[] = blueprint?.cvImprovements ?? [
    {
      id: 'exp_section',
      title: `${label} Experience Section`,
      description: `Lead with UK-relevant job titles, employers, dates, and measurable achievements for ${label.toLowerCase()} roles.`,
      href: CV,
      priority: 1,
    },
    {
      id: 'licences_cv',
      title: 'Licences & Certifications on CV',
      description: 'List all UK licences, cards, and registrations prominently — recruiters scan for compliance first.',
      href: CV,
      priority: 2,
    },
    {
      id: 'skills_cv',
      title: 'Skills Employers Expect',
      description: skillsExpected.slice(0, 4).join(' · '),
      href: CV,
      priority: 3,
    },
  ]

  if (portfolioConfig) {
    cvImprovements.unshift({
      id: 'portfolio',
      title: portfolioConfig.cvTitle,
      description: portfolioConfig.cvDescription,
      href: CV,
      priority: 1,
    })
  }

  const courses: CourseEntry[] =
    answers.open_to_certifications === 'yes' ? (blueprint?.courses ?? []).slice(0, 3) : []

  const jobs = blueprintToJobs(blueprint, label, keyword)
  const tier = inferExperienceTier(answers)
  const progression = resolveCareerProgression(answers, label, tier)
  const goals = progression.goals
  const timelines = progression.timelines

  const insights = buildInsights(blueprint, label, answers, mandatory, skillsExpected, progression, portfolioRequired)
  lastInsights = insights

  const missions = [
    mandatory[0]
      ? { id: mandatory[0].id, label: `Start: ${mandatory[0].title}`, href: mandatory[0].href ?? CV, target: 1 }
      : { id: 'cv', label: `Update ${label} CV`, href: CV, target: 1 },
    { id: 'apply', label: 'Apply to 5 matching UK jobs', href: JOB(keyword), target: 5 },
    { id: 'save', label: 'Save 3 relevant jobs', href: JOB(keyword), target: 3 },
    courses[0]
      ? { id: 'course', label: `Research: ${courses[0].title}`, href: `/career-hub?route=${careerHubPathId}`, target: 1 }
      : { id: 'interview', label: 'Interview practice', href: '/interview-coach', target: 1 },
  ]

  return {
    id: `${industryId}:${specId}`,
    industryId,
    specialisationId: specId,
    label,
    careerHubPathId,
    goals,
    timelines,
    jobs,
    essentialActions,
    outsideUkActions,
    courses,
    cvImprovements: cvImprovements.slice(0, 5),
    missions,
    recognitionSummary: `Your ${label} experience transfers to the UK — complete profession-specific requirements before applying at your level.`,
    skillsExpected,
    insights,
    regulated: Boolean(blueprint?.regulated),
  }
}

export function resolveExperienceProfile(answers: ExperiencePathAnswers): GeneratedExperienceProfile {
  if (!answers.experience_specialisation) {
    const fallback = answers.industry
    return generateExperienceProfile({
      ...answers,
      experience_specialisation: fallback === 'other' ? 'other_role' : fallback,
    })
  }
  return generateExperienceProfile(answers)
}

export { experienceSpecialisationAllowsFreeText }
