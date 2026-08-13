/**
 * Classify a course/opportunity for Work in My Education alignment.
 */

import {
  cscsAllowed,
  electricalLicenceAllowed,
  fieldContextBlob,
  isCscsTitle,
  isElectricalLicenceTitle,
  matchContamination,
} from './contamination'
import { inferPurposeFromTitle, PURPOSE_LABELS, titleMatchesEducationField } from './purpose-rules'
import type {
  CareerGoalPath,
  WieAdminBadge,
  WieCourseAlignment,
  WieCourseAlignmentInput,
  WieRecommendContext,
} from './types'
import { WIE_GOAL } from './types'

const OTHER_GOALS: CareerGoalPath[] = [
  'start_new_career',
  'work_in_experience',
  'extra_income',
  'grow_current_career',
  'start_business',
]

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function normalizeGoals(keys: string[] | null | undefined): CareerGoalPath[] {
  const out: CareerGoalPath[] = []
  for (const k of keys ?? []) {
    const key = k.trim().toLowerCase() as CareerGoalPath
    if (
      key === 'work_in_education' ||
      key === 'work_in_experience' ||
      key === 'start_new_career' ||
      key === 'grow_current_career' ||
      key === 'extra_income' ||
      key === 'start_business'
    ) {
      out.push(key)
    }
  }
  return uniq(out)
}

export function classifyWieCourse(input: WieCourseAlignmentInput): WieCourseAlignment {
  const title = `${input.title ?? ''} ${input.shortLabel ?? ''}`.trim()
  const educationFields = (input.educationFields ?? []).map((s) => s.trim()).filter(Boolean)
  const specialisms = (input.specialisations ?? []).map((s) => s.trim()).filter(Boolean)
  const goalKeys = normalizeGoals(input.goalKeys)
  const routeLabels = input.routeLabels ?? []
  const fieldContext = fieldContextBlob([
    ...educationFields,
    ...specialisms,
    ...routeLabels,
    input.adminNotes,
  ])
  const stageHints = (input.stageHints ?? []).filter(Boolean)

  const contamination = matchContamination(title, fieldContext)
  const badges: WieAdminBadge[] = []

  // —— Hard exclusion: contamination without field allow ——
  if (contamination && !contamination.allowedForField) {
    return {
      education_field: educationFields,
      specialism: specialisms,
      stage: stageHints,
      purpose: 'not_suitable_for_work_in_education',
      recommended_for_goal: goalKeys.filter((g) => g !== WIE_GOAL),
      recommendation_strength: 'none',
      user_stage_fit: [],
      commercial_status: input.commercialStatus || 'no_link',
      provider_status: input.providerStatus || 'Need check',
      primary_goal_paths: contamination.rule.primary_goal_paths,
      excluded_goal_paths: [WIE_GOAL],
      admin_badges: ['not_for_work_in_education', 'possible_contamination_risk'],
      contamination_risk: true,
      exclusion_reason: `${contamination.rule.label} is not suitable for Work in My Education unless the education field is related.`,
      purpose_label: PURPOSE_LABELS.not_suitable_for_work_in_education,
    }
  }

  // CSCS / electrical licences need field fit
  if (isCscsTitle(title) && !cscsAllowed(fieldContext, stageHints.join(' '))) {
    return {
      education_field: educationFields,
      specialism: specialisms,
      stage: stageHints,
      purpose: 'not_suitable_for_work_in_education',
      recommended_for_goal: goalKeys.filter((g) => g !== WIE_GOAL),
      recommendation_strength: 'none',
      user_stage_fit: [],
      commercial_status: input.commercialStatus || 'no_link',
      provider_status: input.providerStatus || 'Need check',
      primary_goal_paths: ['start_new_career', 'work_in_experience', 'extra_income'],
      excluded_goal_paths: [WIE_GOAL],
      admin_badges: ['not_for_work_in_education', 'possible_contamination_risk'],
      contamination_risk: true,
      exclusion_reason:
        'CSCS is only aligned to Work in My Education for construction/site/built-environment pathways.',
      purpose_label: PURPOSE_LABELS.not_suitable_for_work_in_education,
    }
  }

  if (isElectricalLicenceTitle(title) && !electricalLicenceAllowed(fieldContext)) {
    // Keep as possible WIE technical booster only when field is electrical;
    // otherwise mark excluded from WIE recommendations (still OK on other goals).
    if (!/\b(engineer|construction|electrical|maintenance)\b/i.test(fieldContext)) {
      return {
        education_field: educationFields,
        specialism: specialisms,
        stage: stageHints,
        purpose: 'not_suitable_for_work_in_education',
        recommended_for_goal: goalKeys.filter((g) => g !== WIE_GOAL),
        recommendation_strength: 'none',
        user_stage_fit: [],
        commercial_status: input.commercialStatus || 'no_link',
        provider_status: input.providerStatus || 'Need check',
        primary_goal_paths: ['start_new_career', 'work_in_experience'],
        excluded_goal_paths: [WIE_GOAL],
        admin_badges: ['not_for_work_in_education'],
        contamination_risk: false,
        exclusion_reason: 'Electrical licence courses are only for electrical/building-services education routes.',
        purpose_label: PURPOSE_LABELS.not_suitable_for_work_in_education,
      }
    }
  }

  const inferred = inferPurposeFromTitle(title, input.coursePurpose)
  let purpose = inferred.purpose
  let strength = inferred.strength
  const stages = uniq([...inferred.stages, ...mapStageHints(stageHints)])

  const hasWieGoal = goalKeys.includes(WIE_GOAL)
  const onlyOtherGoals =
    goalKeys.length > 0 && !hasWieGoal && goalKeys.every((g) => OTHER_GOALS.includes(g))

  // Tagged only for other goals + no education mapping → not for WIE
  if (onlyOtherGoals && educationFields.length === 0) {
    purpose = 'not_suitable_for_work_in_education'
    strength = 'none'
    badges.push('not_for_work_in_education')
  }

  if (educationFields.length === 0) badges.push('needs_education_field_mapping')
  if (specialisms.length === 0) badges.push('needs_specialism_mapping')
  if (stageHints.length === 0 && stages.length === 0) badges.push('needs_stage_mapping')

  const contaminationRisk = Boolean(contamination)
  if (contaminationRisk) badges.push('possible_contamination_risk')

  const suitable = purpose !== 'not_suitable_for_work_in_education'
  if (suitable) {
    badges.push('work_in_education_aligned')
  } else if (!badges.includes('not_for_work_in_education')) {
    badges.push('not_for_work_in_education')
  }

  const recommended: CareerGoalPath[] = suitable
    ? uniq([WIE_GOAL, ...goalKeys])
    : goalKeys.filter((g) => g !== WIE_GOAL)

  const primary: CareerGoalPath[] = suitable
    ? hasWieGoal
      ? uniq([WIE_GOAL, ...goalKeys.filter((g) => g !== WIE_GOAL).slice(0, 2)])
      : [WIE_GOAL, ...goalKeys.slice(0, 2)]
    : contamination?.rule.primary_goal_paths ?? goalKeys

  return {
    education_field: educationFields,
    specialism: specialisms,
    stage: stageHints.length ? stageHints : stages,
    purpose,
    recommended_for_goal: recommended,
    recommendation_strength: suitable ? strength : 'none',
    user_stage_fit: stages,
    commercial_status: input.commercialStatus || 'no_link',
    provider_status: input.providerStatus || 'Need check',
    primary_goal_paths: primary.length ? primary : suitable ? [WIE_GOAL] : OTHER_GOALS.slice(0, 3),
    excluded_goal_paths: suitable ? [] : [WIE_GOAL],
    admin_badges: uniq(badges),
    contamination_risk: contaminationRisk,
    exclusion_reason: suitable
      ? null
      : 'Course belongs to another goal path or lacks Work in My Education relevance.',
    purpose_label: PURPOSE_LABELS[purpose],
  }
}

function mapStageHints(hints: string[]): WieCourseAlignment['user_stage_fit'] {
  const out: WieCourseAlignment['user_stage_fit'] = []
  for (const h of hints) {
    if (/foundation|support|assistant|entry/i.test(h)) out.push('foundation')
    else if (/apprentice|trainee|technician/i.test(h)) out.push('apprentice')
    else if (/graduate|junior|associate/i.test(h)) out.push('graduate')
    else if (/specialist|practitioner/i.test(h)) out.push('specialist')
    else if (/chartered|registered|professional|senior/i.test(h)) out.push('professional')
  }
  return out
}

/**
 * Should this course be recommended for a Work in My Education result?
 */
export function isEligibleForWieRecommendation(
  alignment: WieCourseAlignment,
  ctx: WieRecommendContext = {},
  title?: string
): boolean {
  if (alignment.purpose === 'not_suitable_for_work_in_education') return false
  if (alignment.excluded_goal_paths.includes(WIE_GOAL)) return false
  if (!alignment.recommended_for_goal.includes(WIE_GOAL)) return false

  const userBlob = fieldContextBlob([ctx.educationField, ctx.specialism, ctx.stageKey, ctx.stageLabel])
  const courseBlob = fieldContextBlob([...alignment.education_field, ...alignment.specialism])

  if (alignment.purpose === 'uk_workplace_bridge') return true
  if (/\b(general|other|employability)\b/i.test(courseBlob)) return true

  if (!userBlob.trim()) {
    return alignment.education_field.length > 0 && alignment.recommendation_strength !== 'none'
  }

  if (courseBlob && labelsLooseOverlap(userBlob, courseBlob)) return true

  const titleHay = title ?? courseBlob
  if (titleHay && titleMatchesEducationField(titleHay, ctx.educationField, ctx.specialism)) {
    return true
  }

  return false
}

function labelsLooseOverlap(a: string, b: string): boolean {
  const na = a.toLowerCase()
  const nb = b.toLowerCase()
  if (!na.trim() || !nb.trim()) return false
  if (na.includes(nb) || nb.includes(na)) return true
  const tokens = na.split(/[^a-z0-9]+/).filter((t) => t.length > 3)
  return tokens.some((t) => nb.includes(t))
}

export function classifyOpportunityLike(opp: {
  courseName: string
  shortLabel?: string
  coursePurpose?: string
  educationFields?: string[]
  specialisations?: string[]
  goals?: Array<{ goalKey: string }>
  routes?: Array<{ routeLabel: string }>
  commercialStatus?: string
  adminNotes?: string
  providers?: Array<{ providerStatus: string }>
}): WieCourseAlignment {
  return classifyWieCourse({
    title: opp.courseName,
    shortLabel: opp.shortLabel,
    coursePurpose: opp.coursePurpose,
    educationFields: opp.educationFields,
    specialisations: opp.specialisations,
    goalKeys: (opp.goals ?? []).map((g) => g.goalKey),
    routeLabels: (opp.routes ?? []).map((r) => r.routeLabel),
    commercialStatus: opp.commercialStatus,
    providerStatus: opp.providers?.[0]?.providerStatus,
    adminNotes: opp.adminNotes,
  })
}
