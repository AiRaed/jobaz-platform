/**
 * Work in My Education — completed-courses question + training comparison for the report.
 * Self-reported training only. No fake providers / Apply Now.
 */

import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import type { AdminCourse } from '@/lib/admin/courses/types'
import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import { matchEducationRecommendations } from '@/lib/recommendations/matchEducationRecommendations'
import { opportunityTitleKeysMatch } from '@/lib/admin/opportunities/titleNormalization'
import { buildGoogleCourseSearchUrl } from '@/lib/recommendations/googleSearch'
import {
  findCatalogPacksForFieldName,
  type WieGapCourseType,
} from './gap-course-catalog'
import { suggestCourseTypesForWieRoute } from './suggested-course-types'
import { isTitleSafeForWorkInEducation } from './filter-recommendations'
import { matchContamination } from './contamination'
import { buildWieMissingCourseTypeCards } from './gap-cards'
import { shouldDeprioritiseCareCourseForRoute } from '../match-safety/course-field-gates'
import type { EducationPathAnswers } from '@/lib/career-engine/education-path/types'
import {
  inferWieTrainingItemType,
  type WieTrainingItemType,
} from './training-item-type'

export type WieCourseConfidence = 'known' | 'not_sure' | 'none'

export type WieCompletedCoursesAnswers = {
  completed_course_types: string[]
  completed_course_notes?: string
  course_confidence?: WieCourseConfidence
}

export type WieCompletedCourseOption = {
  id: string
  label: string
  kind: 'course' | 'none' | 'not_sure' | 'other'
  helpText?: string
}

export type WieTrainingCategory =
  | 'already_completed'
  | 'recommended_next'
  | 'optional_boosters'
  | 'professional_regulated'
  | 'provider_not_listed'

export type WieTrainingCard = RecommendationCourseCardData & {
  training_status: WieTrainingCategory
  /** Friendly public status label */
  status_label: string
  already_completed?: boolean
  training_item_type: WieTrainingItemType
  training_item_type_label: string
  provider_eligible: boolean
  completion_trackable: boolean
  /** True when type was inferred (admin should review library metadata) */
  training_type_inferred?: boolean
  needs_admin_review?: boolean
}

export type WieTrainingRecommendations = {
  already_completed: WieTrainingCard[]
  recommended_next: WieTrainingCard[]
  optional_boosters: WieTrainingCard[]
  professional_regulated: WieTrainingCard[]
  provider_not_listed: WieTrainingCard[]
  completed_course_types: string[]
  course_confidence: WieCourseConfidence
  completed_course_notes?: string
}

export const WIE_COMPLETED_NONE_ID = '__none__'
export const WIE_COMPLETED_NOT_SURE_ID = '__not_sure__'
export const WIE_COMPLETED_OTHER_ID = '__other__'

const SENTINEL_IDS = new Set([
  WIE_COMPLETED_NONE_ID,
  WIE_COMPLETED_NOT_SURE_ID,
  WIE_COMPLETED_OTHER_ID,
])

type StageBand = 'foundation' | 'graduate' | 'professional' | 'academic' | 'general'

function detectStageBand(stageLabel: string, stageKey?: string | null): StageBand {
  const blob = `${stageLabel} ${stageKey ?? ''}`.toLowerCase()
  if (/academic|research|phd|postdoc|doctoral/.test(blob)) return 'academic'
  if (/regulat|charter|profession|senior|qualified|practising|registration/.test(blob))
    return 'professional'
  if (/graduate|junior|entry.?level|early.?career|newly.?qualified/.test(blob)) return 'graduate'
  if (/foundation|support|student|trainee|apprentice|level\s*[12]|fe\b|college/.test(blob))
    return 'foundation'
  return 'general'
}

function purposeFitsStage(
  purpose: string | undefined,
  band: StageBand
): 'primary' | 'optional' | 'skip' {
  const p = (purpose ?? '').toLowerCase()
  if (band === 'foundation') {
    if (/career.?bridge|career starter|technical|skill/.test(p)) return 'primary'
    if (/uk.?workplace|cv booster|cpd/.test(p)) return 'optional'
    if (/professional|advanced|regulat/.test(p)) return 'optional'
    return 'optional'
  }
  if (band === 'graduate') {
    if (/technical|skill|portfolio|uk.?workplace|career.?bridge|cv/.test(p)) return 'primary'
    if (/professional|cpd/.test(p)) return 'optional'
    return 'optional'
  }
  if (band === 'professional') {
    if (/professional|regulat|cpd|recognition|charter/.test(p)) return 'primary'
    if (/technical|skill/.test(p)) return 'optional'
    if (/career.?bridge|career starter/.test(p)) return 'skip'
    return 'optional'
  }
  if (band === 'academic') {
    if (/research|data|writing|lab|academic|method/.test(p)) return 'primary'
    if (/technical|skill/.test(p)) return 'optional'
    return 'optional'
  }
  return 'primary'
}

function isRegulatedPurpose(purpose: string | undefined, title: string): boolean {
  return /regulat|registration|qts|nmc|hcpc|charter|professional pathway|licence|license/i.test(
    `${purpose ?? ''} ${title}`
  )
}

function siteRouteRelevant(fieldName: string, specialismName: string): boolean {
  return /civil|construct|built|architect|survey|site|structural|geotech|quantity/i.test(
    `${fieldName} ${specialismName}`
  )
}

function electricalRouteRelevant(fieldName: string, specialismName: string): boolean {
  return /electric|electron|wiring|mechatron/i.test(`${fieldName} ${specialismName}`)
}

function foodRouteRelevant(fieldName: string, specialismName: string): boolean {
  return /food|hospitality|nutrition|cater|agricultur|chef|culinary/i.test(
    `${fieldName} ${specialismName}`
  )
}

function titleAllowedForRoute(
  title: string,
  fieldName: string,
  specialismName: string
): boolean {
  const ctx = { educationField: fieldName, specialism: specialismName }
  if (!isTitleSafeForWorkInEducation(title, ctx)) return false

  const contamination = matchContamination(title, `${fieldName} ${specialismName}`)
  if (contamination) {
    if (/cscs/i.test(title) && !siteRouteRelevant(fieldName, specialismName)) return false
    if (/\b(ecs|18th\s*edition)\b/i.test(title) && !electricalRouteRelevant(fieldName, specialismName))
      return false
    if (/food\s*hygiene/i.test(title) && !foodRouteRelevant(fieldName, specialismName)) return false
    return contamination.allowedForField
  }

  if (/cscs/i.test(title) && !siteRouteRelevant(fieldName, specialismName)) return false
  if (/\b(ecs|18th\s*edition)\b/i.test(title) && !electricalRouteRelevant(fieldName, specialismName))
    return false
  if (/food\s*hygiene/i.test(title) && !foodRouteRelevant(fieldName, specialismName)) return false
  if (/\b(sia|forklift|taxi|phv|private\s*hire)\b/i.test(title)) return false

  // Humanities / Social Sciences: exclude care/MH/safeguarding from primary lists
  // unless the user clearly selected a care/support direction.
  if (shouldDeprioritiseCareCourseForRoute(title, fieldName, specialismName)) return false

  return true
}

function slugId(title: string): string {
  return `course:${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)}`
}

/**
 * Build multi-select options for the completed-courses wizard step.
 */
export function buildWieCompletedCourseOptions(input: {
  fieldName: string
  specialismName?: string | null
  stageLabel?: string | null
  stageKey?: string | null
  limit?: number
}): WieCompletedCourseOption[] {
  const fieldName = input.fieldName.trim()
  const specialismName = (input.specialismName ?? '').trim()
  const band = detectStageBand(input.stageLabel ?? '', input.stageKey)
  const limit = input.limit ?? 12

  const titles: Array<{ title: string; purpose?: string; priority: number }> = []
  const seen = new Set<string>()

  const push = (title: string, purpose?: string, priority = 50) => {
    const key = title.trim().toLowerCase()
    if (!key || seen.has(key)) return
    if (!titleAllowedForRoute(title, fieldName, specialismName)) return
    seen.add(key)
    titles.push({ title: title.trim(), purpose, priority })
  }

  for (const pack of findCatalogPacksForFieldName(fieldName, specialismName)) {
    for (const course of pack.courses) {
      const fit = purposeFitsStage(course.purpose, band)
      if (fit === 'skip') continue
      push(course.title, course.purpose, course.priority + (fit === 'primary' ? 10 : 0))
    }
  }

  for (const s of suggestCourseTypesForWieRoute({
    fieldName,
    specialismName,
    limit: 10,
  })) {
    push(s.title, s.purpose, s.priority === 'high' ? 80 : s.priority === 'medium' ? 55 : 35)
  }

  if (/educat|teach|primary|secondary|ta\b|early\s*year/i.test(`${fieldName} ${specialismName}`)) {
    ;[
      'Teaching Assistant Level 2',
      'Teaching Assistant Level 3',
      'Safeguarding Children',
      'SEN Awareness',
      'Child Protection',
    ].forEach((t) => push(t, 'career_bridge', 75))
  }
  // Require clear care/health pathway — do not match bare "care" inside unrelated words,
  // and never inject care certificates for Humanities & Social Sciences.
  if (
    /\b(healthcare|health\s*care|nursing|midwif|social\s*care|adult\s*care|care\s*&?\s*support)\b/i.test(
      `${fieldName} ${specialismName}`
    ) &&
    !/humanities|social\s*science|anthropolog|sociolog|politic|history/i.test(
      `${fieldName} ${specialismName}`
    )
  ) {
    ;[
      'Care Certificate',
      'Safeguarding',
      'Moving and Handling',
      'Medication Awareness',
      'Infection Control',
    ].forEach((t) => push(t, 'career_bridge', 78))
  }

  titles.sort((a, b) => b.priority - a.priority)

  const options: WieCompletedCourseOption[] = titles.slice(0, limit).map((t) => ({
    id: slugId(t.title),
    label: t.title,
    kind: 'course' as const,
    helpText: 'Self-reported — select if you have completed related training',
  }))

  options.push(
    {
      id: WIE_COMPLETED_NONE_ID,
      label: 'None yet',
      kind: 'none',
      helpText: 'I have not completed related courses or certificates yet',
    },
    {
      id: WIE_COMPLETED_NOT_SURE_ID,
      label: 'Not sure',
      kind: 'not_sure',
      helpText: 'I am not sure what counts for this pathway',
    },
    {
      id: WIE_COMPLETED_OTHER_ID,
      label: 'Other / something else',
      kind: 'other',
      helpText: 'Add a short note below if needed',
    }
  )

  return options
}

export function normalizeCompletedCoursesSelection(input: {
  selectedIds: string[]
  optionLabelsById?: Record<string, string>
  otherNotes?: string
}): WieCompletedCoursesAnswers {
  const ids = [...new Set(input.selectedIds.map((s) => s.trim()).filter(Boolean))]

  if (ids.includes(WIE_COMPLETED_NONE_ID) || ids.length === 0) {
    return {
      completed_course_types: [],
      course_confidence: 'none',
      completed_course_notes: input.otherNotes?.trim() || undefined,
    }
  }

  if (ids.includes(WIE_COMPLETED_NOT_SURE_ID) && ids.every((id) => SENTINEL_IDS.has(id))) {
    return {
      completed_course_types: [],
      course_confidence: 'not_sure',
      completed_course_notes: input.otherNotes?.trim() || undefined,
    }
  }

  const types: string[] = []
  for (const id of ids) {
    if (SENTINEL_IDS.has(id)) continue
    if (id.startsWith('course:')) {
      const fromMap = input.optionLabelsById?.[id]
      if (fromMap) {
        types.push(fromMap)
        continue
      }
      types.push(
        id
          .replace(/^course:/, '')
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      )
      continue
    }
    types.push(id)
  }

  return {
    completed_course_types: [...new Set(types)],
    course_confidence: 'known',
    completed_course_notes: input.otherNotes?.trim() || undefined,
  }
}

function titlesMatch(a: string, b: string): boolean {
  if (opportunityTitleKeysMatch(a, b)) return true
  const na = a.trim().toLowerCase()
  const nb = b.trim().toLowerCase()
  if (!na || !nb) return false
  return na.includes(nb) || nb.includes(na)
}

function isCompletedTitle(title: string, completed: string[]): boolean {
  return completed.some((c) => titlesMatch(title, c))
}

function attachTrainingType(card: RecommendationCourseCardData): {
  training_item_type: WieTrainingItemType
  training_item_type_label: string
  provider_eligible: boolean
  completion_trackable: boolean
  training_type_inferred: boolean
  needs_admin_review: boolean
} {
  const meta = inferWieTrainingItemType({
    title: card.title,
    purpose: card.purpose,
    recommendationType: card.recommendationType,
    explicitType:
      typeof (card as { trainingItemType?: string }).trainingItemType === 'string'
        ? (card as { trainingItemType?: string }).trainingItemType
        : null,
  })
  return {
    training_item_type: meta.type,
    training_item_type_label: meta.label,
    provider_eligible: meta.providerEligible,
    completion_trackable: meta.completionTrackable,
    training_type_inferred: meta.inferred,
    needs_admin_review: meta.needsAdminReview,
  }
}

function withStatus(
  card: RecommendationCourseCardData,
  training_status: WieTrainingCategory,
  status_label: string,
  already_completed = false
): WieTrainingCard {
  const typeMeta = attachTrainingType(card)
  const showProviderMissing =
    training_status === 'provider_not_listed' && typeMeta.provider_eligible
  return {
    ...card,
    ...typeMeta,
    training_status,
    status_label: showProviderMissing ? 'Provider not listed yet' : status_label,
    already_completed,
    badge:
      training_status === 'already_completed'
        ? 'Already completed'
        : showProviderMissing
          ? 'Provider not listed yet'
          : card.commercialStatus === 'affiliate_ready' && typeMeta.provider_eligible
            ? 'Affiliate available'
            : training_status === 'optional_boosters'
              ? 'Optional'
              : training_status === 'professional_regulated'
                ? 'Professional / regulated'
                : typeMeta.training_item_type_label,
    statusMessage:
      showProviderMissing
        ? card.statusMessage || 'Coming soon on JobAZ — save interest or search courses later.'
        : typeMeta.provider_eligible
          ? card.statusMessage
          : undefined,
  }
}

function completedPlaceholderCard(title: string, route: string): WieTrainingCard {
  return withStatus(
    {
      id: `completed-${slugId(title)}`,
      title,
      shortDescription: 'You marked this as completed training.',
      whyRecommended: `Useful evidence for your ${route} pathway — consider including it on your CV.`,
      bestFor: route,
      visibilityStatus: 'recommendation_only',
      commercialStatus: 'no_link',
      recommendationType: 'course_type',
      badge: 'Already completed',
      statusMessage: 'Self-reported completed training',
      suggestedSearchKeywords: `${title} course UK`,
      priority: 40,
      matchScore: 40,
      canAddToRoadmap: false,
    },
    'already_completed',
    'Already completed',
    true
  )
}

/**
 * Compare self-reported completed courses with aligned Course Library recommendations.
 */
export function buildWieTrainingRecommendations(input: {
  fieldName: string
  specialismName: string
  stageLabel: string
  stageKey?: string | null
  completed: WieCompletedCoursesAnswers
  opportunities: CourseOpportunity[]
  publishedCourses?: AdminCourse[]
}): WieTrainingRecommendations {
  const {
    fieldName,
    specialismName,
    stageLabel,
    stageKey,
    completed,
    opportunities,
    publishedCourses = [],
  } = input

  const confidence: WieCourseConfidence = completed.course_confidence ?? 'none'
  const completedTypes = completed.completed_course_types ?? []
  const band = detectStageBand(stageLabel, stageKey)
  const route = `${specialismName} · ${fieldName}`

  const answers = {
    education_field: fieldName as EducationPathAnswers['education_field'],
    education_specialisation: specialismName,
    education_specialisation_other: '',
    qualification_origin: 'uk',
    qualification_level: 'degree',
    english_level: 'fluent',
    open_to_courses: 'yes',
    preferred_location: 'uk',
  } as EducationPathAnswers

  const cards = matchEducationRecommendations({
    answers,
    opportunities,
    publishedCourses,
    goalKey: 'work_in_education',
    limit: 16,
    minScore: 28,
    educationFieldLabelOverride: fieldName,
    specialisationLabelOverride: specialismName,
  }).filter((c) => titleAllowedForRoute(c.title, fieldName, specialismName))

  let working = [...cards]
  if (working.length < 4) {
    const packs = findCatalogPacksForFieldName(fieldName, specialismName)
    const packSuggestions = packs
      .flatMap((p) => p.courses)
      .filter((c) => titleAllowedForRoute(c.title, fieldName, specialismName))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10)
      .map((c: WieGapCourseType) => ({
        title: c.title,
        purpose: c.purpose,
        priority:
          c.priority >= 84
            ? ('high' as const)
            : c.priority >= 70
              ? ('medium' as const)
              : ('low' as const),
      }))
    const typedSuggestions = suggestCourseTypesForWieRoute({
      fieldName,
      specialismName,
      limit: 10,
    }).filter((s) => titleAllowedForRoute(s.title, fieldName, specialismName))
    // Prefer typed HSS order, then catalog packs; keep unique titles.
    const seenSug = new Set<string>()
    const suggestions = [...typedSuggestions, ...packSuggestions].filter((s) => {
      const k = s.title.toLowerCase()
      if (seenSug.has(k)) return false
      seenSug.add(k)
      return true
    })
    const gapCards = buildWieMissingCourseTypeCards({
      suggestions:
        suggestions.length > 0
          ? suggestions
          : suggestCourseTypesForWieRoute({ fieldName, specialismName, limit: 6 }),
      fieldName,
      specialismName,
      coverageStatus: working.length === 0 ? 'missing_course_coverage' : 'partially_covered',
      limit: 8,
    }).filter((c) => !working.some((w) => titlesMatch(w.title, c.title)))
    working = [...working, ...gapCards]
  }

  const already_completed: WieTrainingCard[] = []
  const recommended_next: WieTrainingCard[] = []
  const optional_boosters: WieTrainingCard[] = []
  const professional_regulated: WieTrainingCard[] = []
  const provider_not_listed: WieTrainingCard[] = []

  for (const card of working) {
    if (isCompletedTitle(card.title, completedTypes)) {
      already_completed.push(
        withStatus({ ...card, canAddToRoadmap: false }, 'already_completed', 'Already completed', true)
      )
      continue
    }

    const typeMeta = attachTrainingType(card)
    const regulated = isRegulatedPurpose(card.purpose, card.title)
    const fit = purposeFitsStage(card.purpose, band)
    const missingProviderLink =
      card.commercialStatus === 'no_link' ||
      (!card.referralUrl?.trim() && !card.officialUrl?.trim())
    // Only treat as "provider not listed" when the item type can realistically have a provider
    const noProvider = missingProviderLink && typeMeta.provider_eligible

    if (regulated) {
      professional_regulated.push(
        withStatus(card, 'professional_regulated', 'Professional / regulated')
      )
      continue
    }

    if (fit === 'skip') continue

    if (fit === 'optional' || (optional_boosters.length < 3 && recommended_next.length >= 3)) {
      if (noProvider) {
        provider_not_listed.push(
          withStatus(
            {
              ...card,
              badge: 'Provider not listed yet',
              statusMessage: 'Coming soon on JobAZ — save interest or search courses later.',
              googleSearchUrl:
                card.googleSearchUrl ||
                buildGoogleCourseSearchUrl(card.suggestedSearchKeywords || `${card.title} course UK`),
            },
            'provider_not_listed',
            'Provider not listed yet'
          )
        )
      } else {
        optional_boosters.push(
          withStatus(card, 'optional_boosters', typeMeta.training_item_type_label)
        )
      }
      continue
    }

    if (noProvider) {
      if (recommended_next.length < 4) {
        recommended_next.push(
          withStatus(
            {
              ...card,
              googleSearchUrl:
                card.googleSearchUrl ||
                buildGoogleCourseSearchUrl(card.suggestedSearchKeywords || `${card.title} course UK`),
            },
            'recommended_next',
            'Provider not listed yet'
          )
        )
      } else {
        provider_not_listed.push(
          withStatus(card, 'provider_not_listed', 'Provider not listed yet')
        )
      }
    } else {
      recommended_next.push(
        withStatus(
          card,
          'recommended_next',
          card.commercialStatus === 'affiliate_ready' && typeMeta.provider_eligible
            ? 'Affiliate available'
            : typeMeta.training_item_type_label
        )
      )
    }
  }

  for (const title of completedTypes) {
    if (already_completed.some((c) => titlesMatch(c.title, title))) continue
    already_completed.push(completedPlaceholderCard(title, route))
  }

  const annotate = (list: WieTrainingCard[], prefix: string) =>
    list.map((c) => {
      const typed = c.training_item_type ? c : { ...c, ...attachTrainingType(c) }
      return {
        ...typed,
        whyRecommended:
          typed.whyRecommended?.includes('generated_from_') ||
          /course opportunity generated/i.test(typed.whyRecommended)
            ? `${prefix} for ${route} (target stage: ${stageLabel}).`
            : typed.whyRecommended || `${prefix} for ${route} (target stage: ${stageLabel}).`,
        shortDescription: /generated_from_|Need provider|admin/i.test(typed.shortDescription)
          ? 'Useful next step for this pathway.'
          : typed.shortDescription,
      }
    })

  const flaggedForAdmin = [
    ...already_completed,
    ...recommended_next,
    ...optional_boosters,
    ...professional_regulated,
    ...provider_not_listed,
  ].filter((c) => c.needs_admin_review)

  if (
    flaggedForAdmin.length > 0 &&
    typeof process !== 'undefined' &&
    process.env.WIE_TRAINING_TYPE_DEBUG === '1'
  ) {
    console.info(
      '[WIE trainingItemType] inferred defaults needing admin review:',
      flaggedForAdmin.slice(0, 12).map((c) => ({
        title: c.title,
        type: c.training_item_type,
        inferred: c.training_type_inferred,
      }))
    )
  }

  return {
    already_completed: annotate(already_completed, 'Completed training'),
    recommended_next: annotate(recommended_next.slice(0, 5), 'Recommended next step'),
    optional_boosters: annotate(optional_boosters.slice(0, 4), 'Optional booster'),
    professional_regulated: annotate(professional_regulated.slice(0, 3), 'Professional requirement'),
    provider_not_listed: annotate(provider_not_listed.slice(0, 4), 'Recommended learning option'),
    completed_course_types: completedTypes,
    course_confidence: confidence,
    completed_course_notes: completed.completed_course_notes,
  }
}

/** Titles safe to suggest for My Plan (exclude completed). */
export function nextTrainingTitlesForPlan(
  training: WieTrainingRecommendations | null | undefined
): string[] {
  if (!training) return []
  return [
    ...training.recommended_next,
    ...training.optional_boosters,
    ...training.professional_regulated,
  ]
    .filter((c) => !c.already_completed)
    .map((c) => c.title)
}

/** Titles for CV Builder context (self-reported completed only). */
export function completedTrainingForCv(
  training: WieTrainingRecommendations | null | undefined
): string[] {
  if (!training) return []
  return training.completed_course_types
}
