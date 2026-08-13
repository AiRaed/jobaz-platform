/**
 * Build Training & Licences recommendations for Work in My Profession results.
 * Apply Now only when a real referral URL exists on a matched opportunity/course.
 */

import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import type { AdminCourse } from '@/lib/admin/courses/types'
import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import { opportunityTitleKeysMatch } from '@/lib/admin/opportunities/titleNormalization'
import {
  opportunityToRecommendationCard,
  resolveOpportunityUrls,
} from '@/lib/recommendations/visibility'
import {
  courseMatchesHints,
  findWipCatalogPack,
  type WipCourseGroup,
  type WipGapCourseType,
} from './gap-course-catalog'
import { buildWipMissingCourseTypeCard } from './gap-cards'
import { isTitleSafeForWorkInProfession } from './contamination'

export type WipTrainingCategory =
  | 'required_licence'
  | 'recommended_next'
  | 'useful_boosters'
  | 'provider_not_listed'
  | 'checks'

export type WipTrainingCard = RecommendationCourseCardData & {
  training_status: WipTrainingCategory
  status_label: string
  is_check_not_course?: boolean
}

export type WipTrainingRecommendations = {
  required_licence: WipTrainingCard[]
  recommended_next: WipTrainingCard[]
  useful_boosters: WipTrainingCard[]
  provider_not_listed: WipTrainingCard[]
  checks: WipTrainingCard[]
  result_source: 'work_in_profession_library'
}

function withStatus(
  card: RecommendationCourseCardData,
  training_status: WipTrainingCategory,
  status_label: string,
  is_check_not_course = false
): WipTrainingCard {
  const hasReferral = Boolean(card.referralUrl?.trim())
  return {
    ...card,
    training_status,
    status_label: hasReferral
      ? status_label
      : training_status === 'checks'
        ? status_label
        : 'Provider not listed yet',
    is_check_not_course,
    badge: hasReferral
      ? card.commercialStatus === 'affiliate_ready'
        ? 'Partner offer'
        : status_label
      : training_status === 'checks'
        ? 'Check required'
        : 'Provider not listed yet',
    referralUrl: hasReferral ? card.referralUrl : undefined,
  }
}

function findMatchingOpportunity(
  title: string,
  opportunities: CourseOpportunity[],
  fieldName: string,
  specialismName: string
): CourseOpportunity | null {
  const candidates = opportunities.filter((opp) => {
    if (!opportunityTitleKeysMatch(opp.courseName, title) && !titlesLooseMatch(opp.courseName, title)) {
      return false
    }
    if (!isTitleSafeForWorkInProfession(opp.courseName, fieldName, specialismName)) return false
    return true
  })
  // Prefer affiliate-ready / published-linked
  candidates.sort((a, b) => {
    const aRef = resolveOpportunityUrls(a).referralUrl ? 1 : 0
    const bRef = resolveOpportunityUrls(b).referralUrl ? 1 : 0
    if (aRef !== bRef) return bRef - aRef
    const aWip = (a.goals ?? []).some((g) => g.goalKey === 'work_in_profession') ? 1 : 0
    const bWip = (b.goals ?? []).some((g) => g.goalKey === 'work_in_profession') ? 1 : 0
    return bWip - aWip
  })
  return candidates[0] ?? null
}

function titlesLooseMatch(a: string, b: string): boolean {
  const na = a.trim().toLowerCase()
  const nb = b.trim().toLowerCase()
  if (!na || !nb) return false
  if (na.includes(nb) || nb.includes(na)) return true
  // Key token overlap for SIA Door Supervisor etc.
  const tokens = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !['the', 'and', 'for', 'level', 'course'].includes(t))
  const ta = new Set(tokens(na))
  const tb = tokens(nb)
  const hits = tb.filter((t) => ta.has(t)).length
  return hits >= Math.min(2, tb.length) && hits / Math.max(tb.length, 1) >= 0.5
}

function publishedOverride(
  opp: CourseOpportunity,
  publishedCourses: AdminCourse[],
  why: string,
  matchScore: number
): RecommendationCourseCardData | null {
  const linkedId = opp.publishedCourseId
  if (!linkedId) return null
  const course = publishedCourses.find((c) => c.id === linkedId)
  if (!course || course.status !== 'published') return null
  const referralUrl = (course.referralUrl || opp.linkedPublishedCourseReferralUrl || '').trim()
  const officialUrl = (course.officialUrl || opp.linkedPublishedCourseOfficialUrl || '').trim()
  const base = opportunityToRecommendationCard(opp, matchScore, why)
  if (!base) return null
  return {
    ...base,
    publishedCourseId: course.id,
    title: course.title || base.title,
    referralUrl: referralUrl || undefined,
    officialUrl: officialUrl || undefined,
    commercialStatus: referralUrl ? 'affiliate_ready' : officialUrl ? 'official_link' : 'no_link',
  }
}

function categoryFromGroup(group: WipCourseGroup): WipTrainingCategory {
  if (group === 'required_licence') return 'required_licence'
  if (group === 'recommended_next') return 'recommended_next'
  if (group === 'useful_boosters') return 'useful_boosters'
  return 'checks'
}

function statusLabelFor(group: WipCourseGroup): string {
  if (group === 'required_licence') return 'Required licence / check'
  if (group === 'recommended_next') return 'Recommended next'
  if (group === 'useful_boosters') return 'Useful booster'
  return 'Check required'
}

function collectLicenceHints(roleLicences: string[]): WipGapCourseType[] {
  const out: WipGapCourseType[] = []
  const blob = roleLicences.join(' | ')
  if (/\bSIA\b/i.test(blob) && /door/i.test(blob)) {
    out.push({
      title: 'SIA Door Supervisor',
      group: 'required_licence',
      purpose: 'licence',
      priority: 96,
    })
  } else if (/\bSIA\b/i.test(blob) && /cctv/i.test(blob)) {
    out.push({
      title: 'SIA CCTV Operator',
      group: 'required_licence',
      purpose: 'licence',
      priority: 96,
    })
  } else if (/\bSIA\b/i.test(blob)) {
    out.push({
      title: 'SIA Security Guard',
      group: 'required_licence',
      purpose: 'licence',
      priority: 94,
    })
  }
  if (/\bDBS\b/i.test(blob)) {
    out.push({
      title: 'DBS check',
      group: 'check_only',
      purpose: 'check',
      priority: 95,
      isCheckNotCourse: true,
    })
  }
  if (/\bCSCS\b/i.test(blob)) {
    out.push({
      title: 'CSCS Green Card / Level 1 Health & Safety in Construction',
      group: 'required_licence',
      purpose: 'licence',
      priority: 93,
    })
  }
  if (/\bFLT\b|forklift/i.test(blob)) {
    out.push({
      title: 'Forklift Counterbalance',
      group: 'required_licence',
      purpose: 'licence',
      priority: 94,
    })
  }
  if (/\bPCV\b|bus\s*driver|coach\s*driver|Category\s*D/i.test(blob)) {
    out.push({
      title: 'PCV licence training',
      group: 'required_licence',
      purpose: 'licence',
      priority: 95,
      specialismHints: ['bus', 'pcv'],
    })
    if (/cpc|passenger/i.test(blob)) {
      out.push({
        title: 'Driver CPC (passenger transport)',
        group: 'recommended_next',
        purpose: 'licence',
        priority: 90,
        specialismHints: ['bus', 'pcv'],
      })
    }
  }
  if (/\bHGV\b|\bLGV\b|Class\s*[12]|goods\s*vehicle/i.test(blob)) {
    out.push({
      title: 'HGV / LGV licence training',
      group: 'required_licence',
      purpose: 'licence',
      priority: 95,
      specialismHints: ['hgv', 'lgv'],
    })
    if (/cpc|goods/i.test(blob)) {
      out.push({
        title: 'Driver CPC (goods transport)',
        group: 'recommended_next',
        purpose: 'licence',
        priority: 90,
        specialismHints: ['hgv', 'lgv'],
      })
    }
  }
  return out
}

export function buildWipTrainingRecommendations(input: {
  fieldSlug: string
  fieldName: string
  specialismSlug: string
  specialismName: string
  experienceOptionId?: string | null
  professionalLevel?: string | null
  roleLicenceHints?: string[]
  opportunities: CourseOpportunity[]
  publishedCourses?: AdminCourse[]
}): WipTrainingRecommendations {
  const {
    fieldSlug,
    fieldName,
    specialismSlug,
    specialismName,
    experienceOptionId,
    roleLicenceHints = [],
    opportunities,
    publishedCourses = [],
  } = input

  const pack = findWipCatalogPack(fieldSlug)
  const catalogCourses = (pack?.courses ?? []).filter((course) =>
    courseMatchesHints(course, specialismSlug, specialismName, experienceOptionId)
  )

  const fromLicences = collectLicenceHints(roleLicenceHints).filter((c) =>
    isTitleSafeForWorkInProfession(c.title, fieldName, specialismName)
  )

  const merged: WipGapCourseType[] = []
  const seen = new Set<string>()
  for (const course of [...fromLicences, ...catalogCourses]) {
    if (!isTitleSafeForWorkInProfession(course.title, fieldName, specialismName)) continue
    const key = course.title.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(course)
  }

  merged.sort((a, b) => b.priority - a.priority)

  const required_licence: WipTrainingCard[] = []
  const recommended_next: WipTrainingCard[] = []
  const useful_boosters: WipTrainingCard[] = []
  const provider_not_listed: WipTrainingCard[] = []
  const checks: WipTrainingCard[] = []

  merged.slice(0, 12).forEach((course, index) => {
    if (course.isCheckNotCourse || course.group === 'check_only') {
      const card = withStatus(
        buildWipMissingCourseTypeCard({ course, fieldName, specialismName, index }),
        'checks',
        'Check required',
        true
      )
      card.shortDescription = 'This is a background or eligibility check, not a training course.'
      card.whyRecommended = `${course.title} is commonly required for this profession route.`
      card.statusMessage = 'Arrange via employer or official DBS / check channels.'
      card.referralUrl = undefined
      card.commercialStatus = 'no_link'
      checks.push(card)
      return
    }

    const opp = findMatchingOpportunity(course.title, opportunities, fieldName, specialismName)
    const why =
      course.notes || `Aligned to your ${specialismName} · ${fieldName} profession route.`
    const score = Math.min(85, course.priority)
    let base: RecommendationCourseCardData | null = null
    if (opp) {
      base =
        publishedOverride(opp, publishedCourses, why, score) ||
        opportunityToRecommendationCard(opp, score, why)
    }
    if (!base) {
      base = buildWipMissingCourseTypeCard({ course, fieldName, specialismName, index })
    }

    const hasReferral = Boolean(base.referralUrl?.trim())
    const cat = categoryFromGroup(course.group)
    const card = withStatus(base, hasReferral ? cat : cat, statusLabelFor(course.group))

    if (cat === 'required_licence') required_licence.push(card)
    else if (cat === 'recommended_next') recommended_next.push(card)
    else useful_boosters.push(card)

    if (!hasReferral) {
      provider_not_listed.push({
        ...card,
        training_status: 'provider_not_listed',
        status_label: 'Provider not listed yet',
        badge: 'Coming soon on JobAZ',
      })
    }
  })

  // Dedupe across Training & licences sections (one card per normalised title).
  // Slice first so truncated titles can still appear in Coming soon if needed —
  // but Coming soon only includes titles not already shown above.
  const seenTitles = new Set<string>()
  const takeUnique = (cards: WipTrainingCard[]): WipTrainingCard[] => {
    const out: WipTrainingCard[] = []
    for (const card of cards) {
      const key = normalizeCourseTitle(card.title)
      if (!key || seenTitles.has(key)) continue
      seenTitles.add(key)
      out.push(card)
    }
    return out
  }

  return {
    required_licence: takeUnique(required_licence.slice(0, 5)),
    checks: takeUnique(checks.slice(0, 3)),
    recommended_next: takeUnique(recommended_next.slice(0, 5)),
    useful_boosters: takeUnique(useful_boosters.slice(0, 4)),
    provider_not_listed: takeUnique(provider_not_listed.slice(0, 12)),
    result_source: 'work_in_profession_library',
  }
}

function normalizeCourseTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
