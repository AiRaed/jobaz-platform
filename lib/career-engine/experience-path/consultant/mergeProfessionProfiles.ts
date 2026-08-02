/**
 * Merge multiple specialisation profiles into one combined career result.
 */

import type { GeneratedExperienceProfile, ExperienceRoadmapInsights } from '../dynamic/types'
import type { CourseEntry, CvImprovement, EssentialAction, JobEntry } from '@/lib/career-engine/shared/planTypes'
import type { ExperienceTier } from '../types'
import { formatCombinedLabels } from './multiSelect'
import { dedupeEssentialActions, dedupeCvImprovements, dedupeStringList } from '@/lib/career-engine/shared/dedupeActions'

export type PathReadiness = {
  specId: string
  pathLabel: string
  score: number
  ready: boolean
  missingMandatory: string[]
  summary: string
}

let lastPathReadiness: PathReadiness[] = []

export function getPathReadiness(): PathReadiness[] {
  return lastPathReadiness
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function mergeJobs(
  profiles: GeneratedExperienceProfile[],
  tier: ExperienceTier
): Record<ExperienceTier, JobEntry[]> {
  const tiers: ExperienceTier[] = ['skilled', 'senior', 'supervisor', 'manager']
  const result = {} as Record<ExperienceTier, JobEntry[]>

  for (const t of tiers) {
    const seen = new Set<string>()
    const jobs: JobEntry[] = []
    for (const profile of profiles) {
      for (const job of profile.jobs[t] ?? []) {
        const key = job.searchKeyword.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        jobs.push(job)
      }
    }
    result[t] = jobs.slice(0, 6)
  }

  return result
}

function mergeInsights(
  profiles: GeneratedExperienceProfile[],
  combinedLabel: string
): ExperienceRoadmapInsights {
  const alt = new Set<string>()
  const interview = new Set<string>()
  const gaps = new Set<string>()
  const compliance = new Set<string>()
  const skills = new Set<string>()
  const daily = new Set<string>()
  const longTerm = new Set<string>()

  for (const p of profiles) {
    p.insights.alternativeRoles.forEach((r) => alt.add(r))
    p.insights.interviewPreparation.forEach((r) => interview.add(r))
    p.insights.experienceGaps.forEach((r) => gaps.add(r))
    p.insights.complianceNotes.forEach((r) => compliance.add(r))
    p.insights.skillsEmployersExpect.forEach((r) => skills.add(r))
    p.insights.dailyActions.forEach((r) => daily.add(r))
    p.insights.longTermPath.forEach((r) => longTerm.add(r))
  }

  return {
    fastestEntryRoute: `Complete mandatory UK requirements for your selected ${combinedLabel.toLowerCase()} paths → targeted applications at your experience level`,
    longTermPath: dedupeStringList([...longTerm]).slice(0, 6),
    alternativeRoles: dedupeStringList([...alt]).slice(0, 6),
    interviewPreparation: dedupeStringList([...interview]).slice(0, 5),
    experienceGaps: dedupeStringList([...gaps]).slice(0, 6),
    complianceNotes: dedupeStringList([...compliance]).slice(0, 6),
    skillsEmployersExpect: dedupeStringList([...skills]).slice(0, 10),
    portfolioRequired: profiles.some((p) => p.insights.portfolioRequired),
    dailyActions: [...daily].slice(0, 4),
    ukAdvice: [
      `Your combined ${combinedLabel.toLowerCase()} experience transfers to the UK — complete path-specific requirements for each role you are targeting.`,
    ],
  }
}

export function computePathReadiness(
  profiles: GeneratedExperienceProfile[],
  labels: string[],
  specIds: string[]
): PathReadiness[] {
  return profiles.map((profile, i) => {
    const mandatory = profile.essentialActions
      .filter((a) => a.priority === 'critical')
      .map((a) => a.title)
    const score = mandatory.length === 0 ? 78 : mandatory.length <= 2 ? 62 : 48
    const ready = mandatory.length === 0
    const summary =
      ready
        ? `Ready for ${labels[i]} roles at your experience level.`
        : `${labels[i]} roles require: ${mandatory.slice(0, 2).join(', ')}.`

    return {
      specId: specIds[i],
      pathLabel: labels[i],
      score,
      ready,
      missingMandatory: mandatory,
      summary,
    }
  })
}

export function buildCombinedReadinessSummary(paths: PathReadiness[]): string {
  const ready = paths.filter((p) => p.ready)
  const blocked = paths.filter((p) => !p.ready)

  if (ready.length === paths.length) {
    return 'You meet the core requirements for all selected career paths — focus on applications.'
  }
  if (ready.length > 0 && blocked.length > 0) {
    return `Ready for ${ready.map((p) => p.pathLabel).join(' and ')} roles, but ${blocked.map((p) => p.pathLabel).join(' and ')} require additional mandatory requirements.`
  }
  if (blocked.length === 1) {
    return blocked[0].summary
  }
  return `Work through mandatory requirements for each selected path: ${blocked.map((p) => p.pathLabel).join(', ')}.`
}

export function mergeExperienceProfiles(
  profiles: GeneratedExperienceProfile[],
  combinedLabel: string,
  specIds: string[],
  labels: string[]
): GeneratedExperienceProfile {
  const primary = profiles[0]
  const tier: ExperienceTier = 'skilled'

  const essentialActions = dedupeEssentialActions(
    profiles.flatMap((p) => [...p.outsideUkActions, ...p.essentialActions])
  )
  const courses = dedupeById(profiles.flatMap((p) => p.courses)).slice(0, 5) as CourseEntry[]
  const cvImprovements = dedupeCvImprovements(
    profiles.flatMap((p) =>
      p.cvImprovements.map((c) => ({
        ...c,
        id: `${p.specialisationId}_${c.id}`,
        title: profiles.length > 1 ? `${p.label}: ${c.title}` : c.title,
      }))
    )
  ).slice(0, 6)

  const skillsExpected = [...new Set(profiles.flatMap((p) => p.skillsExpected))]
  const insights = mergeInsights(profiles, combinedLabel)
  const jobs = mergeJobs(profiles, tier)

  lastPathReadiness = computePathReadiness(profiles, labels, specIds)

  const missions = [
    essentialActions[0]
      ? {
          id: essentialActions[0].id,
          label: `Start: ${essentialActions[0].title}`,
          href: essentialActions[0].href ?? '/cv-builder-v2',
          target: 1,
        }
      : { id: 'cv', label: `Update ${combinedLabel} CV`, href: '/cv-builder-v2', target: 1 },
    { id: 'apply', label: 'Apply to 5 matching UK jobs', href: '/job-finder', target: 5 },
    courses[0]
      ? { id: 'course', label: `Research: ${courses[0].title}`, href: '/career-hub', target: 1 }
      : { id: 'interview', label: 'Interview practice', href: '/interview-coach', target: 1 },
  ]

  const timelines = primary.timelines
  const goals = primary.goals

  return {
    id: `${primary.industryId}:${specIds.join('+')}`,
    industryId: primary.industryId,
    specialisationId: specIds.join(','),
    label: combinedLabel,
    careerHubPathId: primary.careerHubPathId,
    goals,
    timelines,
    jobs,
    essentialActions,
    outsideUkActions: dedupeEssentialActions(profiles.flatMap((p) => p.outsideUkActions)),
    courses,
    cvImprovements,
    missions,
    recognitionSummary: `Your combined ${combinedLabel.toLowerCase()} experience transfers to the UK — complete requirements for each path you are targeting.`,
    skillsExpected,
    insights,
    regulated: profiles.some((p) => p.regulated),
  }
}

export function resolveCombinedLabel(labels: string[]): string {
  return formatCombinedLabels(labels)
}
