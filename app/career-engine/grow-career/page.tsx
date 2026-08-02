'use client'

import CareerEnginePathPage from '@/components/career-engine/conversation/CareerEnginePathPage'
import JazOnlyPathResultView, {
  type JazOnlyPathResult,
} from '@/components/career-engine/JazOnlyPathResultView'

async function buildGrowCareerResult(answers: Record<string, string>): Promise<JazOnlyPathResult> {
  console.info('[GrowCareer] submitting answers', {
    grow_field: answers.grow_field,
    current_role: answers.current_role,
    grow_goal: answers.grow_goal,
  })

  try {
    const res = await fetch('/api/career-engine/grow-career', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    })
    if (res.ok) {
      const body = (await res.json()) as { result: JazOnlyPathResult }
      return body.result
    }
  } catch {
    // fallback below
  }

  // Client fallback: call analyse directly
  try {
    const res = await fetch('/api/jaz-career/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: 'grow_current_career',
        answers,
        skills: [answers.grow_field, answers.current_role].filter(Boolean),
      }),
    })
    if (res.ok) {
      const analyse = await res.json()
      const { mapJazAnalyseToJobAZPlan } = await import(
        '@/lib/jaz-career-engine/mapJazAnalyseToJobAZPlan'
      )
      return {
        pathId: 'grow_career',
        phase: 'roadmap',
        answers,
        jaz_analyse: analyse,
        jaz_jobaz_plan: mapJazAnalyseToJobAZPlan(analyse, { pathId: 'grow_career' }),
        plan_source: analyse.ai_provider === 'ollama' ? 'jaz' : 'jaz_fallback',
      }
    }
  } catch {
    // ignore
  }

  return { pathId: 'grow_career', answers, plan_source: 'legacy', jaz_jobaz_plan: null, jaz_analyse: null }
}

export default function GrowCareerPage() {
  return (
    <CareerEnginePathPage
      goalId="grow_career"
      buildStructuredResult={buildGrowCareerResult}
      renderStructuredResult={(result, isGuest) => (
        <JazOnlyPathResultView
          result={result as JazOnlyPathResult}
          isGuest={isGuest}
          goalPath="grow_career"
        />
      )}
    />
  )
}
