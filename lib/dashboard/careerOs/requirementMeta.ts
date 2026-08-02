import type { RouteRequirement } from './types'

const IMPACT_BY_KEYWORD: [RegExp, string][] = [
  [/care certificate|nvq/i, 'Required by many care employers'],
  [/moving|handling/i, 'Essential for safe care work'],
  [/first aid/i, 'Valued across healthcare and care roles'],
  [/sia|security/i, 'Legal requirement for licensed security work'],
  [/cscs|construction/i, 'Required on most UK construction sites'],
  [/food hygiene/i, 'Required for food handling roles'],
  [/forklift/i, 'Unlocks higher-paid warehouse roles'],
  [/dbs/i, 'Required for roles working with vulnerable people'],
]

function inferImpact(name: string, type: RouteRequirement['type']): string {
  for (const [pattern, impact] of IMPACT_BY_KEYWORD) {
    if (pattern.test(name)) return impact
  }
  if (type === 'licence') return 'Licence required before you can work in this role'
  if (type === 'certification') return 'Certification improves employability on your route'
  return 'Builds skills employers expect for this route'
}

function inferCost(name: string, type: RouteRequirement['type']): string {
  if (/care certificate|food hygiene|first aid/i.test(name)) return 'Free – £50'
  if (/sia/i.test(name)) return '£150 – £250'
  if (/cscs/i.test(name)) return '£36 – £120'
  if (/forklift/i.test(name)) return '£200 – £400'
  if (type === 'licence') return 'Varies — check provider'
  return 'Free – £200'
}

export function enrichRequirement(
  name: string,
  type: RouteRequirement['type'],
  index: number,
  base: Omit<RouteRequirement, 'required' | 'estimatedCost' | 'expectedImpact'>
): RouteRequirement {
  return {
    ...base,
    name,
    type,
    required: index < 2 || type === 'licence',
    estimatedCost: inferCost(name, type),
    expectedImpact: inferImpact(name, type),
  }
}
