'use client'

import { useEffect } from 'react'
import CareerCoachPlanHandoff from '@/components/career-engine/CareerCoachPlanHandoff'
import JazPlanSourceBadge from '@/components/career-engine/JazPlanSourceBadge'
import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import type { JazAnalyseResult } from '@/lib/jaz-career-engine/types'
import type { JazPlanSource } from '@/lib/jaz-career-engine/attachJazToCareerResult'
import { preferJazOrLegacyPlan } from '@/lib/jaz-career-engine/preferJazPlan'
import { trackJazEvent } from '@/lib/analytics/jazTrackEvent'

type Props = {
  goalPath: string
  jazPlan?: JobAZPlan | null
  jazAnalyse?: JazAnalyseResult | null
  planSource?: JazPlanSource | null
  legacyPlan: JobAZPlan | null
  isGuest?: boolean
  coachNotes?: string | null
}

/**
 * Shared handoff: always prefer JAZ / jaz_fallback over legacy.
 */
export default function JazPreferringPlanHandoff({
  goalPath,
  jazPlan,
  jazAnalyse,
  planSource,
  legacyPlan,
  isGuest,
  coachNotes,
}: Props) {
  const preferred = preferJazOrLegacyPlan({
    goalPath,
    jazPlan,
    jazAnalyse,
    planSource,
    legacyPlan,
  })

  useEffect(() => {
    void trackJazEvent({
      event_type: 'career_assistant_started',
      event_source: 'jaz_preferring_handoff',
      goal_path: goalPath,
      route_title: preferred.plan?.route_summary.route_title || null,
      tool_name: 'career_assistant',
      metadata: {
        plan_source: preferred.plan_source,
        ai_provider: preferred.ai_provider,
        has_plan: Boolean(preferred.plan),
      },
    })
    // Once per goal path mount — avoid re-firing on object identity churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalPath])

  if (!preferred.plan) {
    return (
      <p className="text-sm text-slate-400">
        We could not build a short plan preview. Open My Plan after saving your assessment.
      </p>
    )
  }

  const notes =
    coachNotes ||
    jazAnalyse?.why_this_route_fits ||
    preferred.plan.route_summary.one_sentence_summary

  return (
    <div className="space-y-2">
      <JazPlanSourceBadge
        plan_source={preferred.plan_source}
        goal_path={goalPath}
        ai_provider={preferred.ai_provider}
        engine_version={preferred.engine_version}
        matched_count={preferred.matched_count}
      />
      <CareerCoachPlanHandoff plan={preferred.plan} isGuest={isGuest} coachNotes={notes} />
    </div>
  )
}
