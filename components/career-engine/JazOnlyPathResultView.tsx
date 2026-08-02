'use client'

import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import type { JazAnalyseResult } from '@/lib/jaz-career-engine/types'
import type { JazPlanSource } from '@/lib/jaz-career-engine/attachJazToCareerResult'
import JazPreferringPlanHandoff from '@/components/career-engine/JazPreferringPlanHandoff'

export type JazOnlyPathResult = {
  pathId: string
  phase?: string
  answers?: Record<string, string>
  jaz_analyse?: JazAnalyseResult | null
  jaz_jobaz_plan?: JobAZPlan | null
  plan_source?: JazPlanSource
}

type Props = {
  result: JazOnlyPathResult
  isGuest?: boolean
  goalPath: string
}

/** Grow Career / Start Business — JAZ-only structured handoff. */
export default function JazOnlyPathResultView({ result, isGuest, goalPath }: Props) {
  return (
    <JazPreferringPlanHandoff
      goalPath={goalPath}
      jazPlan={result.jaz_jobaz_plan}
      jazAnalyse={result.jaz_analyse}
      planSource={result.plan_source}
      legacyPlan={null}
      isGuest={isGuest}
      coachNotes={result.jaz_analyse?.why_this_route_fits}
    />
  )
}
