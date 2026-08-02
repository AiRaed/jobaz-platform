import type { StrategicGoalId } from '@/lib/career-brain/userGoal'
import { CAREER_ENGINE_GOAL_REDIRECTS } from '@/lib/career-engine/conversation/pathRegistry'

export type LandingGoalOption = {
  id: StrategicGoalId
  label: string
  emoji: string
  followUp: string
}

export const LANDING_GOAL_OPTIONS: LandingGoalOption[] = [
  {
    id: 'work_in_education',
    label: 'Work in my Education',
    emoji: '🎓',
    followUp:
      'Great — I’ll map your qualification to realistic UK roles, recognition steps, and training.',
  },
  {
    id: 'work_in_experience',
    label: 'Work in my Experience',
    emoji: '💼',
    followUp:
      'Perfect — I’ll match your work history to UK jobs at your level, not entry-level roles.',
  },
  {
    id: 'start_new_career',
    label: 'Start a New Career',
    emoji: '🌱',
    followUp:
      'Smart move — I’ll build a realistic transition plan with bridge roles and retraining options.',
  },
  {
    id: 'grow_career',
    label: 'Grow in my Career',
    emoji: '📈',
    followUp:
      'Let’s plan your next promotion — skills, certifications, and senior roles in the UK.',
  },
  {
    id: 'side_job',
    label: 'Looking for Extra Income',
    emoji: '💰',
    followUp:
      'I’ll find flexible side income options that fit your schedule and skills.',
  },
  {
    id: 'start_business',
    label: 'Start My Own Business',
    emoji: '🚀',
    followUp:
      'Exciting — I’ll assess your idea and build a realistic UK startup roadmap.',
  },
]

export function getGoalRedirect(id: StrategicGoalId): string {
  return CAREER_ENGINE_GOAL_REDIRECTS[id]
}
