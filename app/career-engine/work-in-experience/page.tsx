'use client'

import CareerEnginePathPage from '@/components/career-engine/conversation/CareerEnginePathPage'
import CareerEnginePlanResultView from '@/components/career-engine/education-path/EducationPathResult'
import type { ExperiencePathAnswers } from '@/lib/career-engine/experience-path/types'
import type { CareerEnginePlanResult } from '@/lib/career-engine/shared/planTypes'
import { buildExperiencePathResult } from '@/lib/career-engine/experience-path/decisionEngine'

async function buildExperienceResult(
  answers: Record<string, string>
): Promise<CareerEnginePlanResult> {
  const typed = answers as ExperiencePathAnswers

  try {
    const res = await fetch('/api/career-engine/experience-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(typed),
    })

    if (res.ok) {
      const body = (await res.json()) as {
        result: CareerEnginePlanResult
        structuredRecommendations?: CareerEnginePlanResult['structuredRecommendations']
      }
      return {
        ...body.result,
        structuredRecommendations:
          body.structuredRecommendations ?? body.result.structuredRecommendations,
      }
    }
  } catch {
    // fallback below
  }

  return buildExperiencePathResult(typed)
}

export default function WorkInExperiencePage() {
  return (
    <CareerEnginePathPage
      goalId="work_in_experience"
      buildStructuredResult={buildExperienceResult}
      renderStructuredResult={(result, isGuest) => (
        <CareerEnginePlanResultView result={result as CareerEnginePlanResult} isGuest={isGuest} />
      )}
    />
  )
}
