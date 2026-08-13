/**
 * Server-side helpers to resolve Career Coach course titles into structured cards.
 * Shared by every Career Coach path — not per-route engines.
 */

import type { EducationPathAnswers, EducationPathResult } from '@/lib/career-engine/education-path/types'
import type { ExtraIncomePlanResult } from '@/lib/career-engine/extra-income/types'
import type { CareerEnginePlanResult } from '@/lib/career-engine/shared/planTypes'
import type { StartNewCareerPlanResult } from '@/lib/career-engine/start-new-career/types'
import {
  isTitleSafeForWorkInEducation,
  wieMatchTierBoost,
} from '@/lib/career-engine/work-in-education/course-alignment'
import { trackJazEventServer } from '@/lib/analytics/jazTrackEvent'
import {
  buildOtherSuggestionsFromResult,
  matchEducationRecommendations,
} from './matchEducationRecommendations'
import { loadServerOpportunityPool, loadServerPublishedCourses } from './opportunityPool'
import {
  refineEssentialActions,
  refineWorkNowJobs,
} from './refineEducationCoachDisplay'
import {
  rankResolvedCourseCards,
  resolveCourseRecommendationTitles,
} from './resolveCourseRecommendation'
import type { OtherSuggestion, RecommendationCourseCardData, StructuredCareerRecommendations } from './types'

export type CollectableCourseTitle = {
  title: string
  whyRecommended?: string
}

function collectFromPlanCourses(
  courses: Array<{ title: string; whyReasons?: string[] }>
): CollectableCourseTitle[] {
  return courses.map((c) => ({
    title: c.title,
    whyRecommended: c.whyReasons?.slice(0, 2).join(' ') || undefined,
  }))
}

export async function resolveTitlesToStructuredCourses(
  titles: CollectableCourseTitle[],
  opts?: {
    goal?: string
    route?: string
    educationField?: string
    specialisation?: string
    userAnswers?: Record<string, string>
    limit?: number
    /** Extra candidate titles from field/spec opportunity matching (education). */
    supplementalCards?: RecommendationCourseCardData[]
  }
): Promise<{
  cards: RecommendationCourseCardData[]
  plainAdvice: OtherSuggestion[]
}> {
  const [opportunities, publishedCourses] = await Promise.all([
    loadServerOpportunityPool(),
    loadServerPublishedCourses(),
  ])

  const resolved = resolveCourseRecommendationTitles({
    titles,
    publishedCourses,
    opportunities,
    goal: opts?.goal,
    route: opts?.route,
    educationField: opts?.educationField,
    specialisation: opts?.specialisation,
    userAnswers: opts?.userAnswers,
    limit: 24,
  })

  const merged = rankResolvedCourseCards([
    ...resolved.cards,
    ...(opts?.supplementalCards ?? []),
  ]).slice(0, opts?.limit ?? 4)

  const plainAdvice: OtherSuggestion[] = resolved.plainAdvice.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
  }))

  return { cards: merged, plainAdvice }
}

function jobFinderHref(keyword: string, location: string): string {
  const loc = location && location !== 'UK-wide' ? `&location=${encodeURIComponent(location)}` : ''
  return `/job-finder?query=${encodeURIComponent(keyword)}${loc}`
}

export async function buildStructuredEducationRecommendations(
  answers: EducationPathAnswers,
  result: EducationPathResult
): Promise<StructuredCareerRecommendations> {
  const [opportunities, publishedCourses] = await Promise.all([
    loadServerOpportunityPool(),
    loadServerPublishedCourses(),
  ])

  const wieCtx = {
    educationField: answers.education_field,
    specialism: answers.education_specialisation || answers.education_specialisation_other,
  }

  // Field/spec opportunity cards (may already be structured) + title resolve from Brain courses
  const supplemental = matchEducationRecommendations({
    answers,
    opportunities,
    publishedCourses,
    goalKey: 'work_in_education',
    limit: 8,
    minScore: 38,
  })

  const titleCandidates = collectFromPlanCourses(result.recommendedCourses)

  // Also resolve titles of supplemental opp cards — ensures published take priority when aliases hit
  for (const card of supplemental) {
    titleCandidates.push({ title: card.title, whyRecommended: card.whyRecommended })
  }

  // Common electrical / engineering short-names if Brain named certs differently
  if (answers.education_field === 'engineering') {
    const extras = ['18th Edition', 'ECS', 'APM', 'AutoCAD', 'CSCS', 'IOSH', 'NEBOSH']
    for (const t of extras) {
      if (isTitleSafeForWorkInEducation(t, wieCtx)) titleCandidates.push({ title: t })
    }
  }

  const resolved = resolveCourseRecommendationTitles({
    titles: titleCandidates.filter((t) => isTitleSafeForWorkInEducation(t.title, wieCtx)),
    publishedCourses,
    opportunities,
    goal: 'work_in_education',
    educationField: answers.education_field,
    specialisation: answers.education_specialisation,
    userAnswers: answers as unknown as Record<string, string>,
    limit: 4,
  })

  // Drop any resolved cards that failed WIE title safety (defence in depth)
  const safeResolved = resolved.cards.filter((c) => isTitleSafeForWorkInEducation(c.title, wieCtx))

  const merged = rankResolvedCourseCards([...safeResolved, ...supplemental])
    .sort((a, b) => wieMatchTierBoost(b) - wieMatchTierBoost(a))
    .slice(0, 4)

  // If Brain/resolution only produced unsafe commercial noise, fall back to supplemental (may be gap cards)
  const recommendedCourses =
    merged.length > 0
      ? merged
      : supplemental.slice(0, 4)

  // Learning Loop: record missing provider / suggested course type opportunities
  for (const card of recommendedCourses) {
    if (card.commercialStatus === 'no_link' || card.id.startsWith('wie-gap-')) {
      void trackJazEventServer({
        event_type: 'course_missing_affiliate_detected',
        event_source: 'work_in_education_course_coverage',
        goal_path: 'work_in_education',
        route_title: `${answers.education_field || ''} / ${answers.education_specialisation || ''}`.trim(),
        tool_name: 'work_in_my_education',
        metadata: {
          course_title: card.title,
          coverage: card.id.startsWith('wie-gap-') ? 'missing_course_coverage' : 'needs_provider',
          education_field: answers.education_field,
          specialism: answers.education_specialisation,
        },
      })
    }
  }

  const refinedActions = refineEssentialActions(result.essentialActions, answers)
  const essentialActions = refinedActions.map((action) => ({
    id: action.id,
    title: action.title,
    description: action.description,
    href: action.href,
    priority: action.priority,
  }))

  const refinedJobs = refineWorkNowJobs(
    result.workNow.map(({ title, seniority, searchKeyword, salaryRange }) => ({
      title,
      seniority,
      searchKeyword,
      salaryRange,
    })),
    answers
  )

  const workNow = refinedJobs.map((job) => {
    const existing = result.workNow.find((w) => w.searchKeyword === job.searchKeyword)
    return {
      ...job,
      href: existing?.href ?? jobFinderHref(job.searchKeyword, result.location),
    }
  })

  const otherSuggestions = [
    ...buildOtherSuggestionsFromResult(result),
    ...resolved.plainAdvice.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
    })),
  ]

  return {
    essentialActions,
    recommendedCourses,
    otherSuggestions,
    workNow,
  }
}

export async function buildStructuredPlanRecommendations(
  result: CareerEnginePlanResult,
  opts?: { goal?: string }
): Promise<StructuredCareerRecommendations> {
  const titles = collectFromPlanCourses(result.recommendedCourses)
  const { cards, plainAdvice } = await resolveTitlesToStructuredCourses(titles, {
    goal: opts?.goal,
    limit: 4,
  })

  return {
    essentialActions: result.essentialActions.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      href: a.href,
      priority: a.priority,
    })),
    recommendedCourses: cards,
    otherSuggestions: plainAdvice,
    workNow: result.workNow,
  }
}

export async function buildStructuredExtraIncomeRecommendations(
  result: ExtraIncomePlanResult
): Promise<StructuredCareerRecommendations> {
  const titles = result.qualifications.map((q) => ({
    title: q.title,
    whyRecommended: q.whyHelps,
  }))

  const { cards, plainAdvice } = await resolveTitlesToStructuredCourses(titles, {
    goal: 'extra_income',
    limit: 5,
  })

  // Unmatched qualifications stay as plain advice (cost/pay context)
  for (const q of result.qualifications) {
    const matched = cards.some((c) =>
      c.title.toLowerCase().includes(q.title.toLowerCase().replace(/\bcourse\b/gi, '').trim()) ||
      q.title.toLowerCase().includes(c.title.toLowerCase().replace(/\bcourse\b/gi, '').trim())
    )
    if (!matched && !plainAdvice.some((p) => p.title === q.title)) {
      plainAdvice.push({
        id: `qual-advice-${q.id}`,
        title: q.title,
        description: `${q.whyHelps} Typical cost ${q.cost}, study time ${q.studyTime}. Pay boost ${q.averageIncrease}.`,
      })
    }
  }

  return {
    essentialActions: [],
    recommendedCourses: cards,
    otherSuggestions: plainAdvice,
  }
}

export async function buildStructuredStartNewCareerRecommendations(
  result: StartNewCareerPlanResult
): Promise<StructuredCareerRecommendations> {
  const titles = collectFromPlanCourses(result.recommendedCourses)
  const { cards, plainAdvice } = await resolveTitlesToStructuredCourses(titles, {
    goal: 'start_new_career',
    limit: 4,
  })

  return {
    essentialActions: result.essentialActions.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      href: a.href,
      priority: a.priority,
    })),
    recommendedCourses: cards,
    otherSuggestions: plainAdvice,
  }
}

export async function resolveCareerAssistantCourseTitles(
  titles: string[],
  opts?: { pathId?: string; limit?: number }
): Promise<{
  cards: RecommendationCourseCardData[]
  plainAdvice: OtherSuggestion[]
}> {
  return resolveTitlesToStructuredCourses(
    titles.map((title) => ({ title })),
    {
      route: opts?.pathId,
      limit: opts?.limit ?? 4,
    }
  )
}
