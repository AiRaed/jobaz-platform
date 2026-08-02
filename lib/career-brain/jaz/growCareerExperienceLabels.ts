/**
 * Dynamic experience descriptors — never label <1 year as "experienced".
 */

import { resolveGrowCareerCurrentJobTitle } from '../growCareerPath'
import type { CareerBrainState } from '../types'

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function yearsBand(state: CareerBrainState): string {
  return String(answers(state).jaz_years ?? answers(state).cb_grow_years ?? '').trim()
}

export function describeExperienceBandLabel(years: string): string {
  const bands: Record<string, string> = {
    '0_1': 'Early-career',
    '1_3': 'Developing',
    '3_5': 'Experienced',
    '5_10': 'Experienced',
    '10_plus': 'Senior',
    '1_2': 'Developing',
    '6_10': 'Experienced',
  }
  return bands[years] ?? 'Developing'
}

export function describeExperienceRole(state: CareerBrainState): string {
  const jobTitle = resolveGrowCareerCurrentJobTitle(state)
  const band = describeExperienceBandLabel(yearsBand(state))
  return `${band} ${jobTitle}`
}

export function describeExperienceRoleLower(state: CareerBrainState): string {
  return describeExperienceRole(state).toLowerCase()
}
