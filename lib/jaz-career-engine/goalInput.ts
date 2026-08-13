/**
 * Build JazAnalyseInput from Career Engine goal + answers (no server/inventory imports).
 */

import type { StrategicGoalId } from '@/lib/career-brain/userGoal'
import { buildJazAnalyseInputFromAnswers } from './buildInputFromAnswers'
import type { JazAnalyseInput, JazCareerGoal } from './types'

const GOAL_MAP: Record<StrategicGoalId, JazCareerGoal> = {
  work_in_education: 'work_in_education',
  work_in_profession: 'work_in_experience',
  work_in_experience: 'work_in_experience',
  start_new_career: 'start_new_career',
  grow_career: 'grow_current_career',
  side_job: 'extra_income',
  start_business: 'start_business',
}

export function skillsFromGoalAnswers(answers: Record<string, unknown>): string[] {
  const out: string[] = []
  const push = (v: unknown) => {
    if (Array.isArray(v)) out.push(...v.map(String))
    else if (typeof v === 'string' && v.trim()) {
      if (v.includes(',') || v.includes('|')) {
        out.push(...v.split(/[,|]/).map((s) => s.trim()).filter(Boolean))
      } else out.push(v.trim())
    }
  }

  push(answers.side_skills)
  push(answers.skills)
  push(answers.education_field)
  push(answers.education_specialisation)
  push(answers.experience_field)
  push(answers.experience_specialisation)
  push(answers.industry)
  push(answers.target_field)
  push(answers.grow_field)
  push(answers.current_role)
  push(answers.biz_idea)

  const blob = JSON.stringify(answers).toLowerCase()
  if (/account|finance|aat|bookkeep|xero|quickbooks/.test(blob)) out.push('administration', 'finance')
  if (/care|support\s*worker|carer|nhs/.test(blob)) out.push('care')
  if (/security|sia|steward|door/.test(blob)) out.push('security')
  if (/admin|office|reception|coordinator/.test(blob)) out.push('administration')
  if (/teach|tutor/.test(blob)) out.push('teaching')
  if (/warehouse|forklift/.test(blob)) out.push('warehouse')
  if (/retail|sales/.test(blob)) out.push('retail')

  return [...new Set(out.map((s) => s.trim().toLowerCase().replace(/\s+/g, '_')).filter(Boolean))]
}

export function buildJazInputForGoal(
  goalId: StrategicGoalId,
  answers: Record<string, unknown>
): JazAnalyseInput {
  const input = buildJazAnalyseInputFromAnswers({
    goal: GOAL_MAP[goalId] || 'unknown',
    answers,
    pathId: goalId,
  })
  const skills = skillsFromGoalAnswers(answers)
  if (skills.length) input.skills = skills
  input.goal = GOAL_MAP[goalId] || input.goal

  const blob = JSON.stringify(answers).toLowerCase()
  if (/online|remote|flexible/.test(blob)) {
    input.work_mode_preference = /online/.test(blob) ? 'online' : 'flexible'
  }

  return input
}
