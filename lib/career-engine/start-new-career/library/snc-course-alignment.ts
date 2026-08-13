/**
 * Start New Career course cards — reuses WIP alignment + safe commercial rules.
 * Apply Now only when a real referral URL exists.
 */

import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import type { AdminCourse } from '@/lib/admin/courses/types'
import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import { opportunityTitleKeysMatch } from '@/lib/admin/opportunities/titleNormalization'
import {
  opportunityToRecommendationCard,
  resolveOpportunityUrls,
} from '@/lib/recommendations/visibility'
import { buildGoogleCourseSearchUrl } from '@/lib/recommendations/googleSearch'
import {
  buildWipTrainingRecommendations,
  isTitleSafeForWorkInProfession,
  type WipTrainingCard,
} from '@/lib/career-engine/work-in-profession'
import type { SncCareerRoute } from './work-type-routes'

export type SncCourseCard = WipTrainingCard

function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titlesLooseMatch(a: string, b: string): boolean {
  if (opportunityTitleKeysMatch(a, b)) return true
  const na = normalizeTitle(a)
  const nb = normalizeTitle(b)
  if (!na || !nb) return false
  if (na.includes(nb) || nb.includes(na)) return true
  return false
}

function gapCard(
  title: string,
  why: string,
  index: number,
  status: WipTrainingCard['training_status'],
  status_label: string,
  isCheck = false
): SncCourseCard {
  const keywords = `${title} course UK`
  const base: RecommendationCourseCardData = {
    id: `snc-gap-${normalizeTitle(title).replace(/\s+/g, '-')}-${index}`,
    title,
    shortDescription: isCheck
      ? 'This is a check/requirement, not a course product.'
      : 'Recommended for this Start New Career route. Provider not listed on JobAZ yet.',
    whyRecommended: why,
    purpose: isCheck ? 'check' : 'skill',
    visibilityStatus: 'recommendation_only',
    commercialStatus: 'no_link',
    recommendationType: 'course_type',
    badge: isCheck ? 'Check required' : 'Coming soon',
    statusMessage: isCheck
      ? 'Arrange this check through the employer or an approved channel.'
      : 'Provider not listed yet — save interest or search courses later.',
    suggestedSearchKeywords: keywords,
    googleSearchUrl: isCheck ? undefined : buildGoogleCourseSearchUrl(keywords),
    priority: 70,
    matchScore: 35,
    canAddToRoadmap: !isCheck,
  }
  return {
    ...base,
    training_status: isCheck ? 'checks' : status,
    status_label: isCheck ? 'Check required' : 'Provider not listed yet',
    is_check_not_course: isCheck,
    referralUrl: undefined,
  }
}

function findOpportunity(
  title: string,
  opportunities: CourseOpportunity[],
  fieldName: string,
  specialismName: string
): CourseOpportunity | null {
  const candidates = opportunities.filter((opp) => {
    if (
      !opportunityTitleKeysMatch(opp.courseName, title) &&
      !titlesLooseMatch(opp.courseName, title)
    ) {
      return false
    }
    if (!isTitleSafeForWorkInProfession(opp.courseName, fieldName, specialismName)) {
      return false
    }
    return true
  })
  candidates.sort((a, b) => {
    const aRef = resolveOpportunityUrls(a).referralUrl ? 1 : 0
    const bRef = resolveOpportunityUrls(b).referralUrl ? 1 : 0
    return bRef - aRef
  })
  return candidates[0] ?? null
}

function cardFromOpportunity(
  title: string,
  why: string,
  status: WipTrainingCard['training_status'],
  status_label: string,
  opportunities: CourseOpportunity[],
  publishedCourses: AdminCourse[],
  fieldName: string,
  specialismName: string,
  index: number
): SncCourseCard {
  const isCheck = /\bDBS\b/i.test(title)
  if (isCheck) {
    return gapCard(title, why, index, 'checks', 'Check required', true)
  }

  const opp = findOpportunity(title, opportunities, fieldName, specialismName)
  if (opp) {
    const linkedId = opp.publishedCourseId
    const course = linkedId
      ? publishedCourses.find((c) => c.id === linkedId && c.status === 'published')
      : null
    const fromOpp = opportunityToRecommendationCard(opp, 70, why)
    if (fromOpp) {
      const referralUrl = (
        course?.referralUrl ||
        opp.linkedPublishedCourseReferralUrl ||
        resolveOpportunityUrls(opp).referralUrl ||
        ''
      ).trim()
      const hasReferral = Boolean(referralUrl)
      return {
        ...fromOpp,
        title: course?.title || fromOpp.title || title,
        referralUrl: hasReferral ? referralUrl : undefined,
        officialUrl:
          (course?.officialUrl || opp.linkedPublishedCourseOfficialUrl || '').trim() ||
          undefined,
        commercialStatus: hasReferral
          ? 'affiliate_ready'
          : fromOpp.commercialStatus === 'official_link'
            ? 'official_link'
            : 'no_link',
        training_status: status,
        status_label: hasReferral ? status_label : 'Provider not listed yet',
        badge: hasReferral
          ? fromOpp.commercialStatus === 'affiliate_ready'
            ? 'Partner offer'
            : status_label
          : 'Provider not listed yet',
      }
    }
  }
  return gapCard(title, why, index, status, status_label)
}

function findInPool(title: string, pool: SncCourseCard[]): SncCourseCard | null {
  return (
    pool.find(
      (c) =>
        opportunityTitleKeysMatch(c.title, title) || titlesLooseMatch(c.title, title)
    ) ?? null
  )
}

function pickTitles(
  titles: string[],
  pool: SncCourseCard[],
  status: WipTrainingCard['training_status'],
  status_label: string,
  opportunities: CourseOpportunity[],
  publishedCourses: AdminCourse[],
  fieldName: string,
  specialismName: string,
  routeLabel: string
): SncCourseCard[] {
  const seen = new Set<string>()
  const out: SncCourseCard[] = []
  titles.forEach((title, index) => {
    const key = normalizeTitle(title)
    if (!key || seen.has(key)) return
    if (!isTitleSafeForWorkInProfession(title, fieldName, specialismName)) return
    seen.add(key)
    const existing = findInPool(title, pool)
    if (existing) {
      out.push({
        ...existing,
        training_status: existing.is_check_not_course ? 'checks' : status,
        status_label: existing.referralUrl?.trim()
          ? status_label
          : existing.is_check_not_course
            ? 'Check required'
            : 'Provider not listed yet',
      })
      return
    }
    out.push(
      cardFromOpportunity(
        title,
        `Entry step for your new career route: ${routeLabel}.`,
        status,
        status_label,
        opportunities,
        publishedCourses,
        fieldName,
        specialismName,
        index
      )
    )
  })
  return out
}

export function buildSncCourseSections(input: {
  route: SncCareerRoute
  fieldName: string
  specialismName: string
  roleLicenceHints?: string[]
  opportunities: CourseOpportunity[]
  publishedCourses?: AdminCourse[]
}): {
  entry_courses: SncCourseCard[]
  upgrade_courses: SncCourseCard[]
  checks: SncCourseCard[]
  missing_provider_count: number
} {
  const {
    route,
    fieldName,
    specialismName,
    roleLicenceHints = [],
    opportunities,
    publishedCourses = [],
  } = input

  const wip = buildWipTrainingRecommendations({
    fieldSlug: route.field_slug,
    fieldName,
    specialismSlug: route.specialism_slug,
    specialismName,
    experienceOptionId: route.experience_option_id,
    professionalLevel: 'helper_assistant',
    roleLicenceHints,
    opportunities,
    publishedCourses,
  })

  const pool: SncCourseCard[] = [
    ...wip.required_licence,
    ...wip.recommended_next,
    ...wip.useful_boosters,
    ...wip.provider_not_listed,
    ...wip.checks,
  ]

  const entry = pickTitles(
    route.entry_course_titles,
    pool,
    'recommended_next',
    'Start here',
    opportunities,
    publishedCourses,
    fieldName,
    specialismName,
    route.label
  )

  // DBS / checks from WIP that aren't already in entry
  const checks = wip.checks.filter(
    (c) => !entry.some((e) => titlesLooseMatch(e.title, c.title))
  )

  const entryKeys = new Set(
    [...entry, ...checks].map((c) => normalizeTitle(c.title))
  )

  const upgrades = pickTitles(
    route.upgrade_course_titles,
    pool,
    'useful_boosters',
    'Next upgrade',
    opportunities,
    publishedCourses,
    fieldName,
    specialismName,
    route.label
  ).filter((c) => !entryKeys.has(normalizeTitle(c.title)))

  const all = [...entry, ...checks, ...upgrades]
  const missing_provider_count = all.filter(
    (c) => !c.is_check_not_course && !c.referralUrl?.trim()
  ).length

  return {
    entry_courses: entry.slice(0, 6),
    upgrade_courses: upgrades.slice(0, 5),
    checks: checks.slice(0, 3),
    missing_provider_count,
  }
}
