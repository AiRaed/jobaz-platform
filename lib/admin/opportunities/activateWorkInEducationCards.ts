import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import {
  WORK_IN_EDUCATION_BANK_SEED_NOTES,
  WORK_IN_EDUCATION_OPPORTUNITY_BANK,
} from '@/lib/admin/opportunities/workInEducationBank'
import { normalizeOpportunityTitleKey } from '@/lib/admin/opportunities/titleNormalization'
import { normalizeVisibilityStatus, resolveOpportunityUrls } from '@/lib/recommendations/visibility'

const WORK_IN_EDUCATION_GOAL_KEY = 'work_in_education'

const BANK_TITLE_KEYS = new Set(
  WORK_IN_EDUCATION_OPPORTUNITY_BANK.map((entry) => normalizeOpportunityTitleKey(entry.courseName))
)

const MEANINGFUL_OPPORTUNITY_STATUSES = new Set([
  'Need provider',
  'Provider found',
  'Applied to provider',
  'Approved affiliate',
  'Rejected provider',
  'Need better provider',
  'Ready to add',
  'Published',
  'Later',
  'Not suitable',
])

export type ActivateWorkInEducationCardsSummary = {
  updated: number
  skipped: number
  alreadyActive: number
}

export type ActivateWorkInEducationCardsPlan = {
  toUpdate: CourseOpportunity[]
  alreadyActive: CourseOpportunity[]
  skipped: CourseOpportunity[]
  summary: ActivateWorkInEducationCardsSummary
}

export function formatActivateEducationCardsMessage(summary: ActivateWorkInEducationCardsSummary): string {
  return `Recommendation cards activated: ${summary.updated} updated, ${summary.skipped} skipped, ${summary.alreadyActive} already active.`
}

export function isWorkInEducationBankOpportunity(opp: CourseOpportunity): boolean {
  const hasEducationGoal = (opp.goals ?? []).some((g) => g.goalKey === WORK_IN_EDUCATION_GOAL_KEY)
  if (!hasEducationGoal) return false

  if ((opp.notes ?? '').includes(WORK_IN_EDUCATION_BANK_SEED_NOTES)) return true

  const titleKey = normalizeOpportunityTitleKey(opp.courseName)
  if (BANK_TITLE_KEYS.has(titleKey)) return true

  return (opp.educationFields?.length ?? 0) > 0 && (opp.specialisations?.length ?? 0) > 0
}

export function isEligibleForEducationCardActivation(opp: CourseOpportunity): boolean {
  if (!isWorkInEducationBankOpportunity(opp)) return false
  if (!opp.canBeCourseCard) return false
  if (opp.publishedCourseId) return false
  if ((opp.publishStatus ?? '').trim().toLowerCase() === 'published') return false
  return true
}

export function isAlreadyActiveRecommendationCard(opp: CourseOpportunity): boolean {
  return normalizeVisibilityStatus(opp.visibilityStatus) === 'recommendation_only'
}

export function resolveCommercialStatusForActivation(opp: CourseOpportunity): string {
  const { referralUrl, officialUrl } = resolveOpportunityUrls(opp)
  if (referralUrl) return 'affiliate_ready'
  if (officialUrl) return 'official_link'
  return 'no_link'
}

export function resolveOpportunityStatusForActivation(opp: CourseOpportunity): string {
  const current = (opp.opportunityStatus ?? '').trim()
  if (current && MEANINGFUL_OPPORTUNITY_STATUSES.has(current)) return current
  return 'Need provider'
}

export function applyWorkInEducationCardActivation(opp: CourseOpportunity): CourseOpportunity {
  const now = new Date().toISOString()
  const providers = opp.providers.map((provider) => {
    const status = (provider.providerStatus ?? '').trim()
    if (status && status !== 'Unknown') return provider
    return {
      ...provider,
      providerStatus: 'Need check',
      updatedAt: now,
    }
  })

  return {
    ...opp,
    visibilityStatus: 'recommendation_only',
    commercialStatus: resolveCommercialStatusForActivation(opp),
    recommendationType: 'course_type',
    canBeCourseCard: true,
    opportunityStatus: resolveOpportunityStatusForActivation(opp),
    providers,
    updatedAt: now,
  }
}

export function planActivateWorkInEducationCards(
  opportunities: CourseOpportunity[]
): ActivateWorkInEducationCardsPlan {
  const toUpdate: CourseOpportunity[] = []
  const alreadyActive: CourseOpportunity[] = []
  const skipped: CourseOpportunity[] = []

  for (const opp of opportunities) {
    if (!isEligibleForEducationCardActivation(opp)) {
      skipped.push(opp)
      continue
    }

    if (isAlreadyActiveRecommendationCard(opp)) {
      alreadyActive.push(opp)
      continue
    }

    toUpdate.push(opp)
  }

  return {
    toUpdate,
    alreadyActive,
    skipped,
    summary: {
      updated: toUpdate.length,
      skipped: skipped.length,
      alreadyActive: alreadyActive.length,
    },
  }
}

export function activateWorkInEducationCards(
  opportunities: CourseOpportunity[]
): { opportunities: CourseOpportunity[]; summary: ActivateWorkInEducationCardsSummary; message: string } {
  const plan = planActivateWorkInEducationCards(opportunities)
  const updateIds = new Set(plan.toUpdate.map((o) => o.id))

  const next = opportunities.map((opp) => {
    if (!updateIds.has(opp.id)) return opp
    return applyWorkInEducationCardActivation(opp)
  })

  const summary: ActivateWorkInEducationCardsSummary = {
    updated: plan.toUpdate.length,
    skipped: plan.skipped.length,
    alreadyActive: plan.alreadyActive.length,
  }

  return {
    opportunities: next,
    summary,
    message: formatActivateEducationCardsMessage(summary),
  }
}

export type WorkInEducationCardActivationRow = {
  visibility_status: 'recommendation_only'
  commercial_status: string
  recommendation_type: 'course_type'
  can_be_course_card: true
  opportunity_status: string
  updated_at: string
}

export function buildWorkInEducationCardActivationRow(
  opp: CourseOpportunity
): WorkInEducationCardActivationRow {
  return {
    visibility_status: 'recommendation_only',
    commercial_status: resolveCommercialStatusForActivation(opp),
    recommendation_type: 'course_type',
    can_be_course_card: true,
    opportunity_status: resolveOpportunityStatusForActivation(opp),
    updated_at: new Date().toISOString(),
  }
}
