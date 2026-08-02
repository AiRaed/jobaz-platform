/**
 * My Plan display filters — route-aware, no Career Coach / resolver changes.
 */

import type { CareerPlanItem } from '@/lib/career-hub/types'
import type { PathPlanLadder, PathPlanStep } from './pathPlanLadder'

const BLOCKED_SECURITY_TITLES =
  /microsoft\s*office|business\s*administration|process\s*mapping|stakeholder\s*communication|freelanc|online\s*tutor|digital\s*product|selling\s*digital|upwork|fiverr|\baat\b|bookkeeping|cipd|\bexcel for business\b/i

const CONSTRUCTION_SKILLS =
  /construction|warehouse|trades?|site\s*work|cscs|forklift|building/i

const HOSPITALITY_SKILLS =
  /hospitality|food|kitchen|catering|bar|chef|restaurant/i

const RETAIL_SKILLS = /retail|sales\s*assistant|shop\s*floor|supermarket|stock\s*assistant/i

const TECH_SKILLS = /\btech\b|it\s*\/?\s*tech|it\s*support|digital|software|computer|helpdesk|tutoring|online\s*tutor/i

const SECURITY_SKILLS = /security|sia|steward|door\s*supervisor|cctv|event\s*security|matchday/i

const ADMIN_SKILLS = /admin|office|reception|writing|customer\s*service/i

export function normalizePlanTitle(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').replace(/\s+/g, ' ')
}

export function titlesMatchLoose(a: string, b: string): boolean {
  const na = normalizePlanTitle(a)
  const nb = normalizePlanTitle(b)
  if (!na || !nb) return false
  if (na === nb) return true
  return na.includes(nb) || nb.includes(na)
}

export function collectSkillHints(
  skillsLabels: string[] = [],
  answers: Record<string, string> = {}
): string {
  const parts = [
    ...skillsLabels,
    answers.side_skills ?? '',
    answers.side_profile ?? '',
  ]
  return parts.join(' ').toLowerCase()
}

export function isSecurityRoute(skillBlob: string, routeLabel?: string): boolean {
  return SECURITY_SKILLS.test(skillBlob) || /security/i.test(routeLabel ?? '')
}

export function isRetailRoute(skillBlob: string, routeLabel?: string): boolean {
  if (isSecurityRoute(skillBlob, routeLabel)) return false
  return RETAIL_SKILLS.test(skillBlob) || /retail/i.test(routeLabel ?? '')
}

export function isTechRoute(skillBlob: string, routeLabel?: string): boolean {
  if (isSecurityRoute(skillBlob, routeLabel)) return false
  return TECH_SKILLS.test(skillBlob) || /it\s*\/?\s*tech|tech\s*extra|digital/i.test(routeLabel ?? '')
}

export function hasConstructionContext(skillBlob: string): boolean {
  return CONSTRUCTION_SKILLS.test(skillBlob)
}

export function hasHospitalityContext(skillBlob: string): boolean {
  return HOSPITALITY_SKILLS.test(skillBlob)
}

export function hasAdminContext(skillBlob: string): boolean {
  return ADMIN_SKILLS.test(skillBlob)
}

export function isBlockedForSecurityRoute(title: string, skillBlob: string): boolean {
  if (!BLOCKED_SECURITY_TITLES.test(title)) return false
  // Allow office-related only when user explicitly selected admin/office skills
  if (/microsoft\s*office|business\s*administration/i.test(title) && hasAdminContext(skillBlob)) {
    return false
  }
  return true
}

export function isCscsTitle(title: string): boolean {
  return /\bcscs\b/i.test(title)
}

export function isFoodHygieneTitle(title: string): boolean {
  return /food\s*hygiene|food\s*safety/i.test(title)
}

export function isFirstAidTitle(title: string): boolean {
  return /first\s*aid/i.test(title)
}

export function isCctvTitle(title: string): boolean {
  return /\bcctv\b|public\s*space\s*surveillance/i.test(title)
}

export function isSiaDoorTitle(title: string): boolean {
  return /sia.*door|door\s*supervisor/i.test(title)
}

/** Whether a qualification title is allowed on Extra Income display for this route. */
export function allowExtraIncomeQualTitle(
  title: string,
  skillBlob: string,
  routeLabel: string
): boolean {
  const security = isSecurityRoute(skillBlob, routeLabel)

  // Affiliate availability must never surface SIA/CCTV on non-security routes
  if ((isSiaDoorTitle(title) || isCctvTitle(title)) && !security) {
    return false
  }

  if (security && isBlockedForSecurityRoute(title, skillBlob)) {
    return false
  }
  if (isCscsTitle(title) && !hasConstructionContext(skillBlob)) return false
  if (isFoodHygieneTitle(title) && !hasHospitalityContext(skillBlob) && !isRetailRoute(skillBlob, routeLabel)) {
    return false
  }
  return true
}

export function classifySecurityAddOn(title: string): 'relevant' | 'other' | 'exclude' {
  if (isFirstAidTitle(title) || isCctvTitle(title)) return 'relevant'
  if (isCscsTitle(title) || isFoodHygieneTitle(title)) return 'other'
  if (BLOCKED_SECURITY_TITLES.test(title)) return 'exclude'
  return 'other'
}

export function splitSecurityAddOns(steps: PathPlanStep[]): {
  relevantAddOns: PathPlanStep[]
  otherRouteAddOns: PathPlanStep[]
} {
  const relevantAddOns: PathPlanStep[] = []
  const otherRouteAddOns: PathPlanStep[] = []
  for (const step of steps) {
    const kind = classifySecurityAddOn(step.title)
    if (kind === 'relevant') relevantAddOns.push(step)
    else if (kind === 'other') otherRouteAddOns.push(step)
  }
  return { relevantAddOns, otherRouteAddOns }
}

/**
 * Saved / roadmap list: user-touched items, or recommended items matching current Coach plan.
 */
export function filterPlanItemsForCurrentRoute(
  items: CareerPlanItem[],
  ladder: PathPlanLadder | null | undefined
): CareerPlanItem[] {
  const allowTitles = [
    ...(ladder?.trainingTitles ?? []),
    ...(ladder?.trainNext.map((s) => s.title) ?? []),
    ...(ladder?.relevantAddOns?.map((s) => s.title) ?? []),
    ...(ladder?.otherRouteAddOns?.map((s) => s.title) ?? []),
    ...(ladder?.optionalAddOns.map((s) => s.title) ?? []),
  ]

  return items.filter((item) => {
    const onSecurity = Boolean(ladder?.isSecurityRoute)

    // Security: never show blocked legacy titles (e.g. AAT) on this route plan
    if (onSecurity && isBlockedForSecurityRoute(item.courseName, '')) {
      return false
    }

    // Legacy recommendations never shown unless on current plan titles
    if (item.status === 'recommended') {
      if (!ladder || allowTitles.length === 0) return false
      return allowTitles.some((t) => titlesMatchLoose(t, item.courseName))
    }

    const userTouched = ['saved', 'interested', 'in_progress', 'completed'].includes(item.status)
    if (!userTouched) return false

    // Prefer route-aligned items when we know the plan titles
    if (onSecurity && allowTitles.length > 0) {
      const matchesRoute = allowTitles.some((t) => titlesMatchLoose(t, item.courseName))
      if (!matchesRoute && item.status === 'interested') return false
      // Keep explicit saved / in_progress / completed only when route-related or clearly current
      if (!matchesRoute && item.status === 'saved') return false
    }

    return true
  })
}

export function filterSavedMarketForRoute(
  items: Array<{ courseTitle: string; id: string; status?: string }>,
  ladder: PathPlanLadder | null | undefined
): typeof items {
  if (!ladder) return items
  const allow = ladder.trainingTitles
  return items.filter((item) => {
    if (ladder.isSecurityRoute && isBlockedForSecurityRoute(item.courseTitle, '')) {
      return false
    }
    if (item.status && item.status !== 'recommended') {
      // Keep user saves that match this route, or any in-progress/completed
      if (allow.length === 0) return true
      return allow.some((t) => titlesMatchLoose(t, item.courseTitle))
    }
    return allow.some((t) => titlesMatchLoose(t, item.courseTitle))
  })
}
