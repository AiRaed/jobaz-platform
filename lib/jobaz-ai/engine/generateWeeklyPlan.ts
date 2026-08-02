/**
 * Adaptive weekly plan from live profile state.
 */

import { TOOL_CATALOG } from '@/lib/jobaz-ai/engines/careerAssessment/toolCatalog'
import { normalizeGoal } from '@/lib/jobaz-ai/engines/careerAssessment/profileSignals'
import type { StoredRichActionPlan } from '@/lib/jobaz-ai/engines/careerAssessment/richInsights'
import type { AiUserProfile } from '@/lib/jobaz-ai/profile/types'
import type { ProfileEngineRow } from './types'
import { hasActiveSkillLearning } from './skillLearning'

type PlanTask = StoredRichActionPlan['weeklyTasks'][number]

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const

function taskFromKey(
  key: keyof typeof TOOL_CATALOG,
  label: string,
  priority: PlanTask['priority'],
  minutes: number
): PlanTask {
  const t = TOOL_CATALOG[key]
  return {
    label,
    toolName: t.name,
    toolId: t.id,
    route: t.href,
    priority,
    estimatedMinutes: minutes,
  }
}

export function generateWeeklyPlan(
  profile: AiUserProfile | ProfileEngineRow,
  options?: { forceRegenerate?: boolean }
): StoredRichActionPlan {
  if (!options?.forceRegenerate) {
    const stored =
      'storedActionPlan' in profile
        ? profile.storedActionPlan
        : parseStoredPlan(profile.action_plan)
    if (stored?.weeklyTasks?.length) {
      return stored
    }
  }

  const cvStatus = 'cvStatus' in profile ? profile.cvStatus : profile.cv_status
  const englishLevel =
    'englishLevel' in profile ? profile.englishLevel : profile.english_level
  const dominantGoal =
    'dominantGoal' in profile ? profile.dominantGoal : profile.dominant_goal
  const readiness =
    'readinessScore' in profile ? profile.readinessScore : (profile.readiness_score ?? 0)
  const weakest =
    ('weakestArea' in profile ? profile.weakestArea : profile.weakest_area) ??
    'career readiness'

  const meta =
    'progressionMeta' in profile ? profile.progressionMeta : profile.progression_meta

  const goal = normalizeGoal(dominantGoal)
  const candidates: PlanTask[] = [
    {
      label: 'Review your AI career dashboard',
      toolName: 'Dashboard',
      toolId: 'dashboard',
      route: '/dashboard',
      priority: 'low',
      estimatedMinutes: 10,
    },
  ]

  if (cvStatus === 'no' || cvStatus === 'needs_improvement') {
    candidates.push(taskFromKey('cvBuilder', 'Improve your CV', 'high', 50))
  }

  if (goal === 'find_jobs') {
    candidates.push(taskFromKey('jobFinder', 'Search and save 5 suitable jobs', 'high', 35))
  }

  if (
    (cvStatus === 'yes' || cvStatus === 'needs_improvement') &&
    (meta?.jobsSavedCount ?? 0) + (meta?.jobsAppliedCount ?? 0) < 2
  ) {
    candidates.unshift(
      taskFromKey('jobFinder', 'Save 3 jobs and apply to at least 1 role', 'high', 40)
    )
  }

  if (englishLevel === 'beginner' || englishLevel === 'basic') {
    candidates.push(
      taskFromKey('writingReview', 'Improve English confidence in one text', 'high', 25)
    )
  }

  if (goal === 'improve_skills') {
    candidates.push(taskFromKey('buildYourPath', 'Explore one skill path', 'high', 25))
  }

  if (hasActiveSkillLearning(meta ?? undefined)) {
    candidates.unshift(
      taskFromKey('cvBuilder', 'Build a CV that highlights your new skills', 'high', 45),
      taskFromKey('jobFinder', 'Find entry-level roles for your skill path', 'high', 35)
    )
  }

  if (readiness >= 55) {
    candidates.push(taskFromKey('interviewCoach', 'Practice interview questions', 'medium', 30))
  }

  const seen = new Set<string>()
  let weeklyTasks = candidates.filter((t) => {
    if (seen.has(t.route)) return false
    seen.add(t.route)
    return true
  })

  if (weeklyTasks.length < 3) {
    weeklyTasks.push(
      taskFromKey('ukCareerAssistant', 'Ask one UK career question', 'low', 15)
    )
  }

  const [first, ...rest] = weeklyTasks
  rest.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
  weeklyTasks = [first, ...rest].slice(0, 5)

  const totalMin = weeklyTasks.reduce((s, t) => s + t.estimatedMinutes, 0)

  return {
    title: "This Week's AI Action Plan",
    summary: `Focus on ${weakest.toLowerCase()} — ${weeklyTasks.length} tasks (~${totalMin} min).`,
    weeklyTasks,
  }
}

function parseStoredPlan(raw: unknown): StoredRichActionPlan | null {
  if (!raw || typeof raw !== 'object') return null
  const plan = raw as StoredRichActionPlan
  if (!Array.isArray(plan.weeklyTasks) || plan.weeklyTasks.length === 0) return null
  return plan
}
