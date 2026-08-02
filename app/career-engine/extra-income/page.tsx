'use client'

import CareerEnginePathPage from '@/components/career-engine/conversation/CareerEnginePathPage'
import ExtraIncomeResultView from '@/components/career-engine/extra-income/ExtraIncomeResult'
import { buildExtraIncomeResult } from '@/lib/career-engine/extra-income/decisionEngine'
import type { ExtraIncomePlanResult } from '@/lib/career-engine/extra-income/types'
import { parseMultiSelectValue } from '@/lib/career-engine/shared/assessmentMultiSelect'
import { buildJazAnalyseInputFromAnswers } from '@/lib/jaz-career-engine/buildInputFromAnswers'
import { mapJazAnalyseToJobAZPlan } from '@/lib/jaz-career-engine/mapJazAnalyseToJobAZPlan'
import type { JazAnalyseResult } from '@/lib/jaz-career-engine/types'

async function attachJazPlan(
  result: ExtraIncomePlanResult,
  answers: Record<string, string>
): Promise<ExtraIncomePlanResult> {
  try {
    const skills = parseMultiSelectValue(answers.side_skills)
    const input = buildJazAnalyseInputFromAnswers({
      goal: 'extra_income',
      answers: { ...answers, side_skills: skills },
      pathId: 'side_job',
    })
    input.skills = skills.length ? skills : input.skills

    console.info('[ExtraIncome page] calling /api/jaz-career/analyse (client fallback)', {
      skills: input.skills,
    })

    const res = await fetch('/api/jaz-career/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ...result, plan_source: 'legacy' }
    const analyse = (await res.json()) as JazAnalyseResult
    if (!analyse?.engine_version) return { ...result, plan_source: 'legacy' }

    const plan = mapJazAnalyseToJobAZPlan(analyse, {
      pathId: 'side_job',
      coachNotes: analyse.why_this_route_fits,
    })
    return {
      ...result,
      jaz_analyse: analyse,
      jaz_jobaz_plan: plan,
      plan_source: analyse.ai_provider === 'ollama' ? 'jaz' : 'jaz_fallback',
    }
  } catch (err) {
    console.error('[ExtraIncome page] jaz analyse fallback failed', err)
    return { ...result, plan_source: 'legacy' }
  }
}

async function buildExtraIncomeStructuredResult(
  answers: Record<string, string>
): Promise<ExtraIncomePlanResult> {
  console.info('[ExtraIncome page] submitted', {
    side_skills: answers.side_skills,
    side_hours: answers.side_hours,
    side_schedule: answers.side_schedule,
    answerKeys: Object.keys(answers),
  })

  try {
    const controller = new AbortController()
    const abortTimer = window.setTimeout(() => controller.abort(), 90000)
    const res = await fetch('/api/career-engine/extra-income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
      signal: controller.signal,
    })
    window.clearTimeout(abortTimer)
    const body = (await res.json()) as Record<string, unknown>
    console.info('[ExtraIncome page] api_json', {
      ok: res.ok,
      status: res.status,
      topLevelKeys: Object.keys(body),
      hasResult: Boolean(body.result),
      hasRecommendations: Boolean(body.recommendations),
      hasFinalResult: Boolean(body.finalResult),
      hasPlan: Boolean(body.plan),
      hasMessage: Boolean(body.message),
      hasContent: Boolean(body.content),
      resultKeys:
        body.result && typeof body.result === 'object'
          ? Object.keys(body.result as object)
          : [],
    })

    if (res.ok && body.result && typeof body.result === 'object') {
      const result = body.result as ExtraIncomePlanResult
      console.info('[ExtraIncome page] API result plan_source', result.plan_source)
      if (result.jaz_jobaz_plan) return result
      return attachJazPlan(result, answers)
    }
  } catch (err) {
    console.error('[ExtraIncome page] API failed, using local fallback', err)
  }

  console.info('[ExtraIncome page] local_fallback')
  const legacy = buildExtraIncomeResult(answers)
  return attachJazPlan(legacy, answers)
}

export default function ExtraIncomePage() {
  return (
    <CareerEnginePathPage
      goalId="side_job"
      buildStructuredResult={buildExtraIncomeStructuredResult}
      renderStructuredResult={(result, isGuest) => (
        <ExtraIncomeResultView result={result as ExtraIncomePlanResult} isGuest={isGuest} />
      )}
    />
  )
}
