import type { AdminAiPriority } from './types'

/** Shared priority language for all Admin AI surfaces */
export const ADMIN_AI_PRIORITY_GUIDE = {
  High: 'launch blocker, revenue blocker, safety/trust risk, or current user-flow problem',
  Medium: 'important improvement or missing useful data',
  Low: 'monitoring, old/test data, or future improvement',
} as const

export const NOT_WIRED_YET_MEANING =
  'Not wired yet — monitoring/check is missing, not necessarily a failure.'

/**
 * Default Affiliate Scout route priorities.
 * Demand/click data may raise priority later; do not mark every gap High.
 */
export function getAffiliateRouteDefaultPriority(route: string): AdminAiPriority {
  const r = route.toLowerCase()
  if (/cscs|construction/.test(r)) return 'High'
  if (/first aid|food safety/.test(r)) return 'High'
  if (/forklift|warehouse/.test(r)) return 'High'
  if (/tefl|teaching assistant/.test(r)) return 'Medium'
  if (/comp.?tia|digital|it\s*\//.test(r) || r.includes('digital skills')) return 'Medium'
  if (/aat|bookkeep/.test(r)) return 'Medium'
  // SIA / Care → verify existing partners (Get Licensed, UKPDA) by default
  if (/sia|security/.test(r)) return 'Low'
  if (/care|health/.test(r)) return 'Low'
  return 'Medium'
}
