'use client'

import type { ExtraIncomePlanResult } from '@/lib/career-engine/extra-income/types'
import { mapCareerCoachResultToPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import JazPreferringPlanHandoff from '@/components/career-engine/JazPreferringPlanHandoff'

type Props = {
  result: ExtraIncomePlanResult
  isGuest?: boolean
}

/**
 * Extra Income final screen — prefers JAZ Career Engine plan.
 */
export default function ExtraIncomeResultView({ result, isGuest }: Props) {
  const legacyPlan = mapCareerCoachResultToPlan(result)

  return (
    <JazPreferringPlanHandoff
      goalPath="side_job"
      jazPlan={result.jaz_jobaz_plan}
      jazAnalyse={result.jaz_analyse}
      planSource={result.plan_source}
      legacyPlan={legacyPlan}
      isGuest={isGuest}
      coachNotes={
        result.jaz_analyse?.why_this_route_fits ||
        result.supportiveMessage ||
        result.fastestPath?.lines?.join(' · ')
      }
    />
  )
}
