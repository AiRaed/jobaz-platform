'use client'

import CareerEnginePathPage from '@/components/career-engine/conversation/CareerEnginePathPage'
import JazOnlyPathResultView, {
  type JazOnlyPathResult,
} from '@/components/career-engine/JazOnlyPathResultView'

async function buildStartBusinessResult(answers: Record<string, string>): Promise<JazOnlyPathResult> {
  console.info('[StartBusiness] submitting answers', {
    biz_idea: answers.biz_idea,
    biz_capital: answers.biz_capital,
  })

  try {
    const res = await fetch('/api/career-engine/start-business', {
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

  try {
    const res = await fetch('/api/jaz-career/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: 'start_business',
        answers,
        skills: [answers.biz_idea].filter(Boolean),
      }),
    })
    if (res.ok) {
      const analyse = await res.json()
      const { mapJazAnalyseToJobAZPlan } = await import(
        '@/lib/jaz-career-engine/mapJazAnalyseToJobAZPlan'
      )
      return {
        pathId: 'start_business',
        phase: 'roadmap',
        answers,
        jaz_analyse: analyse,
        jaz_jobaz_plan: mapJazAnalyseToJobAZPlan(analyse, { pathId: 'start_business' }),
        plan_source: analyse.ai_provider === 'ollama' ? 'jaz' : 'jaz_fallback',
      }
    }
  } catch {
    // ignore
  }

  return {
    pathId: 'start_business',
    answers,
    plan_source: 'legacy',
    jaz_jobaz_plan: null,
    jaz_analyse: null,
  }
}

export default function StartBusinessPage() {
  return (
    <CareerEnginePathPage
      goalId="start_business"
      buildStructuredResult={buildStartBusinessResult}
      renderStructuredResult={(result, isGuest) => (
        <JazOnlyPathResultView
          result={result as JazOnlyPathResult}
          isGuest={isGuest}
          goalPath="start_business"
        />
      )}
    />
  )
}
