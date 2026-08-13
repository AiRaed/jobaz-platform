import type { StrategicGoalId } from '@/lib/career-brain/userGoal'
import { CAREER_ENGINE_GOAL_REDIRECTS } from '@/lib/career-engine/conversation/pathRegistry'

export type LandingGoalOption = {
  id: StrategicGoalId
  label: string
  emoji: string
  followUp: string
  /** Launch gating — visible but not selectable */
  disabled?: boolean
  badge?: string
  helperText?: string
}

/**
 * Launch Career Goal options for the landing JAZ panel.
 * Experience removed (replaced by Profession). Grow + Business kept as Coming Soon.
 */
export const LANDING_GOAL_OPTIONS: LandingGoalOption[] = [
  {
    id: 'work_in_education',
    label: 'Work in my Education',
    emoji: '🎓',
    followUp:
      'Great — I’ll map your qualification to realistic UK roles, recognition steps, and training.',
  },
  {
    id: 'work_in_profession',
    label: 'Work in My Profession',
    emoji: '🛠️',
    followUp:
      'Perfect — I’ll match your practical profession and experience level to realistic UK target roles.',
  },
  {
    id: 'start_new_career',
    label: 'Start a New Career',
    emoji: '🌱',
    followUp:
      'Smart move — I’ll build a realistic transition plan with bridge roles and retraining options.',
  },
  {
    id: 'side_job',
    label: 'Looking for Extra Income',
    emoji: '💰',
    followUp:
      'I’ll find flexible side income options that fit your schedule and skills.',
  },
  {
    id: 'grow_career',
    label: 'Grow in my Current Career',
    emoji: '📈',
    followUp:
      'Let’s plan your next promotion — skills, certifications, and senior roles in the UK.',
    disabled: true,
    badge: 'Coming Soon',
    helperText: 'Available in a future update.',
  },
  {
    id: 'start_business',
    label: 'Start My Own Business',
    emoji: '🚀',
    followUp:
      'Exciting — I’ll assess your idea and build a realistic UK startup roadmap.',
    disabled: true,
    badge: 'Coming Soon',
    helperText: 'Available in a future update.',
  },
]

export function getGoalRedirect(id: StrategicGoalId): string {
  return CAREER_ENGINE_GOAL_REDIRECTS[id]
}
