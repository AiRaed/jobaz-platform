/**
 * Extra Income course / licence cards — same commercial safety as WIP/WIE.
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
import type { ExtraIncomeCategoryId, ExtraIncomeOption } from './extra-income-routes'

export type ExtraIncomeCourseCard = RecommendationCourseCardData & {
  training_status:
    | 'required_licence'
    | 'recommended_next'
    | 'useful_boosters'
    | 'provider_not_listed'
    | 'checks'
  status_label: string
  is_check_not_course?: boolean
}

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
  isCheck = false
): RecommendationCourseCardData {
  const keywords = `${title} UK`
  return {
    id: `ei-gap-${normalizeTitle(title).replace(/\s+/g, '-')}-${index}`,
    title,
    shortDescription: isCheck
      ? 'This is a check/requirement, not a course product.'
      : `Recommended for this Extra Income route. Provider not listed on JobAZ yet.`,
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
    googleSearchUrl: isCheck ? undefined : buildGoogleCourseSearchUrl(`${title} course UK`),
    priority: 70,
    matchScore: 35,
    canAddToRoadmap: !isCheck,
  }
}

function findOpportunity(
  title: string,
  opportunities: CourseOpportunity[]
): CourseOpportunity | null {
  const candidates = opportunities.filter(
    (opp) =>
      opportunityTitleKeysMatch(opp.courseName, title) ||
      titlesLooseMatch(opp.courseName, title)
  )
  candidates.sort((a, b) => {
    const aRef = resolveOpportunityUrls(a).referralUrl ? 1 : 0
    const bRef = resolveOpportunityUrls(b).referralUrl ? 1 : 0
    return bRef - aRef
  })
  return candidates[0] ?? null
}

function toCard(
  base: RecommendationCourseCardData,
  status: ExtraIncomeCourseCard['training_status'],
  status_label: string,
  isCheck = false
): ExtraIncomeCourseCard {
  if (isCheck) {
    return {
      ...base,
      training_status: 'checks',
      status_label: 'Check required',
      badge: 'Check required',
      is_check_not_course: true,
      referralUrl: undefined,
    }
  }
  const hasReferral = Boolean(base.referralUrl?.trim())
  return {
    ...base,
    training_status: status,
    status_label: hasReferral ? status_label : 'Provider not listed yet',
    badge: hasReferral
      ? base.commercialStatus === 'affiliate_ready'
        ? 'Partner offer'
        : status_label
      : 'Provider not listed yet',
    referralUrl: hasReferral ? base.referralUrl : undefined,
  }
}

function buildCardsForTitles(
  titles: string[],
  why: string,
  status: ExtraIncomeCourseCard['training_status'],
  statusLabel: string,
  opportunities: CourseOpportunity[],
  publishedCourses: AdminCourse[],
  asChecks = false
): ExtraIncomeCourseCard[] {
  const seen = new Set<string>()
  const out: ExtraIncomeCourseCard[] = []

  titles.forEach((title, index) => {
    const key = normalizeTitle(title)
    if (!key || seen.has(key)) return
    seen.add(key)

    if (asChecks || /\bDBS\b|local authority/i.test(title)) {
      out.push(toCard(gapCard(title, why, index, true), 'checks', 'Check required', true))
      return
    }

    const opp = findOpportunity(title, opportunities)
    let base: RecommendationCourseCardData | null = null
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
        base = {
          ...fromOpp,
          title: course?.title || fromOpp.title,
          referralUrl: referralUrl || undefined,
          officialUrl:
            (course?.officialUrl || opp.linkedPublishedCourseOfficialUrl || '').trim() ||
            undefined,
          commercialStatus: referralUrl
            ? 'affiliate_ready'
            : fromOpp.commercialStatus === 'official_link'
              ? 'official_link'
              : 'no_link',
        }
      }
    }
    if (!base) base = gapCard(title, why, index)
    out.push(toCard(base, status, statusLabel))
  })

  return out
}

/**
 * Contamination: only allow SIA/Forklift/Care Certificate titles for relevant options.
 */
export function isCourseTitleAllowedForOption(
  title: string,
  option: ExtraIncomeOption
): boolean {
  const t = title
  const blob = `${option.option_title} ${option.recommended_courses_or_licences.join(' ')} ${option.possible_job_titles.join(' ')}`
  if (/\bSIA\b|Door Supervisor|CCTV Operator/i.test(t)) {
    return /SIA|Door Supervisor|CCTV|security|control room/i.test(blob)
  }
  if (/\bforklift|FLT|reach truck|counterbalance/i.test(t)) {
    return /forklift|FLT|warehouse/i.test(blob)
  }
  if (/\bCare Certificate|Safeguarding Adults|Moving & Handling/i.test(t)) {
    return /care|support|safeguarding|moving/i.test(blob)
  }
  if (/\bCSCS|Asbestos|Working at Height/i.test(t)) {
    return /CSCS|construction|labour|site/i.test(blob)
  }
  return true
}

export function buildExtraIncomeCourseCards(input: {
  option: ExtraIncomeOption
  opportunities: CourseOpportunity[]
  publishedCourses?: AdminCourse[]
}): {
  required_or_recommended: ExtraIncomeCourseCard[]
  optional_boosters: ExtraIncomeCourseCard[]
  missing_provider_count: number
} {
  const { option, opportunities, publishedCourses = [] } = input
  const category = option.category

  const primaryTitles = (option.recommended_courses_or_licences || []).filter((t) =>
    isCourseTitleAllowedForOption(t, option)
  )
  const boosterTitles = (option.optional_boosters || []).filter((t) =>
    isCourseTitleAllowedForOption(t, option)
  )

  let primaryStatus: ExtraIncomeCourseCard['training_status'] = 'useful_boosters'
  let primaryLabel = 'Optional booster'
  if (category === 'licence_based') {
    primaryStatus = 'required_licence'
    primaryLabel = 'Required licence / training'
  } else if (category === 'quick_shifts_short_training') {
    primaryStatus = 'recommended_next'
    primaryLabel = 'Recommended short training'
  } else if (category === 'online_from_home' || category === 'start_without_licence') {
    primaryStatus = 'useful_boosters'
    primaryLabel = 'Optional booster'
  }

  // No-licence / online: only boosters, not aggressive course push
  const primary =
    category === 'start_without_licence' || category === 'online_from_home'
      ? []
      : buildCardsForTitles(
          primaryTitles,
          `Aligned to your Extra Income option: ${option.option_title}.`,
          primaryStatus,
          primaryLabel,
          opportunities,
          publishedCourses
        )

  const checkCards = buildCardsForTitles(
    option.required_checks || [],
    `Required check for ${option.option_title}.`,
    'checks',
    'Check required',
    opportunities,
    publishedCourses,
    true
  )

  const boosters = buildCardsForTitles(
    category === 'start_without_licence' || category === 'online_from_home'
      ? [...boosterTitles, ...primaryTitles]
      : boosterTitles,
    `Optional booster for ${option.option_title}.`,
    'useful_boosters',
    'Optional booster',
    opportunities,
    publishedCourses
  )

  const seen = new Set(
    [...primary, ...checkCards].map((c) => normalizeTitle(c.title))
  )
  const boostersUnique = boosters.filter((c) => {
    const key = normalizeTitle(c.title)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const all = [...primary, ...checkCards, ...boostersUnique]
  const missing_provider_count = all.filter(
    (c) => !c.is_check_not_course && !c.referralUrl?.trim()
  ).length

  return {
    required_or_recommended: [...primary, ...checkCards].slice(0, 6),
    optional_boosters: boostersUnique.slice(0, 4),
    missing_provider_count,
  }
}

export function categoryShowsCoursesFirst(category: ExtraIncomeCategoryId): boolean {
  return category === 'quick_shifts_short_training' || category === 'licence_based'
}
