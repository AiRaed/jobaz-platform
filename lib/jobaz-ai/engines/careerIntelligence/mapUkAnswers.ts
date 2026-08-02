/**
 * Map UK Career Assistant answers → partial AI Career Path profile signals.
 * Best-effort; rules remain authoritative for UK CA scoring.
 */

import type { AssessmentAnswers, CareerAssessmentResult } from '@/lib/jobaz-ai/types'
import { TOOL_CATALOG } from '@/lib/jobaz-ai/engines/careerAssessment/toolCatalog'
import type { UkCareerRuleResult } from './types'
import type { UkCareerAssistantState, PartialProfileContext } from './types'

function mapEnglish(level: unknown): AssessmentAnswers['english'] | undefined {
  const v = String(level ?? '').toLowerCase()
  if (v.includes('beginner') || v === 'basic') return 'beginner'
  if (v.includes('intermediate')) return 'intermediate'
  if (v.includes('good') || v.includes('fluent')) return 'good'
  return undefined
}

function mapExperience(state: UkCareerAssistantState): AssessmentAnswers['experience'] | undefined {
  const exp = state.answers?.exp
  const edu = state.answers?.edu
  if (exp === 'yes' || exp === true) return 'strong'
  if (exp === 'some') return 'some'
  if (edu === 'yes' && exp === 'no') return 'none'
  return undefined
}

function mapSituation(state: UkCareerAssistantState): AssessmentAnswers['situation'] | undefined {
  const goal = String(state.answers?.goal_gate ?? '')
  if (goal.includes('job') || goal.includes('work_now')) return 'need_job_quickly'
  if (goal.includes('better') || goal.includes('upgrade')) return 'better_job'
  if (goal.includes('change')) return 'change_career'
  const path = state.path
  if (path === 'PATH_1') return 'need_job_quickly'
  if (path === 'PATH_3') return 'no_uk_experience'
  return undefined
}

function mapHelpNext(state: UkCareerAssistantState): AssessmentAnswers['helpNext'] | undefined {
  const goal = String(state.answers?.goal_gate ?? '')
  if (goal.includes('cv')) return 'build_cv'
  if (goal.includes('interview')) return 'interviews'
  if (goal.includes('skill') || goal.includes('train')) return 'improve_skills'
  if (goal.includes('job') || goal.includes('work')) return 'find_jobs'
  return 'understand_options'
}

/** Partial wizard answers for dashboard / profile enrichment. */
export function mapUkStateToPartialAssessmentAnswers(
  state: UkCareerAssistantState
): Partial<AssessmentAnswers> {
  const english = mapEnglish(state.answers?.language)
  const situation = mapSituation(state)
  const experience = mapExperience(state)
  const helpNext = mapHelpNext(state)

  return {
    ...(situation ? { situation } : {}),
    ...(experience ? { experience } : {}),
    ...(english ? { english } : {}),
    cv: 'needs_improvement',
    ...(helpNext ? { helpNext } : {}),
  }
}

export function buildProfileContextFromUkState(
  state: UkCareerAssistantState,
  existing?: PartialProfileContext | null
): PartialProfileContext {
  const answers = state.answers ?? {}
  const weakest =
    answers.people_comfort === 'avoid_customers'
      ? 'Customer-facing roles'
      : answers.transport?.toString().includes('no')
        ? 'Transport / licence constraints'
        : undefined

  return {
    ...existing,
    dominantGoal: String(answers.goal_gate ?? existing?.dominantGoal ?? ''),
    strongestArea: answers.strengths ? String(answers.strengths) : existing?.strongestArea,
    weakestArea: weakest ?? existing?.weakestArea,
  }
}

/** Bridge UK rule result → profile updater (recommendedPath, tools, jobs). */
export function ukRuleResultToProfileResult(uk: UkCareerRuleResult): CareerAssessmentResult {
  const top = uk.work_now.directions[0]
  const nextStep =
    typeof uk.next_step === 'string' ? uk.next_step : uk.next_step?.label ?? 'Review your next steps'

  return {
    recommendedPath: top?.direction_title ?? 'UK Career Path',
    summary: uk.summary,
    suggestedJobs: uk.work_now.directions.map((d) => d.direction_title).slice(0, 5),
    nextSteps: [nextStep],
    recommendedTools: [TOOL_CATALOG.jobFinder, TOOL_CATALOG.cvBuilder, TOOL_CATALOG.ukCareerAssistant],
    pathType: 'uk_transition',
  }
}
