import type { CareerBrainOutput } from '@/lib/career-brain/types'
import { normalizeCareerBrainOutput } from '@/lib/career-brain/normalizeOutput'
import type { UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import { getActionUrls } from '@/lib/uk-career-assistant/action-map'
import { getGuestCareerSignupUrl, buildGuestMissions } from './guestMissions'
import {
  buildCareerTimeline,
  buildCourseRecommendations,
  buildJobRecommendations,
} from './enrichRecommendations'
import type { CareerActionPlan, ActionTier, MissionItem } from './actionPlanTypes'
import { JOURNEY_STEPS } from './actionPlanTypes'

export type BuildActionPlanInput = {
  result: UkCareerRuleResult & { career_brain?: CareerBrainOutput }
  brain?: CareerBrainOutput | null
  aiSummary?: string | null
  nextBestAction?: string | null
  isGuest?: boolean
  progress?: {
    cvReady?: boolean
    hasBaseCv?: boolean
    appliedJobsCount?: number
    savedJobsCount?: number
    trainingStarted?: boolean
    interviewConfidence?: number
  }
}

/** Maps activity signals to CareerJourneyStrip step index (see JOURNEY_STEPS). */
export function computeJourneyStep(
  progress?: BuildActionPlanInput['progress'],
  hasAssessment = true
): number {
  if (!hasAssessment) return 0

  const p = progress ?? {}
  let step = 1

  if (p.cvReady || p.hasBaseCv) step = 2
  if ((p.appliedJobsCount ?? 0) >= 5) step = 3
  if ((p.interviewConfidence ?? 0) >= 55) step = 4

  return Math.min(step, JOURNEY_STEPS.length - 1)
}

function applySequentialLocks(missions: MissionItem[]): MissionItem[] {
  let previousComplete = true
  return missions.map((mission) => {
    const locked = !previousComplete && !mission.completed
    if (!mission.completed) previousComplete = false
    return { ...mission, locked }
  })
}

function jobFinderHref(title: string, directionId?: string): string {
  if (directionId) return getActionUrls(directionId, title).jobFinderUrl
  return `/job-finder?keyword=${encodeURIComponent(title)}`
}

function buildMissions(
  input: BuildActionPlanInput,
  training?: { label: string; href: string }
): MissionItem[] {
  const guest = input.isGuest ?? false
  if (guest) {
    return buildGuestMissions(getGuestCareerSignupUrl())
  }

  const p = input.progress ?? {}
  const applied = p.appliedJobsCount ?? 0
  const saved = p.savedJobsCount ?? 0

  return applySequentialLocks([
    {
      id: 'cv',
      label: 'Build UK CV',
      href: '/cv-builder-v2',
      completed: Boolean(p.cvReady || p.hasBaseCv),
      guestLocked: false,
      target: 1,
      current: p.cvReady || p.hasBaseCv ? 1 : 0,
    },
    {
      id: 'apply',
      label: 'Apply to 5 Jobs',
      href: '/job-finder',
      completed: applied >= 5,
      guestLocked: false,
      target: 5,
      current: applied,
    },
    {
      id: 'save',
      label: 'Save 3 Jobs',
      href: '/job-finder',
      completed: saved >= 3,
      guestLocked: false,
      target: 3,
      current: saved,
    },
    {
      id: 'training',
      label: training?.label ?? 'Start a Course',
      href: training?.href ?? '/dashboard?tab=training',
      completed: Boolean(p.trainingStarted),
      guestLocked: false,
      target: 1,
      current: p.trainingStarted ? 1 : 0,
    },
  ])
}

export function buildCareerActionPlan(input: BuildActionPlanInput): CareerActionPlan {
  const brain = normalizeCareerBrainOutput(input.brain ?? input.result.career_brain)
  const result = input.result
  const topDirectionId = result.work_now?.directions?.[0]?.direction_id
  const guest = input.isGuest ?? false
  const signupUrl = getGuestCareerSignupUrl()

  const jobs = buildJobRecommendations(brain, result, 3)
  const courses = buildCourseRecommendations(brain, topDirectionId, 3)
  const timeline = buildCareerTimeline(brain, result, jobs, courses)

  const topWork = jobs[0]?.title ?? result.work_now?.directions?.[0]?.direction_title ?? 'jobs'

  const tiers: ActionTier[] = [
    {
      id: 'work_now',
      label: 'Work Now',
      subtitle: 'Start earning quickly',
      items: jobs.map((j) => j.title),
      jobs,
      cta: {
        label: 'Find Jobs',
        href: jobs[0]?.href ?? jobFinderHref(topWork, topDirectionId),
      },
      accent: 'emerald',
    },
    {
      id: 'build_next',
      label: 'Build Next',
      subtitle: 'Skills & qualifications',
      items: courses.map((c) => c.title),
      courses,
      cta: {
        label: 'View Courses',
        href:
          courses[0]?.href ??
          (topDirectionId ? getActionUrls(topDirectionId, topWork).buildPathUrl : '/career-hub'),
      },
      accent: 'cyan',
    },
    {
      id: 'long_term',
      label: 'Long-Term Goal',
      subtitle: 'Your career journey',
      items: timeline.filter((s) => s.kind === 'goal').map((s) => s.label),
      timeline,
      cta: {
        label: 'View Career Plan',
        href: '/dashboard?tab=plan',
      },
      accent: 'violet',
    },
  ]

  if (brain?.businessDiscoveryGrowth?.finalReport) {
    const biz = brain.businessDiscoveryGrowth.finalReport
    tiers[0] = {
      ...tiers[0],
      label: 'Start Now',
      jobs: [
        {
          id: 'biz-start',
          title: biz.mostRealisticModel?.title ?? 'Your business model',
          salaryRange: biz.mostRealisticModel?.revenuePotential,
          demandLevel: 'Medium',
          entryDifficulty: 'Medium',
          hiringSpeed: '30 days',
          badges: ['Self-employed'],
          searchKeyword: biz.businessIdeaLabel ?? 'business',
          href: '/dashboard?tab=plan',
        },
      ],
      items: [biz.mostRealisticModel?.title ?? 'Your business'].filter(Boolean),
      cta: { label: 'View Business Plan', href: '/dashboard?tab=plan' },
    }
    if (biz.roadmap?.longTermGoal) {
      tiers[2] = {
        ...tiers[2],
        timeline: [
          { id: 'today', label: 'Today', kind: 'today' },
          { id: 'goal', label: biz.roadmap.longTermGoal, kind: 'goal' },
        ],
        items: [biz.roadmap.longTermGoal],
      }
    }
  }

  const whySummary =
    brain?.whyThisPath ??
    input.aiSummary ??
    result.summary?.split('\n')[0]?.trim() ??
    undefined

  const oneLiner =
    input.nextBestAction ??
    brain?.practicalNextSteps?.[0]?.label ??
    brain?.nextJobAZActions?.[0]?.label ??
    'Take your next step below — actions first, details when you need them.'

  return {
    headline: brain?.businessDiscoveryGrowth
      ? 'Your startup action plan'
      : brain?.ukTransitionGrowth
        ? 'Your UK career path'
        : 'Your career operating plan',
    oneLiner,
    whySummary: whySummary && whySummary.length > 220 ? `${whySummary.slice(0, 217)}…` : whySummary,
    tiers,
    missions: buildMissions(input, {
      label: courses[0] ? `Start ${courses[0].title}` : 'Start a Course',
      href: courses[0]?.href ?? '/career-hub',
    }),
    journeyStep: computeJourneyStep(input.progress, true),
    pathId: topDirectionId,
    primaryCta: {
      label: guest ? 'Create Free Account' : 'Build CV',
      href: guest ? signupUrl : '/cv-builder-v2',
    },
  }
}
