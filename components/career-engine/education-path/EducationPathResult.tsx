'use client'

import type { CareerEnginePlanResult } from '@/lib/career-engine/shared/planTypes'
import { mapCareerCoachResultToPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import JazPreferringPlanHandoff from '@/components/career-engine/JazPreferringPlanHandoff'

type Props = {
  result: CareerEnginePlanResult & {
    jaz_analyse?: import('@/lib/jaz-career-engine/types').JazAnalyseResult | null
    jaz_jobaz_plan?: import('@/lib/dashboard/careerOs/mapCareerCoachResultToPlan').JobAZPlan | null
    plan_source?: 'jaz' | 'jaz_fallback' | 'legacy'
  }
  isGuest?: boolean
}

/**
 * Education / Experience final screen — prefers JAZ Career Engine plan.
 */
export default function EducationPathResultView({ result, isGuest }: Props) {
  const legacyPlan = mapCareerCoachResultToPlan(result)

  return (
    <JazPreferringPlanHandoff
      goalPath={result.pathId}
      jazPlan={result.jaz_jobaz_plan}
      jazAnalyse={result.jaz_analyse}
      planSource={result.plan_source}
      legacyPlan={legacyPlan}
      isGuest={isGuest}
      coachNotes={result.goal || result.careerReadiness?.summary}
    />
  )
}
