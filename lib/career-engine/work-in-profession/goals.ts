/**
 * Work in My Profession — default route framing (no goal question in CA flow).
 */

/** Analytics / result default when no goal question is asked. */
export const DEFAULT_PROFESSION_GOAL = 'default_profession_route' as const

/** Legacy goal values retained for backwards-compatible match input only. */
export const PROFESSION_GOAL_OPTIONS = [
  {
    value: DEFAULT_PROFESSION_GOAL,
    label: 'Profession route',
    description: 'Realistic UK roles for your profession and experience.',
  },
  {
    value: 'find_similar_work',
    label: 'Find similar work now',
    description: 'Target roles you could apply for with your current experience.',
  },
  {
    value: 'understand_closest_roles',
    label: 'Understand the closest UK roles',
    description: 'See how UK employers title work like yours.',
  },
  {
    value: 'improve_chances',
    label: 'Improve my chances',
    description: 'Focus on roles and checks that make applications stronger.',
  },
  {
    value: 'move_better_role',
    label: 'Move to a better role',
    description: 'Look at progression and supervisor-level targets.',
  },
  {
    value: 'change_related',
    label: 'Change to a related profession',
    description: 'Explore related specialisms in the same industry.',
  },
  {
    value: 'start_self_employed',
    label: 'Start self-employed work',
    description: 'See self-employed and contractor-style UK roles.',
  },
] as const

export type ProfessionGoalValue = (typeof PROFESSION_GOAL_OPTIONS)[number]['value']

export function isProfessionGoalValue(value: string): value is ProfessionGoalValue {
  return PROFESSION_GOAL_OPTIONS.some((o) => o.value === value)
}

export function getProfessionGoalLabel(value: string): string {
  return PROFESSION_GOAL_OPTIONS.find((o) => o.value === value)?.label ?? value
}
