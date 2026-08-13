/**
 * Work in My Education — training item type taxonomy.
 * Infers type from title/purpose metadata; defaults to knowledge_area (not course).
 */

export type WieTrainingItemType =
  | 'course'
  | 'qualification'
  | 'licence'
  | 'certification'
  | 'skill'
  | 'career_preparation'
  | 'workshop'
  | 'knowledge_area'

export type WieTrainingItemTypeMeta = {
  type: WieTrainingItemType
  label: string
  providerEligible: boolean
  completionTrackable: boolean
  /** Set when type was inferred rather than explicit library metadata */
  inferred: boolean
  needsAdminReview: boolean
}

const TYPE_LABELS: Record<WieTrainingItemType, string> = {
  course: 'Course',
  qualification: 'Qualification',
  licence: 'Licence',
  certification: 'Certification',
  skill: 'Skill to develop',
  career_preparation: 'Career preparation',
  workshop: 'Workshop',
  knowledge_area: 'Knowledge area',
}

export function trainingItemTypeLabel(type: WieTrainingItemType): string {
  return TYPE_LABELS[type]
}

export function isProviderEligibleType(type: WieTrainingItemType): boolean {
  return (
    type === 'course' ||
    type === 'qualification' ||
    type === 'certification' ||
    type === 'licence' ||
    type === 'workshop'
  )
}

export function isCompletionTrackableType(type: WieTrainingItemType): boolean {
  return (
    type === 'course' ||
    type === 'qualification' ||
    type === 'certification' ||
    type === 'licence' ||
    type === 'workshop' ||
    type === 'skill'
  )
}

/**
 * Infer training item type from existing metadata/name.
 * Safe default: knowledge_area (never assume everything is a course).
 */
export function inferWieTrainingItemType(input: {
  title: string
  purpose?: string | null
  coursePurpose?: string | null
  recommendationType?: string | null
  explicitType?: string | null
}): WieTrainingItemTypeMeta {
  const explicit = (input.explicitType ?? '').trim().toLowerCase()
  if (
    explicit &&
    [
      'course',
      'qualification',
      'licence',
      'license',
      'certification',
      'skill',
      'career_preparation',
      'workshop',
      'knowledge_area',
    ].includes(explicit)
  ) {
    const type = (explicit === 'license' ? 'licence' : explicit) as WieTrainingItemType
    return {
      type,
      label: trainingItemTypeLabel(type),
      providerEligible: isProviderEligibleType(type),
      completionTrackable: isCompletionTrackableType(type),
      inferred: false,
      needsAdminReview: false,
    }
  }

  const title = input.title ?? ''
  const purpose = `${input.purpose ?? ''} ${input.coursePurpose ?? ''} ${input.recommendationType ?? ''}`
  const blob = `${title} ${purpose}`

  let type: WieTrainingItemType = 'knowledge_area'
  let needsAdminReview = true

  if (/\b(aat|acca|cima|cipd|pgce|qts|degree|diploma|level\s*[1-7]|nvq|btec)\b/i.test(blob)) {
    type = 'qualification'
    needsAdminReview = false
  } else if (/\b(sia|cscs|licence|license|dbs\s*check)\b/i.test(blob)) {
    type = 'licence'
    needsAdminReview = false
  } else if (/\b(certificat|comptia|iosh|istqb|aws\s+cloud|azure\s+fundamentals)\b/i.test(blob)) {
    type = 'certification'
    needsAdminReview = false
  } else if (/\b(workshop|bootcamp|masterclass)\b/i.test(blob)) {
    type = 'workshop'
    needsAdminReview = false
  } else if (
    /\b(excel|sql|git|github|python|autocad|revit|bim|xero|quickbooks|bookkeeping|payroll|data\s*analysis|research\s*methods)\b/i.test(
      title
    )
  ) {
    // Named tools / core methods — skill or course, never generic career prep
    type = /\b(fundamentals|basics|introduction|course|level)\b/i.test(title) ? 'course' : 'skill'
    needsAdminReview = true
  } else if (
    /\b(cv|interview|applications?|job\s*application|portfolio\s*evidence|career\s*prep)\b/i.test(
      blob
    ) ||
    /public\s*sector\s*applications|uk\s*cv/i.test(title)
  ) {
    type = 'career_preparation'
    needsAdminReview = false
  } else if (
    /\b(charity\s*\/\s*ngo\s*administration|community\s*engagement|project\s*coordination)\b/i.test(
      title
    )
  ) {
    type = 'career_preparation'
    needsAdminReview = true
  } else if (
    /\b(policy\s*research\s*basics|monitoring\s*&\s*evaluation|grant\s*writing)\b/i.test(title)
  ) {
    type = 'knowledge_area'
    needsAdminReview = true
  } else if (
    /\b(course|level\s*[123]|foundation|fundamentals|introduction|basics)\b/i.test(title) ||
    /career_bridge|technical_skill_booster|career starter|cv booster/i.test(purpose)
  ) {
    // Explicit course-like framing OR catalog purpose that maps to learnable modules
    if (/career_bridge|technical_skill_booster/i.test(purpose) && /data\s*analysis|research\s*methods|excel/i.test(title)) {
      type = 'course'
      needsAdminReview = true
    } else if (/\b(course|level\s*[123]|certificate)\b/i.test(title)) {
      type = 'course'
      needsAdminReview = false
    } else if (/technical_skill_booster/i.test(purpose)) {
      type = 'skill'
      needsAdminReview = true
    } else if (/uk_workplace_bridge|career_bridge/i.test(purpose)) {
      type = 'career_preparation'
      needsAdminReview = true
    } else {
      type = 'knowledge_area'
      needsAdminReview = true
    }
  }

  // HSS-specific polish titles from acceptance case
  if (/public\s*sector\s*applications/i.test(title)) {
    type = 'career_preparation'
    needsAdminReview = false
  }
  if (/charity\s*\/\s*ngo\s*administration/i.test(title)) {
    type = 'career_preparation'
    needsAdminReview = true
  }
  if (/policy\s*research\s*basics/i.test(title)) {
    type = 'knowledge_area'
    needsAdminReview = true
  }
  if (/data\s*analysis\s*for\s*social\s*research/i.test(title)) {
    type = 'course'
    needsAdminReview = true
  }
  if (/research\s*methods/i.test(title)) {
    type = 'course'
    needsAdminReview = false
  }

  return {
    type,
    label: trainingItemTypeLabel(type),
    providerEligible: isProviderEligibleType(type),
    completionTrackable: isCompletionTrackableType(type),
    inferred: true,
    needsAdminReview,
  }
}

export function groupTrainingCardsByItemType<T extends { training_item_type?: WieTrainingItemType }>(
  cards: T[]
): {
  courses_and_qualifications: T[]
  skills_to_develop: T[]
  career_preparation: T[]
  knowledge_areas: T[]
} {
  const courses_and_qualifications: T[] = []
  const skills_to_develop: T[] = []
  const career_preparation: T[] = []
  const knowledge_areas: T[] = []

  for (const card of cards) {
    const t = card.training_item_type ?? 'knowledge_area'
    if (t === 'course' || t === 'qualification' || t === 'certification' || t === 'licence' || t === 'workshop') {
      courses_and_qualifications.push(card)
    } else if (t === 'skill') {
      skills_to_develop.push(card)
    } else if (t === 'career_preparation') {
      career_preparation.push(card)
    } else {
      knowledge_areas.push(card)
    }
  }

  return { courses_and_qualifications, skills_to_develop, career_preparation, knowledge_areas }
}
