/**
 * Education progression routes — 2–3 realistic UK school pathways with confidence.
 */

import type { DynamicProgression } from './growCareerGrowthAdvisor'
import type { CareerBrainState } from './types'

export type ProgressionRouteConfidence = 'High' | 'Medium' | 'Lower'

export type EducationProgressionRoute = {
  id: string
  label: string
  steps: string[]
  confidence: ProgressionRouteConfidence
  confidencePercent: number
  summary: string
}

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

export function buildEducationQualificationRecommendation(state: CareerBrainState): {
  qualification: string
  reason: string
} | null {
  const qual = str(state, 'jaz_edu_qualification')
  const blockers = arr(state, 'jaz_blockers').concat(arr(state, 'cb_grow_blocker'))
  const missingQual =
    qual === 'none' ||
    blockers.some((b) => /qualification/i.test(b)) ||
    str(state, 'cb_grow_blocker').includes('qualification')

  if (!missingQual) return null

  if (qual === 'none' || qual === '') {
    return {
      qualification: 'Level 3 Teaching Assistant',
      reason:
        'Required for realistic progression to HLTA and leadership-track education roles. Without this, schools rarely consider you for HLTA or pastoral/SEN lead steps.',
    }
  }
  if (qual === 'level3_ta') {
    return {
      qualification: 'HLTA status',
      reason:
        'The recognised next qualification after Level 3 TA when you want greater classroom responsibility before teacher training or pastoral leadership.',
    }
  }
  return null
}

export function buildEducationProgressionRoutes(
  state: CareerBrainState,
  progression: DynamicProgression
): EducationProgressionRoute[] {
  const workNow = progression.workNowTitle
  const responsibilities = arr(state, 'jaz_edu_responsibilities')
  const goal = str(state, 'jaz_edu_progression')
  const qual = str(state, 'jaz_edu_qualification')
  const hasSen = responsibilities.some((r) => /sen|1to1|ehcp/i.test(r))
  const hasBehaviour = responsibilities.some((r) => /behaviour/i.test(r))
  const leadershipGoal = goal === 'leadership'

  const routeA: EducationProgressionRoute = {
    id: 'route_a_qualification',
    label: 'Route A — Qualification ladder',
    steps: [workNow, 'Level 3 Teaching Assistant', 'HLTA', hasSen ? 'Assistant SENCO' : 'Senior TA / Subject support lead'],
    confidence: qual === 'none' ? 'High' : 'Medium',
    confidencePercent: qual === 'none' ? 78 : 62,
    summary:
      'A likely progression route if you close the qualification gap first — the most common UK school pathway from TA to HLTA.',
  }

  const routeB: EducationProgressionRoute = {
    id: 'route_b_pastoral',
    label: 'Route B — Pastoral / behaviour',
    steps: [workNow, hasBehaviour ? 'Behaviour Support Assistant' : 'Behaviour / pastoral support role', 'Pastoral Lead'],
    confidence: hasBehaviour || leadershipGoal ? 'Medium' : 'Lower',
    confidencePercent: hasBehaviour ? 68 : leadershipGoal ? 55 : 42,
    summary:
      'Based on current evidence, a pastoral route is possible if you build behaviour support experience and supervisor references — usually alongside formal TA qualifications.',
  }

  const routeC: EducationProgressionRoute = {
    id: 'route_c_inclusion',
    label: 'Route C — SEN / inclusion',
    steps: [workNow, hasSen ? 'SEN Support Assistant' : 'SEN / inclusion support', 'Inclusion Lead'],
    confidence: hasSen ? 'High' : 'Medium',
    confidencePercent: hasSen ? 72 : 58,
    summary:
      'A likely progression route where your 1:1 or SEN classroom work can translate into inclusion leadership — still usually requires Level 3 TA or HLTA for senior steps.',
  }

  const routes = [routeA, routeB, routeC]
  return routes.sort((a, b) => b.confidencePercent - a.confidencePercent)
}

export function buildLongTermLeadershipDisclaimer(state: CareerBrainState): string {
  const qual = str(state, 'jaz_edu_qualification')
  const goal = str(state, 'jaz_edu_progression')

  if (goal !== 'leadership') {
    return 'Possible long-term progression if qualifications and experience are gained over several years.'
  }

  return [
    'Possible long-term progression toward school leadership if qualifications and experience are gained — this is not guaranteed.',
    'School leadership typically requires:',
    '• Recognised teaching or HLTA-related qualifications',
    '• Leadership evidence (pastoral, SEN, or curriculum responsibility)',
    '• Several years of sustained progression in UK schools',
    qual === 'none' ? '• Level 3 TA and HLTA steps before senior leadership is realistic' : '',
  ]
    .filter(Boolean)
    .join('\n')
}
