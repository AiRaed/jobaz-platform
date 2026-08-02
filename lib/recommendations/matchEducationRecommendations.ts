import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import type { AdminCourse } from '@/lib/admin/courses/types'
import type { EducationPathAnswers, EducationPathResult } from '@/lib/career-engine/education-path/types'
import { resolveSpecialisationLabel } from '@/lib/career-engine/education-path/educationSpecialisations'
import {
  anyPartialMatch,
  educationFieldLabelsForMatching,
  labelsOverlap,
  normMatchLabel,
  specialisationLabelsForMatching,
} from './educationFieldLabels'
import {
  opportunityToRecommendationCard,
  resolveVisibilityForOpportunity,
} from './visibility'
import type { OtherSuggestion, RecommendationCourseCardData } from './types'
import {
  buildTodaysActionPlan,
  courseTitleBoostForEducation,
} from './refineEducationCoachDisplay'

export type EducationMatchInput = {
  answers: EducationPathAnswers
  opportunities: CourseOpportunity[]
  publishedCourses?: AdminCourse[]
  goalKey?: string
  /** Max cards shown in Career Coach (top matches only). */
  limit?: number
  minScore?: number
}

function hasGoal(opp: CourseOpportunity, goalKey: string): boolean {
  if (!opp.goals?.length) return goalKey === 'work_in_education'
  return opp.goals.some((g) => g.goalKey === goalKey)
}

function scoreOpportunity(
  opp: CourseOpportunity,
  fieldLabels: string[],
  specLabels: string[]
): number {
  let score = 0

  const oppFields = (opp.educationFields ?? []).map(normMatchLabel)
  const oppSpecs = (opp.specialisations ?? []).map(normMatchLabel)

  const fieldMatch = labelsOverlap(fieldLabels, oppFields)
  const fieldPartial = !fieldMatch && anyPartialMatch(fieldLabels, oppFields)
  const specMatch = labelsOverlap(specLabels, oppSpecs)
  const specPartial = !specMatch && anyPartialMatch(specLabels, oppSpecs)

  if (fieldMatch) score += 40
  else if (fieldPartial) score += 25

  if (specMatch) score += 35
  else if (specPartial) score += 20

  if (opp.coursePurpose) score += 4
  score += Math.min(10, Math.round((opp.priority ?? 50) / 10))

  if (opp.recommendationType === 'course_type' || !opp.recommendationType) score += 3

  // Require at least field or specialisation relevance — routes alone are not enough.
  if (!fieldMatch && !fieldPartial && !specMatch && !specPartial) return 0

  return score
}

function publishedCourseCard(
  course: AdminCourse,
  opp: CourseOpportunity | undefined,
  matchScore: number,
  whyRecommended: string
): RecommendationCourseCardData | null {
  if (course.status !== 'published' || !course.showInCareerHub) return null

  const referralUrl = (course.referralUrl || opp?.linkedPublishedCourseReferralUrl || '').trim()
  const officialUrl = (course.officialUrl || opp?.linkedPublishedCourseOfficialUrl || '').trim()
  const commercialStatus = referralUrl ? 'affiliate_ready' : officialUrl ? 'official_link' : 'no_link'

  return {
    id: course.id,
    opportunityId: opp?.id,
    publishedCourseId: course.id,
    slug: opp?.linkedPublishedCourseSlug,
    title: course.title,
    shortDescription: course.shortDescription || course.fullDescription || course.title,
    whyRecommended,
    bestFor: opp?.specialisations.slice(0, 3).join(' · ') || undefined,
    duration: course.duration || undefined,
    level: course.level || undefined,
    purpose: course.coursePurpose || opp?.coursePurpose,
    visibilityStatus: 'public_listed',
    commercialStatus,
    recommendationType: 'course_type',
    badge: commercialStatus === 'affiliate_ready' ? 'JobAZ Partner' : 'Official course link',
    statusMessage: commercialStatus === 'affiliate_ready' ? undefined : 'No JobAZ partner offer yet.',
    referralUrl: referralUrl || undefined,
    officialUrl: officialUrl || undefined,
    publicOfferLabel: course.partnerCourse ? course.provider : undefined,
    suggestedSearchKeywords: opp?.suggestedSearchKeywords || `${course.title} course UK`,
    priority: opp?.priority ?? 50,
    matchScore,
    canAddToRoadmap: true,
  }
}

export function matchEducationRecommendations(input: EducationMatchInput): RecommendationCourseCardData[] {
  const {
    answers,
    opportunities,
    publishedCourses = [],
    goalKey = 'work_in_education',
    limit = 4,
    minScore = 38,
  } = input

  const fieldLabels = educationFieldLabelsForMatching(answers.education_field)
  const specLabels = specialisationLabelsForMatching(
    answers.education_field,
    answers.education_specialisation,
    answers.education_specialisation_other
  )
  const specDisplay = resolveSpecialisationLabel(
    answers.education_field,
    answers.education_specialisation,
    answers.education_specialisation_other
  )

  const scored: RecommendationCourseCardData[] = []
  const seen = new Set<string>()

  for (const opp of opportunities) {
    if (!opp.canBeCourseCard) continue
    if (opp.recommendationType === 'action_type') continue
    if (!hasGoal(opp, goalKey)) continue

    const visibility = resolveVisibilityForOpportunity(opp)
    if (visibility !== 'recommendation_only' && visibility !== 'public_listed') continue

    const matchScore =
      scoreOpportunity(opp, fieldLabels, specLabels) +
      courseTitleBoostForEducation(opp.title, answers as EducationPathAnswers & Record<string, string>)
    if (matchScore < minScore) continue

    if (opp.publishedCourseId) {
      const course = publishedCourses.find((c) => c.id === opp.publishedCourseId)
      if (course) {
        const card = publishedCourseCard(
          course,
          opp,
          matchScore,
          `Matched to ${specDisplay} and your ${goalKey.replace(/_/g, ' ')} goal.`
        )
        if (card && !seen.has(card.id)) {
          seen.add(card.id)
          scored.push(card)
        }
        continue
      }
    }

    const card = opportunityToRecommendationCard(
      opp,
      matchScore,
      `Matched to ${specDisplay} — ${opp.adminNotes || opp.coursePurpose || 'relevant UK training for your background.'}`
    )
    if (!card) continue

    const dedupeKey = normMatchLabel(card.title)
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    scored.push(card)
  }

  for (const course of publishedCourses) {
    if (course.status !== 'published' || !course.showInCareerHub) continue
    if (seen.has(course.id)) continue

    const linkedOpp = opportunities.find((o) => o.publishedCourseId === course.id)
    let matchScore = 0
    if (linkedOpp) {
      matchScore =
        scoreOpportunity(linkedOpp, fieldLabels, specLabels) +
        courseTitleBoostForEducation(course.title, answers as EducationPathAnswers & Record<string, string>)
    }

    if (matchScore < minScore) continue

    const card = publishedCourseCard(
      course,
      linkedOpp,
      matchScore || 30,
      linkedOpp
        ? `Public course matched to ${specDisplay}.`
        : `Published training relevant to your field.`
    )
    if (card) {
      seen.add(course.id)
      scored.push(card)
    }
  }

  return scored
    .sort((a, b) => b.matchScore - a.matchScore || b.priority - a.priority)
    .slice(0, limit)
}

export function buildOtherSuggestionsFromResult(result: EducationPathResult): OtherSuggestion[] {
  const insights = result.careerInsights
  const suggestions: OtherSuggestion[] = []

  const actionPlan = buildTodaysActionPlan(
    insights?.dailyActions,
    insights?.experienceGaps,
    insights?.alternativeRoles
  )
  if (actionPlan) suggestions.push(actionPlan)

  if (insights?.alternativeRoles?.length) {
    suggestions.push({
      id: 'alt-roles',
      title: 'Alternative roles to explore',
      description: insights.alternativeRoles.slice(0, 5).join(' · '),
    })
  }

  if (insights?.experienceGaps?.length) {
    suggestions.push({
      id: 'gaps',
      title: 'Experience gaps to address',
      description: insights.experienceGaps.slice(0, 4).join(' · '),
    })
  }

  return suggestions
}
