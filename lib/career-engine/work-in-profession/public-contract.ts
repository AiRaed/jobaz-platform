/**
 * Public-safe result contract for Work in My Profession (Career Assistant).
 * Never expose draft_internal status or raw seed payloads to normal users.
 */

import type { ProfessionGoalValue } from './goals'
import type { ExperienceQuestionMode } from './level-questions'
import type { ProfessionalLevelKey } from './types'
import type { WipTrainingRecommendations } from './course-alignment'

export type WipMatchLabel = 'Best immediate route' | 'Good match' | 'Progression route'

export type PublicWipRoleCard = {
  id: string
  role_title: string
  match_label: WipMatchLabel
  start_now: boolean
  licence_or_check: string | null
  description: string
  cv_focus_points: string[]
  uk_role_keywords: string[]
  professional_level_label: string
  specialism_name: string
}

export type PublicWipMatchResult = {
  pathway: 'work_in_my_profession'
  result_source: 'work_in_profession_library'
  headline: string
  /** Short framing under the header. */
  result_framing: string
  profession_field: string
  specialism: string
  /** Public row title: "Current position" or "Professional level". */
  experience_result_label: string
  /** Public-facing Step 3 answer (not internal mapped level for contextual modes). */
  experience_display_label: string
  /** Mapped internal level label — admin/debug only; avoid showing when mode !== generic. */
  professional_level: string
  professional_level_key: ProfessionalLevelKey
  experience_option_id: string | null
  experience_mode: ExperienceQuestionMode
  /** Always default_profession_route while goal question is disabled. */
  selected_goal: ProfessionGoalValue
  selected_goal_label: string
  matched_role_count: number
  roles: PublicWipRoleCard[]
  requirements: string[]
  fallback_used: boolean
  fallback_message: string | null
  courses_note: string
  training_recommendations?: WipTrainingRecommendations | null
}

export const WIP_COURSES_PLACEHOLDER =
  'Training and licence recommendations will be added after this profession route is reviewed.'

export const WIP_DEFAULT_RESULT_FRAMING =
  'Based on your profession, these are realistic UK roles to target.'
