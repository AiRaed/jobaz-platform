import type { CareerSectorId } from '@/lib/career-engine/shared/careerSectors'
import type { StartNewCareerPlanResult } from './types'
import { buildStartNewCareerRoadmapForSector } from './roadmapBuilder'
import type { CareerDiscoveryRecommendation } from './types'

function uniqueTitles(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

function buildCourseEntries(
  roadmap: StartNewCareerPlanResult,
  studyWilling: boolean
): CareerDiscoveryRecommendation['courses'] {
  const fromBuildNext = roadmap.triad.buildNext
    .filter((item) => /certificate|certification|course|diploma|nvq|esol|training|compTIA|AAT/i.test(item.title))
    .map((item) => ({
      title: item.title,
      why: item.why[0]?.replace(/^Why:\s*/i, '') ?? '',
      mandatory: studyWilling,
    }))

  const fromCourses = roadmap.recommendedCourses.map((course) => ({
    title: course.title,
    why: course.whyReasons[0] ?? '',
    mandatory: studyWilling,
  }))

  const merged = [...fromBuildNext, ...fromCourses]
  const seen = new Set<string>()
  return merged.filter((c) => {
    const key = c.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 6)
}

function buildTimelineSummary(
  roadmap: StartNewCareerPlanResult,
  urgency?: string
): CareerDiscoveryRecommendation['timeline'] {
  const workNow = roadmap.triad.workNow[0]?.title ?? 'Bridge role'
  const firstTarget =
    roadmap.triad.buildNext.find((b) => b.chips?.includes('Career step'))?.title ??
    roadmap.careerProgression[0] ??
    roadmap.targetField
  const longTerm =
    roadmap.careerProgression[roadmap.careerProgression.length - 1] ??
    roadmap.triad.longTerm[roadmap.triad.longTerm.length - 1]?.title ??
    'Long-term goal'

  const incomeNote =
    urgency === 'immediate'
      ? 'Bridge job first, then evening or part-time certificates alongside work.'
      : 'Balance paid work with part-time training where needed.'

  return {
    estimatedTransition: roadmap.transition.estimatedTimeline,
    bridgeRole: workNow,
    firstTargetRole: firstTarget,
    longTermGoal: longTerm,
    incomeNote,
    phases: roadmap.timelinePhases.map((p) => ({
      period: p.period,
      label: p.label,
      actions: p.actions,
    })),
  }
}

export function buildDiscoveryRecommendationPreview(
  answers: Record<string, string>,
  sectorId: CareerSectorId,
  matchScore: number,
  scoreReasons: string[]
): CareerDiscoveryRecommendation {
  const studyWilling = answers.study_willing !== 'no'
  const roadmap = buildStartNewCareerRoadmapForSector(answers, sectorId)

  const buildNextItems = roadmap.triad.buildNext.map((item) => ({
    title: item.title,
    why: item.why[0]?.replace(/^Why:\s*/i, '') ?? '',
  }))

  const courses = buildCourseEntries(roadmap, studyWilling)

  if (studyWilling && courses.length === 0 && buildNextItems.length > 0) {
    for (const item of buildNextItems) {
      if (/english|cv|experience/i.test(item.title)) continue
      courses.push({ title: item.title, why: item.why, mandatory: true })
    }
  }

  if (!studyWilling && courses.length === 0) {
    for (const course of roadmap.recommendedCourses.slice(0, 3)) {
      courses.push({
        title: course.title,
        why: course.whyReasons[0] ?? 'Optional — strengthens applications when you are ready.',
        mandatory: false,
      })
    }
  }

  const skills = uniqueTitles([
    ...roadmap.transition.transferableSkills,
    ...roadmap.essentialActions.map((a) => a.title),
  ]).slice(0, 6)

  return {
    sectorId,
    label: roadmap.targetField,
    matchScore,
    scoreReasons,
    workNow: roadmap.triad.workNow.map((w) => w.title).slice(0, 4),
    buildNext: buildNextItems.slice(0, 6),
    courses,
    careerProgression: roadmap.careerProgression,
    timeline: buildTimelineSummary(roadmap, answers.urgency),
    readiness: {
      score: roadmap.transition.readinessScore,
      summary: roadmap.transition.readinessSummary,
      missing: roadmap.barriers.slice(0, 4),
    },
    transferableSkills: roadmap.transition.transferableSkills.slice(0, 5),
    skills,
    routeTypeLabel: roadmap.routeTypeLabel,
  }
}
