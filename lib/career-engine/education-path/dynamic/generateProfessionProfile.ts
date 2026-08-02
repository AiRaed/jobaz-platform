/**
 * Dynamic UK career roadmap generator.
 * Reasons from user answers + regulatory registry + sector strategy — not static templates.
 */

import { resolveSpecialisationLabel } from '../educationSpecialisations'
import type { EducationFieldKnowledge, EducationPathAnswers, JobEntry, QualificationLevel } from '../types'
import type { ProfessionProfile } from '../professionProfiles'
import { getProfessionProfile } from '../professionProfiles'
import { getSectorForField } from './fieldSectors'
import { buildSectorCvImprovements, buildSectorDefaults } from './sectorStrategies'
import { lookupBlueprint } from './ukRegulatoryRegistry'
import type { CareerRoadmapInsights, GenerationContext, SpecialisationBlueprint, UkRequirement } from './types'
import { dedupeEssentialActions } from '@/lib/career-engine/shared/dedupeActions'

const CV = '/cv-builder-v2'
const INTERVIEW = '/interview-coach'

let lastInsights: CareerRoadmapInsights | null = null

export function getLastRoadmapInsights(): CareerRoadmapInsights | null {
  return lastInsights
}

function toJobEntries(
  blueprints: Array<{ title: string; keyword: string; seniority?: JobEntry['seniority']; salary?: string }>
): JobEntry[] {
  return blueprints.map((b) => ({
    title: b.title,
    searchKeyword: b.keyword,
    seniority: b.seniority,
    salaryRange: b.salary,
  }))
}

function filterReqs(ctx: GenerationContext, reqs: UkRequirement[]): UkRequirement[] {
  const { answers } = ctx
  return reqs.filter((r) => {
    if (r.overseasOnly && answers.qualification_origin !== 'outside_uk') return false
    if (r.ukOnly && answers.qualification_origin !== 'uk') return false
    if (r.whenEnglishLow && !['beginner', 'basic'].includes(answers.english_level)) return false
    if (r.whenOpenToCourses && answers.open_to_courses !== 'yes') return false
    return true
  })
}

function mergeBlueprintIntoProfile(
  base: Partial<ProfessionProfile>,
  blueprint: SpecialisationBlueprint,
  ctx: GenerationContext
): Partial<ProfessionProfile> {
  const { label, keyword, answers } = ctx
  const level = answers.qualification_level
  const reqs = blueprint.requirements ? filterReqs(ctx, blueprint.requirements) : []

  const mandatory = reqs.filter((r) => r.tier === 'mandatory')
  const recommended = reqs.filter((r) => r.tier === 'recommended')

  const essentialActions = [
    ...mandatory.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      href: r.href,
      priority: 'critical' as const,
    })),
    ...(base.essentialActions ?? []),
    ...recommended.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      href: r.href,
      priority: 'recommended' as const,
    })),
  ]

  const dedupedActions = dedupeEssentialActions(essentialActions)

  const jobsByLevel = { ...base.jobsByLevel } as ProfessionProfile['jobsByLevel']
  if (blueprint.jobs) {
    for (const lvl of ['bachelors', 'masters', 'phd'] as QualificationLevel[]) {
      if (blueprint.jobs[lvl]?.length) {
        jobsByLevel[lvl] = toJobEntries(blueprint.jobs[lvl]!)
      }
    }
  }

  if (!jobsByLevel[level]?.length) {
    jobsByLevel[level] = toJobEntries([
      { title: label, keyword, seniority: level === 'bachelors' ? 'graduate' : level === 'masters' ? 'mid' : 'senior' },
      { title: `Junior ${label}`, keyword: `junior ${keyword}`, seniority: 'junior' },
    ])
  }

  const coursesByLevel = { ...base.coursesByLevel } as ProfessionProfile['coursesByLevel']
  if (blueprint.certifications) {
    for (const lvl of ['bachelors', 'masters', 'phd'] as QualificationLevel[]) {
      if (blueprint.certifications[lvl]?.length) {
        coursesByLevel[lvl] = [...(coursesByLevel[lvl] ?? []), ...blueprint.certifications[lvl]!]
      }
    }
  }

  const cvImprovements = [...(base.cvImprovements ?? buildSectorCvImprovements(ctx))]
  if (blueprint.portfolioRequired) {
    cvImprovements.unshift({
      id: 'portfolio',
      title: `${label} Portfolio`,
      description: `UK ${label.toLowerCase()} employers hire on demonstrated work — add portfolio links to your CV.`,
      href: CV,
      priority: 1,
    })
  }

  if (blueprint.cvFocus?.length) {
    blueprint.cvFocus.forEach((focus, i) => {
      cvImprovements.push({
        id: `cv_focus_${i}`,
        title: focus,
        description: `Highlight on your UK CV for ${label.toLowerCase()} applications.`,
        href: CV,
        priority: 2 + i,
      })
    })
  }

  return {
    ...base,
    goalByLevel: { ...base.goalByLevel, ...blueprint.goal },
    timelineByLevel: blueprint.promotionPath
      ? {
          bachelors: blueprint.promotionPath,
          masters: blueprint.promotionPath,
          phd: blueprint.promotionPath,
        }
      : base.timelineByLevel,
    essentialActions: dedupedActions.slice(0, 8),
    jobsByLevel,
    coursesByLevel,
    cvImprovements: cvImprovements.slice(0, 6),
    forbiddenJobPatterns: blueprint.forbiddenPatterns ?? base.forbiddenJobPatterns,
    missionsByLevel: {
      bachelors: [
        ...(mandatory[0]
          ? [{ id: mandatory[0].id, label: `Complete: ${mandatory[0].title}`, href: mandatory[0].href ?? CV, target: 1 }]
          : []),
        { id: 'cv', label: `Build ${label} CV`, href: CV, target: 1 },
        { id: 'apply', label: 'Apply to 5 Jobs', href: `/job-finder?query=${encodeURIComponent(keyword)}`, target: 5 },
        { id: 'interview', label: 'Interview practice', href: INTERVIEW, target: 1 },
      ],
      masters: [
        { id: 'cv', label: `Update ${label} CV`, href: CV, target: 1 },
        { id: 'apply', label: 'Apply to 5 Roles', href: `/job-finder?query=${encodeURIComponent(keyword)}`, target: 5 },
      ],
      phd: [
        { id: 'cv', label: `Build ${label} CV`, href: CV, target: 1 },
        { id: 'apply', label: 'Apply to 5 Senior Roles', href: `/job-finder?query=${encodeURIComponent(keyword)}`, target: 5 },
      ],
    },
  }
}

function buildInsights(
  blueprint: SpecialisationBlueprint | null,
  ctx: GenerationContext,
  profile: Partial<ProfessionProfile>
): CareerRoadmapInsights {
  const { label, sector, answers, knowledge } = ctx
  const gaps: string[] = []

  if (answers.qualification_origin === 'outside_uk' && knowledge.qualificationRecognition.requiredForOutsideUk) {
    gaps.push('UK qualification recognition (ENIC)')
  }
  if (['beginner', 'basic'].includes(answers.english_level)) {
    gaps.push('English language level for UK interviews')
  }

  const critical = (profile.essentialActions ?? []).filter((a) => a.priority === 'critical')
  critical.forEach((a) => {
    if (!gaps.includes(a.title)) gaps.push(a.title)
  })

  const complianceNotes = critical
    .filter((a) => /registration|NMC|GMC|GPhC|HCPC|QTS|DBS|SRA|ARB|RICS|Gas Safe|NICEIC/i.test(a.title))
    .map((a) => a.description)

  const interviewPreparation = [
    ...(blueprint?.interviewTips ?? []),
    `Prepare STAR examples for UK ${label.toLowerCase()} competency interviews.`,
    sector === 'regulated_health' ? 'Know NHS Values and CQC fundamentals.' : '',
    sector === 'technology' ? 'Be ready to demo a project and explain technical decisions.' : '',
  ].filter(Boolean)

  const dailyActions = [
    critical[0] ? `Action: ${critical[0].title}` : `Update your ${label} CV for UK employers`,
    'Apply to 2–3 matched vacancies today',
    'Save promising roles and note required qualifications',
    answers.open_to_courses === 'yes' && (profile.coursesByLevel?.[answers.qualification_level]?.[0])
      ? `Research: ${profile.coursesByLevel[answers.qualification_level]![0].title}`
      : 'Review essential actions on your roadmap',
  ].filter(Boolean) as string[]

  return {
    fastestEntryRoute:
      blueprint?.fastestRoute ??
      (sector === 'technology'
        ? 'Build portfolio → junior role applications → specialise with certs'
        : sector === 'trades'
          ? 'NVQ trade qualification → CSCS → licensed trade work'
          : sector === 'teaching'
            ? 'QTS (or iQTS) → ECT year → permanent teaching post'
            : `UK qualification recognition (if needed) → targeted ${label} applications`),
    longTermPath:
      blueprint?.promotionPath ??
      profile.timelineByLevel?.[answers.qualification_level] ??
      knowledge.careerProgression,
    alternativeRoles:
      blueprint?.alternativeRoles ??
      knowledge.transferableRoles.map((r) => r.title).slice(0, 4),
    interviewPreparation,
    experienceGaps: gaps.slice(0, 6),
    complianceNotes,
    portfolioRequired: Boolean(blueprint?.portfolioRequired || sector === 'technology' || sector === 'creative'),
    dailyActions,
  }
}

function finalizeProfile(partial: Partial<ProfessionProfile>): ProfessionProfile {
  const emptyJobs: JobEntry[] = []
  return {
    goalByLevel: partial.goalByLevel ?? {},
    timelineByLevel: partial.timelineByLevel ?? {
      bachelors: ['Entry', 'Junior', 'Mid', 'Senior', 'Lead'],
      masters: ['Professional', 'Senior', 'Lead', 'Manager', 'Director'],
      phd: ['Specialist', 'Senior', 'Principal', 'Lead', 'Director'],
    },
    cvImprovements: partial.cvImprovements ?? [],
    essentialActions: partial.essentialActions ?? [],
    coursesByLevel: partial.coursesByLevel ?? { bachelors: [], masters: [], phd: [] },
    missionsByLevel: partial.missionsByLevel ?? {
      bachelors: [{ id: 'cv', label: 'Build CV', href: CV, target: 1 }],
      masters: [{ id: 'cv', label: 'Update CV', href: CV, target: 1 }],
      phd: [{ id: 'cv', label: 'Build CV', href: CV, target: 1 }],
    },
    jobsByLevel: partial.jobsByLevel ?? {
      bachelors: emptyJobs,
      masters: emptyJobs,
      phd: emptyJobs,
    },
    forbiddenJobPatterns: partial.forbiddenJobPatterns ?? {},
  }
}

/**
 * Generate a full profession profile dynamically from user answers.
 * Used when no hand-authored FULL_PROFILE exists.
 */
export function generateDynamicProfessionProfile(
  answers: EducationPathAnswers,
  knowledge: EducationFieldKnowledge
): ProfessionProfile {
  const fieldId = answers.education_field
  const specialisationId = answers.education_specialisation
  const label = resolveSpecialisationLabel(fieldId, specialisationId, answers.education_specialisation_other)
  const keyword = label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const sector = getSectorForField(fieldId)

  const ctx: GenerationContext = {
    answers,
    knowledge,
    fieldId,
    specialisationId,
    label,
    keyword,
    sector,
  }

  const blueprint = lookupBlueprint(specialisationId, label)
  const staticBase = getProfessionProfile(fieldId)

  let partial: Partial<ProfessionProfile> = staticBase
    ? { ...staticBase }
    : buildSectorDefaults(ctx)

  if (blueprint) {
    partial = mergeBlueprintIntoProfile(partial, blueprint, ctx)
  } else if (!staticBase) {
    partial = buildSectorDefaults(ctx)
  } else {
    partial = mergeBlueprintIntoProfile(partial, { match: specialisationId, goal: { bachelors: label, masters: `Senior ${label}` } }, ctx)
  }

  const profile = finalizeProfile(partial)
  lastInsights = buildInsights(blueprint, ctx, profile)
  return profile
}
