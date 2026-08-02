/**
 * Paths that are weak matches given current profile — "Not Recommended Yet".
 * Must never contradict roles already recommended on the page.
 */

import { inferCareerTrackFamily } from './careerTrackAlignment'
import { rolesOverlap, normalizeRoleLabel } from './resultPolish'
import { getCertOpenness } from './speedDevelopmentMode'
import { resolveWorkStyle } from './workStylePreferences'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile, NotRecommendedPath } from './types'

const CANDIDATE_WEAK: Array<{
  title: string
  test: (p: CareerProfile, s?: CareerBrainState) => string | null
}> = [
  {
    title: 'Office Admin',
    test: (p) =>
      p.englishLevel === 'basic'
        ? 'Basic English — build workplace English before front-office roles'
        : null,
  },
  {
    title: 'Customer Service',
    test: (p) => (p.constraints.includes('no-customer-facing') ? 'You prefer minimal customer contact' : null),
  },
  {
    title: 'Receptionist',
    test: (p) => {
      if (p.constraints.includes('no-customer-facing')) return 'You prefer minimal customer contact'
      if (p.englishLevel === 'basic') return 'Basic English — reception roles need stronger communication'
      return null
    },
  },
  {
    title: 'Heavy Physical Work',
    test: (p, s) => {
      const style = resolveWorkStyle(p, s)
      if (p.constraints.includes('non-physical') || style === 'office') {
        return 'You prefer office-based or non-physical work'
      }
      return null
    },
  },
  {
    title: 'Delivery Driver',
    test: (p, s) =>
      !p.licences.some((l) => /driving/i.test(l)) && s?.answers?.cb_uk_driving_licence !== 'yes'
        ? 'No UK driving licence'
        : String(s?.answers?.cb_has_car) === 'no' &&
            p.licences.some((l) => /driving/i.test(l))
          ? 'No car access for delivery work'
          : null,
  },
  {
    title: 'Skilled Trades',
    test: (p, s) => {
      const cert = getCertOpenness(s)
      if (cert === 'direct_only') {
        return 'You prefer not to take training courses right now'
      }
      return null
    },
  },
  {
    title: 'Forklift / HGV progression',
    test: (p, s) => {
      const cert = getCertOpenness(s)
      if (cert === 'direct_only') {
        return 'You prefer not to take training courses right now'
      }
      if (p.constraints.includes('non-physical') || resolveWorkStyle(p, s) === 'office') {
        return 'You prefer office-based or non-physical work'
      }
      return null
    },
  },
  {
    title: 'Security (SIA)',
    test: (p, s) => {
      const cert = getCertOpenness(s)
      if (cert === 'direct_only') {
        return 'You prefer not to take training courses right now'
      }
      return null
    },
  },
]

function contradictsRecommendedPath(
  candidateTitle: string,
  recommendedTitles: string[],
  profile: CareerProfile,
  state?: CareerBrainState,
  workNowRecs?: CareerBrainRecommendation[]
): boolean {
  for (const rec of recommendedTitles) {
    if (rolesOverlap(candidateTitle, rec)) return true
  }

  if (!workNowRecs?.length) return false
  const family = inferCareerTrackFamily(workNowRecs, profile, state)

  if (/office admin|reception|data entry|admin assistant/i.test(candidateTitle)) {
    if (family === 'office_admin') return true
    if (profile.constraints.includes('non-physical') || resolveWorkStyle(profile, state) === 'office') {
      return true
    }
  }
  if (/heavy physical|warehouse|forklift|hgv/i.test(candidateTitle) && family === 'office_admin') {
    return recommendedTitles.some((t) => /admin|data entry|office|reception|dispatch/i.test(t))
  }
  if (/customer service|receptionist/i.test(candidateTitle) && family === 'office_admin') {
    return recommendedTitles.some((t) => /admin|data entry|office|dispatch/i.test(t))
  }

  return false
}

export function buildNotRecommendedPaths(
  profile: CareerProfile,
  state?: CareerBrainState,
  recommendedTitles: string[] = [],
  workNowRecs?: CareerBrainRecommendation[]
): NotRecommendedPath[] {
  const out: NotRecommendedPath[] = []
  const seen = new Set<string>()

  for (const c of CANDIDATE_WEAK) {
    const reason = c.test(profile, state)
    if (!reason) continue
    if (contradictsRecommendedPath(c.title, recommendedTitles, profile, state, workNowRecs)) {
      continue
    }
    const key = normalizeRoleLabel(c.title)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ title: c.title, reason })
  }
  return out.slice(0, 6)
}
