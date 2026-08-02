/**
 * Persist Career Engine structured path results into the unified assessment pipeline.
 * Career Engine pages previously only wrote path-specific localStorage keys.
 */

import type { StrategicGoalId } from '@/lib/career-brain/userGoal'
import type { ExtraIncomePlanResult } from '@/lib/career-engine/extra-income/types'
import type { CareerEnginePlanResult } from '@/lib/career-engine/shared/planTypes'
import type {
  StartNewCareerEngineResult,
  StartNewCareerPlanResult,
} from '@/lib/career-engine/start-new-career/types'
import { isStartNewCareerRecommendations } from '@/lib/career-engine/start-new-career/types'
import { resolveAuthenticatedUserId } from '@/lib/auth/resolveUserId'
import type { UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import { mapCareerCoachResultToPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { handleAssessmentApiCompletion } from './completeAssessmentPersistence'

type PersistableStructuredResult =
  | CareerEnginePlanResult
  | StartNewCareerPlanResult
  | ExtraIncomePlanResult

const persistedKeys = new Set<string>()

function planResultToUkRuleResult(result: CareerEnginePlanResult): UkCareerRuleResult {
  return {
    summary: result.goal || result.careerReadiness.summary || `Your ${result.fieldLabel} UK career plan`,
    work_now: {
      directions: result.workNow.slice(0, 6).map((job, index) => ({
        direction_id: `${result.pathId}_${index}`,
        direction_title: job.title,
        why: job.salaryRange ? [`Typical band: ${job.salaryRange}`] : ['Matched to your profile'],
      })),
    },
    improve_later:
      result.essentialActions.length > 0 || result.recommendedCourses.length > 0
        ? {
            directions: [
              ...result.essentialActions.map((action, index) => ({
                direction_id: `action_${action.id || index}`,
                direction_title: action.title,
                why: [action.description.slice(0, 120)],
              })),
              ...result.recommendedCourses.slice(0, 4).map((course, index) => ({
                direction_id: `course_${course.id || index}`,
                direction_title: course.title,
                why: course.whyReasons.slice(0, 2),
              })),
            ],
          }
        : null,
    avoid: result.careerReadiness.missing?.slice(0, 4) ?? [],
    next_step: result.essentialActions[0]?.title ?? 'Open your career dashboard',
  }
}

function startNewCareerToUkRuleResult(result: StartNewCareerPlanResult): UkCareerRuleResult {
  return {
    summary: result.transition.summary,
    work_now: {
      directions: result.triad.workNow.slice(0, 6).map((item, index) => ({
        direction_id: `work_now_${index}`,
        direction_title: item.title,
        why: item.why.slice(0, 2),
      })),
    },
    improve_later: {
      directions: [
        ...result.triad.buildNext.slice(0, 4).map((item, index) => ({
          direction_id: `build_next_${index}`,
          direction_title: item.title,
          why: item.why.slice(0, 2),
        })),
        ...result.recommendedCourses.slice(0, 4).map((course, index) => ({
          direction_id: `course_${course.id || index}`,
          direction_title: course.title,
          why: course.whyReasons.slice(0, 2),
        })),
      ],
    },
    avoid: result.essentialActions
      .filter((a) => a.priority === 'critical')
      .map((a) => a.title)
      .slice(0, 4),
    next_step: result.essentialActions[0]?.title ?? result.triad.buildNext[0]?.title ?? 'Review your transition plan',
  }
}

function extraIncomeToUkRuleResult(result: ExtraIncomePlanResult): UkCareerRuleResult {
  return {
    summary: result.supportiveMessage,
    work_now: {
      directions: result.immediateOpportunities.slice(0, 6).map((job, index) => ({
        direction_id: `side_job_${index}`,
        direction_title: job.title,
        why: [job.whyMatch, job.monthlyEstimate],
      })),
    },
    // Qualifications only — never flatten long-term side streams into training.
    improve_later: {
      directions: result.qualifications.slice(0, 5).map((qual, index) => ({
        direction_id: `qual_${qual.id || index}`,
        direction_title: qual.title,
        why: [qual.whyHelps, qual.averageIncrease],
      })),
    },
    avoid: [],
    next_step: result.actionPlan[0]?.actions[0] ?? 'Start applying for side income roles',
  }
}

function structuredResultToUkRuleResult(result: PersistableStructuredResult): UkCareerRuleResult {
  if (result.pathId === 'start_new_career') {
    return startNewCareerToUkRuleResult(result)
  }
  if (result.pathId === 'side_job') {
    return extraIncomeToUkRuleResult(result)
  }
  return planResultToUkRuleResult(result)
}

function structuredResultPersistKey(
  goalId: StrategicGoalId,
  result: PersistableStructuredResult,
  summary: string
): string {
  if (result.pathId === 'start_new_career') {
    return `${goalId}:${result.targetField}:${summary}`
  }
  if (result.pathId === 'side_job') {
    return `${goalId}:${result.immediateOpportunities[0]?.id ?? 'side'}:${summary}`
  }
  return `${goalId}:${result.field}:${summary}`
}

export async function persistCareerEngineStructuredResult(params: {
  goalId: StrategicGoalId
  answers: Record<string, string>
  structuredResult: CareerEnginePlanResult | StartNewCareerEngineResult | ExtraIncomePlanResult
  source?: string
}): Promise<void> {
  if (isStartNewCareerRecommendations(params.structuredResult as StartNewCareerEngineResult)) {
    return
  }

  const roadmap = params.structuredResult as PersistableStructuredResult
  const ruleResult = structuredResultToUkRuleResult(roadmap)
  const jobazPlan = mapCareerCoachResultToPlan(roadmap)
  const persistKey = structuredResultPersistKey(params.goalId, roadmap, ruleResult.summary)

  if (persistedKeys.has(persistKey)) {
    console.log('[CA persist] career-engine skipped — already persisted', persistKey)
    return
  }

  const aiState: Record<string, unknown> = {
    phase: 'RESULT',
    path: params.goalId,
    classification_done: true,
    answers: {
      cb_user_goal: params.goalId,
      ...params.answers,
    },
    career_engine_result: roadmap,
    ...(jobazPlan ? { jobaz_plan: jobazPlan } : {}),
  }

  console.log('[CA persist] career-engine structured completion', {
    goalId: params.goalId,
    pathId: roadmap.pathId,
    userId: await resolveAuthenticatedUserId(),
  })

  const outcome = await handleAssessmentApiCompletion({
    done: true,
    result: ruleResult,
    path: params.goalId,
    aiState,
    stateUpdates: aiState,
    conversation: [],
    sessionId: null,
    persistedResultKeyRef: { current: null },
    source: params.source ?? `career_engine_${params.goalId}`,
  })

  if (outcome?.ok) {
    persistedKeys.add(persistKey)
  }

  console.log('[CA persist] career-engine persist outcome', outcome)
}
