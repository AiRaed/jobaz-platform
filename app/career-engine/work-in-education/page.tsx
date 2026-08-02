'use client'

import CareerEnginePathPage from '@/components/career-engine/conversation/CareerEnginePathPage'
import EducationPathResultView from '@/components/career-engine/education-path/EducationPathResult'
import type { EducationPathAnswers, EducationPathResult } from '@/lib/career-engine/education-path/types'
import { buildEducationPathResult } from '@/lib/career-engine/education-path/decisionEngine'
import { getSeedKnowledge } from '@/lib/career-engine/education-path/knowledge/seed'

async function buildEducationResult(answers: Record<string, string>): Promise<EducationPathResult> {
  const typed = answers as EducationPathAnswers

  try {
    const res = await fetch('/api/career-engine/education-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(typed),
    })

    if (res.ok) {
      const body = (await res.json()) as {
        result: EducationPathResult
        structuredRecommendations?: EducationPathResult['structuredRecommendations']
      }
      return {
        ...body.result,
        structuredRecommendations: body.structuredRecommendations ?? body.result.structuredRecommendations,
      }
    }
  } catch {
    // fallback below
  }

  return buildEducationPathResult(typed, getSeedKnowledge(typed.education_field))
}

export default function WorkInEducationPage() {
  return (
    <CareerEnginePathPage
      goalId="work_in_education"
      buildStructuredResult={buildEducationResult}
      renderStructuredResult={(result, isGuest) => (
        <EducationPathResultView result={result as EducationPathResult} isGuest={isGuest} />
      )}
    />
  )
}
