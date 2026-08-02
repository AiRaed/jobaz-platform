import { securityExtraIncomeRoute } from './rules/securityExtraIncome'
import { routeStageStubs } from './rules/stubs'
import type { CareerRouteStageRule } from './types'

/**
 * Canonical registry.
 * Full rules drive CV / plan stage behaviour today.
 * Stubs document future routes without enabling incomplete CV copy.
 */
export const careerRouteStageRules: CareerRouteStageRule[] = [
  securityExtraIncomeRoute,
  ...routeStageStubs,
]

export const fullCareerRouteStageRules: CareerRouteStageRule[] = careerRouteStageRules.filter(
  (r) => r.implementation === 'full'
)
