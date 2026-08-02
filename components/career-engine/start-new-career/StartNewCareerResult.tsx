'use client'

import type { StartNewCareerPlanResult } from '@/lib/career-engine/start-new-career/types'
import { mapCareerCoachResultToPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import JazPreferringPlanHandoff from '@/components/career-engine/JazPreferringPlanHandoff'

type Props = {
  result: StartNewCareerPlanResult & {
    jaz_analyse?: import('@/lib/jaz-career-engine/types').JazAnalyseResult | null
    jaz_jobaz_plan?: import('@/lib/dashboard/careerOs/mapCareerCoachResultToPlan').JobAZPlan | null
    plan_source?: 'jaz' | 'jaz_fallback' | 'legacy'
  }
  isGuest?: boolean
}

/**
 * Start New Career final screen — prefers JAZ Career Engine plan.
 */
export default function StartNewCareerResultView({ result, isGuest }: Props) {
  const legacyPlan = mapCareerCoachResultToPlan(result)

  return (
    <JazPreferringPlanHandoff
      goalPath="start_new_career"
      jazPlan={result.jaz_jobaz_plan}
      jazAnalyse={result.jaz_analyse}
      planSource={result.plan_source}
      legacyPlan={legacyPlan}
      isGuest={isGuest}
      coachNotes={result.transition?.summary || result.realityCheckSummary?.targetCareer}
    />
  )
}
