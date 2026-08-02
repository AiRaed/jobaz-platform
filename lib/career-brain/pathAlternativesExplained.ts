/**
 * "Why other paths were not selected" — only meaningful alternatives, not generic weak matches.
 */

import { BROAD_FIELD_REGISTRY, getActiveBroadFieldKey, getSpecialisationValue, specialisationStudyLabel } from './fieldSpecialisation'
import { getCommittedCareerPathLabel, hasCommittedCareerPath } from './pathContext'
import { studyFieldLabel } from './firstJobEducationPath'
import type { CareerBrainState, CareerProfile, NotRecommendedPath } from './types'

const CROSS_FIELD_ALTERNATIVES: Array<{
  title: string
  broadKeys: string[]
  reason: (committed: string) => string
}> = [
  {
    title: 'Nursing pathway',
    broadKeys: ['engineering', 'it_computing', 'business'],
    reason: (c) => `Not selected because your educational field is ${c}.`,
  },
  {
    title: 'Retail & customer service pathway',
    broadKeys: ['engineering', 'it_computing', 'healthcare', 'law'],
    reason: (c) => `Not selected because you chose to work in ${c}.`,
  },
  {
    title: 'Driving & logistics pathway',
    broadKeys: ['engineering', 'it_computing', 'healthcare', 'law', 'education'],
    reason: (c) => `Not selected because your focus is ${c}, not transport or warehouse work.`,
  },
  {
    title: 'Security (SIA) pathway',
    broadKeys: ['engineering', 'it_computing', 'healthcare', 'law', 'education'],
    reason: (c) => `Not selected — unrelated to your ${c} direction.`,
  },
]

function engineeringSiblingAlternatives(state: CareerBrainState): NotRecommendedPath[] {
  const spec = getSpecialisationValue(state)
  const selectedLabel = specialisationStudyLabel(state)
  if (!spec || !selectedLabel) return []

  const config = BROAD_FIELD_REGISTRY.find((c) => c.key === 'engineering')
  if (!config) return []

  return config.options
    .filter((o) => o.value !== spec && o.value !== 'other')
    .slice(0, 4)
    .map((o) => ({
      title: o.label,
      reason: `Not selected because your engineering specialisation is ${selectedLabel}.`,
    }))
}

export function buildWhyOtherPathsNotSelected(
  profile: CareerProfile,
  state?: CareerBrainState
): NotRecommendedPath[] {
  if (!state || !hasCommittedCareerPath(profile, state)) return []

  const committed = getCommittedCareerPathLabel(profile, state)
  if (!committed) return []

  const out: NotRecommendedPath[] = []
  const seen = new Set<string>()

  const broadKey = getActiveBroadFieldKey(state)
  if (broadKey === 'engineering') {
    for (const alt of engineeringSiblingAlternatives(state)) {
      const key = alt.title.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(alt)
    }
  }

  for (const cross of CROSS_FIELD_ALTERNATIVES) {
    if (!broadKey || !cross.broadKeys.includes(broadKey)) continue
    const key = cross.title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ title: cross.title, reason: cross.reason(committed) })
  }

  const fjSlug = String(state.answers?.cb_first_job_study_field ?? '').trim()
  if (fjSlug && broadKey && fjSlug !== broadKey) {
    const key = `other study area`
    if (!seen.has(key)) {
      seen.add(key)
      out.push({
        title: `${studyFieldLabel(fjSlug)} (general)`,
        reason: `Not selected because you specified ${committed}.`,
      })
    }
  }

  return out.slice(0, 6)
}

/** @deprecated use buildWhyOtherPathsNotSelected */
export function buildNotRecommendedPaths(
  profile: CareerProfile,
  state?: CareerBrainState
): NotRecommendedPath[] {
  return buildWhyOtherPathsNotSelected(profile, state)
}
