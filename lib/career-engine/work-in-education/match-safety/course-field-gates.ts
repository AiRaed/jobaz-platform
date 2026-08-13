/**
 * Cross-field course gates for Work in My Education.
 * Blocks care/support/MH courses from non-care education routes.
 */

import {
  HSS_CARE_SUPPORT_COURSE_RE,
  isCareSupportDirection,
  shouldDeprioritiseCareCourseForHss,
} from './humanities-polish'

/** Fields where care / safeguarding / counselling courses are legitimate. */
const CARE_EDU_HEALTH_ROUTE_RE =
  /psycholog|counsell|mental\s*health|social\s*care|support\s*worker|community\s*care|youth\s*work|care\s*&?\s*support|healthcare|health\s*care|\bnurs|midwif|paramedic|allied\s*health|education|teaching|educator|early\s*year|\bsen\b|childcare|public\s*health/i

/**
 * True when a care/MH/safeguarding-style course should not appear as a primary
 * recommendation for this education route.
 */
export function shouldDeprioritiseCareCourseForRoute(
  title: string,
  fieldName?: string | null,
  specialismName?: string | null,
  fieldSlug?: string | null
): boolean {
  // Keep existing HSS-specific gate (also covers Anthropology etc.)
  if (shouldDeprioritiseCareCourseForHss(title, fieldName, specialismName, fieldSlug)) {
    return true
  }

  const hay = `${fieldName ?? ''} ${fieldSlug ?? ''} ${specialismName ?? ''}`
  if (isCareSupportDirection(fieldName, specialismName)) return false
  if (CARE_EDU_HEALTH_ROUTE_RE.test(hay)) return false
  return HSS_CARE_SUPPORT_COURSE_RE.test(title)
}
