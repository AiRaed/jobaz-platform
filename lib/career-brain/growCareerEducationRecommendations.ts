/**
 * Education-sector grow-career recommendations — multiple realistic UK school roles.
 */

import {
  buildBuildNextWhy,
  buildWorkNowWhy,
} from './growCareerEvidenceReasoning'
import type { DynamicProgression } from './growCareerGrowthAdvisor'
import { domainForGrowField } from './growCareerGrowthAdvisor'
import {
  buildEducationProgressionRoutes,
  buildLongTermLeadershipDisclaimer,
} from './growCareerEducationProgressionRoutes'
import { dedupeRoleTitles } from './jaz/jazRecommendationDedup'
import type { CareerBrainRecommendation, CareerBrainState } from './types'

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function str(state: CareerBrainState, key: string): string {
  return String(answers(state)[key] ?? '').trim()
}

function arr(state: CareerBrainState, key: string): string[] {
  const raw = answers(state)[key]
  if (Array.isArray(raw)) return raw.map(String)
  return raw ? [String(raw)] : []
}

function rec(
  title: string,
  why: string,
  track: CareerBrainRecommendation['track'],
  domain: ReturnType<typeof domainForGrowField>
): CareerBrainRecommendation {
  return {
    title,
    why,
    track,
    field_tag: domain,
    domain,
    source: 'fallback',
    stepType: 'career_step',
  }
}

export function buildEducationGrowRecommendations(
  state: CareerBrainState,
  progression: DynamicProgression
): {
  workNow: CareerBrainRecommendation[]
  buildNext: CareerBrainRecommendation[]
  longTerm: CareerBrainRecommendation[]
} {
  const domain = domainForGrowField('education')
  const responsibilities = arr(state, 'jaz_edu_responsibilities')
  const hasSen = responsibilities.some((r) => /sen|1to1|behaviour|ehcp/i.test(r))

  const currentRole = progression.workNowTitle.trim()
  const relatedRole = hasSen ? 'SEN Support Assistant' : 'Learning Support Assistant'
  const alternativeRole = hasSen ? 'Learning Support Assistant' : 'Classroom Support Worker'
  const fourthRole = hasSen ? 'Classroom Support Worker' : 'SEN Support Assistant'

  const uniqueWorkNow = dedupeRoleTitles([currentRole, relatedRole, alternativeRole, fourthRole]).slice(0, 4)

  const routes = buildEducationProgressionRoutes(state, progression)
  const primaryRoute = routes[0]
  const buildNextTitles = dedupeRoleTitles([
    progression.buildNextTitle,
    routes[1]?.steps[1] ?? 'HLTA route',
    routes[2]?.steps[1] ?? 'SEN / inclusion support route',
  ]).slice(0, 3)

  const longTermDisclaimer = buildLongTermLeadershipDisclaimer(state)

  return {
    workNow: uniqueWorkNow.map((title, i) => {
      const roleTypes = ['Current role', 'Closely related role', 'Alternative realistic role', 'Adjacent school role']
      return rec(
        title,
        buildWorkNowWhy(state, 'education', title, roleTypes[i] ?? 'Related role'),
        'work_now',
        domain
      )
    }),
    buildNext: buildNextTitles.map((title, i) =>
      rec(
        title,
        i === 0
          ? buildBuildNextWhy(state, 'education', { ...progression, buildNextTitle: title })
          : `Alternative realistic next step inside UK education — ${routes[i]?.summary ?? 'supports your stated goal'}. Confidence: ${routes[i]?.confidence ?? 'Moderate'}.`,
        'build_next',
        domain
      )
    ),
    longTerm: routes.slice(0, 3).map((route) =>
      rec(
        `${route.label}: ${route.steps.join(' → ')}`,
        `${route.summary} Confidence: ${route.confidence} (~${route.confidencePercent}%). ${longTermDisclaimer}`,
        'long_term',
        domain
      )
    ),
  }
}
