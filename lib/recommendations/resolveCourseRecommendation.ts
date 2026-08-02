/**
 * Universal course recommendation resolver for all Career Coach paths.
 * Priority: published courses → recommendation_only → public_listed → plain advice.
 */

import type { AdminCourse } from '@/lib/admin/courses/types'
import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import { courseSlugFromTitle } from '@/lib/career-hub/marketplace/slug'
import { courseTitlesMatch, softCourseTitleKey } from './courseTitleNormalize'
import { buildGoogleCourseSearchUrl } from './googleSearch'
import type {
  CommercialStatus,
  RecommendationCourseCardData,
  VisibilityStatus,
} from './types'
import {
  opportunityToRecommendationCard,
  resolveCommercialStatusForOpportunity,
  resolveOpportunityUrls,
  resolveRecommendationBadge,
  resolveStatusMessage,
  resolveVisibilityForOpportunity,
} from './visibility'

export type ResolvedMatchSource = 'published_course' | 'opportunity' | 'none'

export type ResolvedCourseKind =
  | 'published_course'
  | 'recommendation_only'
  | 'official_link'
  | 'plain_advice'

export type ResolveCourseRecommendationInput = {
  title: string
  goal?: string
  route?: string
  educationField?: string
  specialisation?: string
  userAnswers?: Record<string, string>
  whyRecommended?: string
  publishedCourses: AdminCourse[]
  opportunities: CourseOpportunity[]
  /** When true, emit detailed match logs (never in production client). */
  debug?: boolean
}

export type ResolvedCourseRecommendation = {
  originalTitle: string
  kind: ResolvedCourseKind
  matchedSource: ResolvedMatchSource
  matchedId?: string
  commercialStatus?: CommercialStatus
  primaryButton?: 'Apply Now' | 'View Course' | 'Search on Google' | 'none'
  card?: RecommendationCourseCardData
  plainAdvice?: {
    id: string
    title: string
    description: string
  }
}

function isDevDebugEnabled(explicit?: boolean): boolean {
  if (explicit === true) return true
  if (explicit === false) return false
  return process.env.NODE_ENV === 'development'
}

function logResolveDebug(payload: Record<string, unknown>) {
  if (!isDevDebugEnabled()) return
  console.debug('[resolveCourseRecommendation]', payload)
}

function primaryButtonFor(
  commercialStatus: CommercialStatus | undefined,
  kind: ResolvedCourseKind
): ResolvedCourseRecommendation['primaryButton'] {
  if (kind === 'plain_advice') return 'none'
  if (commercialStatus === 'affiliate_ready') return 'Apply Now'
  if (commercialStatus === 'official_link') return 'View Course'
  return 'Search on Google'
}

function publishedCourseToCard(
  course: AdminCourse,
  originalTitle: string,
  whyRecommended?: string
): RecommendationCourseCardData {
  const referralUrl = (course.referralUrl || '').trim()
  const officialUrl = (course.officialUrl || '').trim()
  const commercialStatus: CommercialStatus = referralUrl
    ? 'affiliate_ready'
    : officialUrl
      ? 'official_link'
      : 'no_link'
  const visibilityStatus: VisibilityStatus = 'public_listed'
  const keywords = `${course.title} course UK`

  return {
    id: course.id,
    publishedCourseId: course.id,
    slug: courseSlugFromTitle(course.title),
    title: course.title,
    shortDescription: course.shortDescription || course.fullDescription || course.title,
    whyRecommended:
      whyRecommended ||
      `Matched recommended training “${originalTitle}” to a published JobAZ course.`,
    duration: course.duration || undefined,
    level: course.level || undefined,
    purpose: course.coursePurpose || undefined,
    visibilityStatus,
    commercialStatus,
    recommendationType: 'course_type',
    badge: resolveRecommendationBadge(visibilityStatus, commercialStatus),
    // Never show “provider coming soon” for published matches.
    statusMessage:
      commercialStatus === 'affiliate_ready' ? undefined : resolveStatusMessage(commercialStatus),
    referralUrl: referralUrl || undefined,
    officialUrl: officialUrl || undefined,
    publicOfferLabel:
      course.publicOfferEnabled && course.publicOfferLabel
        ? course.publicOfferLabel
        : course.partnerCourse
          ? course.provider
          : undefined,
    suggestedSearchKeywords: keywords,
    googleSearchUrl:
      commercialStatus === 'no_link' ? buildGoogleCourseSearchUrl(keywords) : undefined,
    priority: course.priorityOrder ?? 50,
    matchScore: 100,
    canAddToRoadmap: true,
  }
}

function findPublishedMatch(
  title: string,
  publishedCourses: AdminCourse[]
): AdminCourse | undefined {
  return publishedCourses.find(
    (c) =>
      c.status === 'published' &&
      courseTitlesMatch(title, c.title)
  )
}

function opportunityMatchScore(title: string, opp: CourseOpportunity): number {
  if (!courseTitlesMatch(title, opp.courseName) &&
      !courseTitlesMatch(title, opp.linkedPublishedCourseTitle || '') &&
      !courseTitlesMatch(title, opp.shortLabel || '')) {
    return 0
  }
  let score = 50
  const vis = resolveVisibilityForOpportunity(opp)
  if (vis === 'recommendation_only') score += 30
  if (vis === 'public_listed') score += 20
  if (opp.canBeCourseCard) score += 5
  score += Math.min(10, Math.round((opp.priority ?? 50) / 10))
  return score
}

function findBestOpportunity(
  title: string,
  opportunities: CourseOpportunity[],
  preferredVisibility: VisibilityStatus[]
): CourseOpportunity | undefined {
  const scored = opportunities
    .map((opp) => ({ opp, score: opportunityMatchScore(title, opp) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  for (const vis of preferredVisibility) {
    const hit = scored.find((x) => {
      const resolved = resolveVisibilityForOpportunity(x.opp)
      return resolved === vis
    })
    if (hit) return hit.opp
  }

  // Title-matched internal course cards (e.g. education bank before bulk activate)
  // — only when resolving an explicit recommended title for Career Coach.
  const internalHit = scored.find(
    (x) =>
      x.opp.canBeCourseCard &&
      resolveVisibilityForOpportunity(x.opp) === 'internal' &&
      x.opp.publishStatus !== 'Published' &&
      !x.opp.publishedCourseId
  )
  return internalHit?.opp
}

function opportunityCardKind(opp: CourseOpportunity): ResolvedCourseKind {
  const commercial = resolveCommercialStatusForOpportunity(opp)
  if (commercial === 'official_link' && !resolveOpportunityUrls(opp).referralUrl) {
    return 'official_link'
  }
  const vis = resolveVisibilityForOpportunity(opp)
  if (vis === 'recommendation_only' || vis === 'internal') return 'recommendation_only'
  if (commercial === 'affiliate_ready') return 'published_course'
  return 'official_link'
}

export function resolveCourseRecommendation(
  input: ResolveCourseRecommendationInput
): ResolvedCourseRecommendation {
  const title = input.title.trim()
  const normalised = softCourseTitleKey(title)

  if (!title) {
    return {
      originalTitle: title,
      kind: 'plain_advice',
      matchedSource: 'none',
      primaryButton: 'none',
      plainAdvice: {
        id: 'empty',
        title: '',
        description: '',
      },
    }
  }

  // 1. Published Courses
  const published = findPublishedMatch(title, input.publishedCourses)
  if (published) {
    const card = publishedCourseToCard(published, title, input.whyRecommended)
    const result: ResolvedCourseRecommendation = {
      originalTitle: title,
      kind: 'published_course',
      matchedSource: 'published_course',
      matchedId: published.id,
      commercialStatus: card.commercialStatus,
      primaryButton: primaryButtonFor(card.commercialStatus, 'published_course'),
      card,
    }
    if (isDevDebugEnabled(input.debug)) {
      logResolveDebug({
        original_recommendation_title: title,
        normalised_title: normalised,
        matched_source: result.matchedSource,
        matched_id: result.matchedId,
        commercial_status: result.commercialStatus,
        primary_button: result.primaryButton,
      })
    }
    return result
  }

  // 2. recommendation_only (incl. title-matched internal course cards)
  // 3. public_listed opportunities
  const opp =
    findBestOpportunity(title, input.opportunities, ['recommendation_only']) ||
    findBestOpportunity(title, input.opportunities, ['public_listed']) ||
    findBestOpportunity(title, input.opportunities, ['internal'])

  if (opp) {
    // Prefer linked published course when opportunity points at one still in catalog
    if (opp.publishedCourseId) {
      const linked = input.publishedCourses.find(
        (c) => c.id === opp.publishedCourseId && c.status === 'published'
      )
      if (linked) {
        const card = publishedCourseToCard(linked, title, input.whyRecommended)
        const result: ResolvedCourseRecommendation = {
          originalTitle: title,
          kind: 'published_course',
          matchedSource: 'published_course',
          matchedId: linked.id,
          commercialStatus: card.commercialStatus,
          primaryButton: primaryButtonFor(card.commercialStatus, 'published_course'),
          card,
        }
        if (isDevDebugEnabled(input.debug)) {
          logResolveDebug({
            original_recommendation_title: title,
            normalised_title: normalised,
            matched_source: result.matchedSource,
            matched_id: result.matchedId,
            commercial_status: result.commercialStatus,
            primary_button: result.primaryButton,
          })
        }
        return result
      }
    }

    // Treat internal title matches as recommendation_only for Career Coach display only
    const displayOpp =
      resolveVisibilityForOpportunity(opp) === 'internal'
        ? { ...opp, visibilityStatus: 'recommendation_only' as const }
        : opp

    const card = opportunityToRecommendationCard(
      displayOpp,
      80,
      input.whyRecommended ||
        `Recommended for your Career Coach plan based on “${title}”.`
    )

    if (card) {
      // Force recommendation-only status message when no commercial link
      if (card.commercialStatus === 'no_link') {
        card.statusMessage =
          'JobAZ does not currently have a partner provider for this course. You can search and compare providers.'
        card.badge = 'Recommended course type'
        card.googleSearchUrl = buildGoogleCourseSearchUrl(card.suggestedSearchKeywords)
      }

      const kind = opportunityCardKind(displayOpp)
      const result: ResolvedCourseRecommendation = {
        originalTitle: title,
        kind,
        matchedSource: 'opportunity',
        matchedId: opp.id,
        commercialStatus: card.commercialStatus,
        primaryButton: primaryButtonFor(card.commercialStatus, kind),
        card,
      }
      if (isDevDebugEnabled(input.debug)) {
        logResolveDebug({
          original_recommendation_title: title,
          normalised_title: normalised,
          matched_source: result.matchedSource,
          matched_id: result.matchedId,
          commercial_status: result.commercialStatus,
          primary_button: result.primaryButton,
        })
      }
      return result
    }
  }

  // 4. Plain advice fallback
  const plain: ResolvedCourseRecommendation = {
    originalTitle: title,
    kind: 'plain_advice',
    matchedSource: 'none',
    primaryButton: 'none',
    plainAdvice: {
      id: `advice-${normalised.replace(/\s+/g, '-') || 'item'}`,
      title,
      description:
        input.whyRecommended ||
        'Useful training to research for your goals. JobAZ does not have a structured course card for this yet.',
    },
  }
  if (isDevDebugEnabled(input.debug)) {
    logResolveDebug({
      original_recommendation_title: title,
      normalised_title: normalised,
      matched_source: 'none',
      matched_id: null,
      commercial_status: null,
      primary_button: 'none',
    })
  }
  return plain
}

export function commercialRank(card: RecommendationCourseCardData): number {
  if (card.commercialStatus === 'affiliate_ready') return 400
  if (card.commercialStatus === 'official_link') return 300
  if (card.visibilityStatus === 'recommendation_only') return 200
  return 100
}

export function rankResolvedCourseCards(
  cards: RecommendationCourseCardData[]
): RecommendationCourseCardData[] {
  const seen = new Set<string>()
  const unique: RecommendationCourseCardData[] = []
  for (const card of cards) {
    const key = softCourseTitleKey(card.title) || card.id
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(card)
  }
  return unique.sort(
    (a, b) =>
      commercialRank(b) - commercialRank(a) ||
      b.matchScore - a.matchScore ||
      b.priority - a.priority
  )
}

export type ResolveCourseTitlesResult = {
  cards: RecommendationCourseCardData[]
  plainAdvice: Array<{ id: string; title: string; description: string }>
  resolutions: ResolvedCourseRecommendation[]
}

export function resolveCourseRecommendationTitles(input: {
  titles: Array<string | { title: string; whyRecommended?: string }>
  publishedCourses: AdminCourse[]
  opportunities: CourseOpportunity[]
  goal?: string
  route?: string
  educationField?: string
  specialisation?: string
  userAnswers?: Record<string, string>
  limit?: number
  debug?: boolean
}): ResolveCourseTitlesResult {
  const limit = input.limit ?? 4
  const resolutions: ResolvedCourseRecommendation[] = []
  const cards: RecommendationCourseCardData[] = []
  const plainAdvice: Array<{ id: string; title: string; description: string }> = []
  const seenNorm = new Set<string>()

  for (const item of input.titles) {
    const title = typeof item === 'string' ? item : item.title
    const why = typeof item === 'string' ? undefined : item.whyRecommended
    const norm = softCourseTitleKey(title)
    if (!norm || seenNorm.has(norm)) continue
    seenNorm.add(norm)

    const resolved = resolveCourseRecommendation({
      title,
      whyRecommended: why,
      publishedCourses: input.publishedCourses,
      opportunities: input.opportunities,
      goal: input.goal,
      route: input.route,
      educationField: input.educationField,
      specialisation: input.specialisation,
      userAnswers: input.userAnswers,
      debug: input.debug,
    })
    resolutions.push(resolved)

    if (resolved.card) cards.push(resolved.card)
    else if (resolved.plainAdvice?.title) plainAdvice.push(resolved.plainAdvice)
  }

  return {
    cards: rankResolvedCourseCards(cards).slice(0, limit),
    plainAdvice,
    resolutions,
  }
}
