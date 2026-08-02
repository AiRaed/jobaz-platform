import type { CareerBrainState } from '@/lib/career-brain/types'
import {
  resolveCareerSectorId,
  labelCareerSector,
} from '@/lib/career-engine/shared/careerSectors'
import { parseInterestAreas } from '@/lib/career-engine/shared/interestScoring'
import type { StartNewCareerSituation } from './types'
import {
  hasUserConfirmedTarget,
  hasWorkExperience,
  knowsTargetCareer,
} from './situationUtils'

function mapUrgencyToRetrainTime(urgency?: string, studyWilling?: string): string {
  if (studyWilling === 'no') return 'under_3_months'
  if (urgency === 'immediate') return 'under_3_months'
  if (urgency === 'study_first') return 'over_2_years'
  return '3_12_months'
}

function resolveTargetField(answers: Record<string, string>): string {
  if (knowsTargetCareer(answers.starting_situation)) {
    if (answers.target_field === 'other') return 'other'
    return answers.target_field ?? 'not_sure'
  }

  if (hasUserConfirmedTarget(answers)) {
    return answers.target_field ?? 'not_sure'
  }

  return 'not_sure'
}

export function mapStartNewCareerToCareerBrainState(
  answers: Record<string, string>
): CareerBrainState {
  const situation = answers.starting_situation as StartNewCareerSituation
  const experienced = hasWorkExperience(situation)
  const targetField = resolveTargetField(answers)
  const targetSector = resolveCareerSectorId(targetField)

  const brainAnswers: Record<string, unknown> = {
    cb_user_goal: 'start_new_career',
    cb_change_current_field: experienced ? answers.current_field ?? 'other' : 'other',
    cb_change_current_field_other: experienced
      ? answers.current_field === 'other'
        ? answers.current_field_other
        : undefined
      : 'No prior work experience',
    cb_change_experience_years: experienced ? answers.experience_years ?? '1_3' : '0_1',
    cb_change_target_field:
      targetField === 'other' || targetField === 'not_sure'
        ? 'not_sure'
        : targetSector ?? 'not_sure',
    cb_change_target_field_other:
      targetField === 'other' ? answers.target_field_other : undefined,
    cb_change_interest_area: answers.interest_area,
    cb_change_interest_areas: parseInterestAreas(answers.interest_area),
    cb_change_suggested_target:
      targetField !== 'not_sure' && targetSector ? targetSector : undefined,
    cb_change_study_willing: answers.study_willing ?? 'yes',
    cb_change_reason: 'opportunities',
    cb_change_retrain_time: mapUrgencyToRetrainTime(answers.urgency, answers.study_willing),
    cb_change_salary_reduction: answers.urgency === 'immediate' ? 'yes' : 'no',
    cb_first_job_education_level: answers.education_level,
    cb_english_level: answers.english_level,
    uk_work_experience: answers.uk_work_experience,
    preferred_location: answers.preferred_location,
    starting_situation: situation,
    education_level: answers.education_level,
    english_level: answers.english_level,
    urgency: answers.urgency,
    target_confirmed: answers.target_confirmed,
  }

  return { answers: brainAnswers }
}

export function resolveDisplayCurrentField(answers: Record<string, string>): string {
  const situation = answers.starting_situation
  if (!hasWorkExperience(situation)) return 'No prior work experience'
  if (answers.current_field === 'other') {
    return answers.current_field_other?.trim() || 'Other field'
  }
  return labelCareerSector(answers.current_field ?? '')
}

export function resolveDisplayTargetField(answers: Record<string, string>): string {
  const targetField = resolveTargetField(answers)
  if (targetField === 'other') {
    return answers.target_field_other?.trim() || 'Target career'
  }
  if (targetField === 'not_sure') {
    return 'Career to be confirmed'
  }
  return labelCareerSector(targetField)
}

export { resolveTargetField }
