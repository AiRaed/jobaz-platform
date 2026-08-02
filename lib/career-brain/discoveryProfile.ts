/**
 * Structured career discovery profile — built before question selection.
 */

import { detectCareerDomain } from './domains'
import {
  getEntrySituation,
  getExperienceTier,
  isGraduatePath,
  isGenericNoExperiencePath,
  isStudentPath,
} from './entryClassification'
import { getGraduateStudyField } from './graduatePath'
import { getStudentStudyField } from './studentPath'
import { getRoutingGoal, getSelectedUserGoal, isStartNewCareerGoal } from './userGoal'
import { buildNarrativeFromState, detectFieldHintsFromText } from './fieldSignals'
import type { CareerBrainState, CareerProfile } from './types'
import type { DiscoveryProfile } from './discoveryTypes'

function ans(state: CareerBrainState, key: string): string | undefined {
  const v = state.answers?.[key]
  if (v === undefined || v === null) return undefined
  return Array.isArray(v) ? v.join(',') : String(v)
}

export function buildDiscoveryProfile(
  state: CareerBrainState,
  profile: CareerProfile
): DiscoveryProfile {
  const narrative = buildNarrativeFromState(state)
  const blob = narrative.toLowerCase()
  const hint = detectFieldHintsFromText(narrative)

  const tier = getExperienceTier(state)
  const eduRaw = ans(state, 'cb_edu') ?? ans(state, 'edu')
  const expRaw = ans(state, 'cb_exp') ?? ans(state, 'exp')
  const intent =
    ans(state, 'cb_student_work_intent') ??
    ans(state, 'cb_graduate_field_intent') ??
    ans(state, 'cb_field_intent') ??
    ans(state, 'cb_continue_in_field') ??
    ans(state, 'cb_professional_field_intent')

  const graduate = isGraduatePath(state)
  const student = isStudentPath(state)
  const educationExists = graduate || student
    ? true
    : tier === 'no_experience' && isGenericNoExperiencePath(state)
      ? false
      : tier
        ? true
        : eduRaw === 'yes'
          ? true
          : eduRaw === 'no'
            ? false
            : null
  const experienceExists = graduate || student
    ? tier === 'no_experience' || String(state.answers?.cb_experience_level) === 'no_experience'
      ? false
      : true
    : tier === 'no_experience' && isGenericNoExperiencePath(state)
      ? false
      : tier
        ? true
        : expRaw === 'yes'
          ? true
          : expRaw === 'no'
            ? false
            : null

  const study =
    getStudentStudyField(state) ||
    getGraduateStudyField(state) ||
    ans(state, 'cb_study_field')?.trim() ||
    ans(state, 'cb_professional_field')?.trim() ||
    profile.studyField ||
    hint.education_field ||
    null
  const work =
    ans(state, 'cb_basic_experience_text')?.trim() ||
    ans(state, 'cb_professional_experience')?.trim() ||
    ans(state, 'cb_work_experience')?.trim() ||
    profile.workExperienceField ||
    hint.experience_field ||
    null

  let wantsSameField = profile.wantsSameField
  let wantsCareerChange = profile.wantsCareerChange
  if (getEntrySituation(state) === 'career_change') wantsCareerChange = true
  if (isStartNewCareerGoal(getRoutingGoal(state)) || isStartNewCareerGoal(getSelectedUserGoal(state))) {
    wantsCareerChange = true
  }
  if (intent?.includes('related_studies')) {
    wantsSameField = true
    wantsCareerChange = false
  } else if (intent === 'yes' || intent?.includes('same_field')) {
    wantsSameField = true
    wantsCareerChange = false
  } else if (intent?.includes('related')) {
    wantsSameField = true
    wantsCareerChange = false
  } else if (intent?.includes('change_field')) {
    wantsCareerChange = true
    wantsSameField = false
  } else if (intent?.includes('unsure')) {
    wantsSameField = null
    wantsCareerChange = null
  }

  const targetField =
    ans(state, 'cb_change_target_field')?.trim() ||
    ans(state, 'cb_change_direction')?.trim() ||
    profile.targetField ||
    (wantsCareerChange ? null : work || study) ||
    null

  const computerLevel = ans(state, 'cb_computer_level') ?? ans(state, 'cb_office_computer_level')
  const customerComfort =
    ans(state, 'cb_customer_comfort') ?? ans(state, 'cb_office_customer_comfort')
  const drivingAnswer = ans(state, 'cb_uk_driving_licence') ?? ans(state, 'cb_driving_licence')
  const physicalAnswer = ans(state, 'cb_physical_ability')
  const trainAnswer = ans(state, 'cb_cert_openness') ?? ans(state, 'cb_office_training')

  const { domain } = detectCareerDomain(narrative, profile)

  return {
    education_exists: educationExists,
    education_field: study,
    education_country: ans(state, 'cb_education_country') ?? null,
    work_experience_exists: experienceExists,
    work_experience_field: work,
    years_experience: profile.yearsOfExperience,
    uk_experience:
      profile.experienceCountry === 'UK'
        ? true
        : profile.experienceCountry === 'non-UK'
          ? false
          : /\b(uk|united kingdom|britain)\b/i.test(blob)
            ? true
            : null,
    wants_same_field: wantsSameField,
    wants_career_change: wantsCareerChange,
    target_field: targetField,
    english_level: ans(state, 'cb_english') ?? profile.englishLevel,
    computer_level: computerLevel ?? null,
    driving_licence:
      drivingAnswer === 'yes'
        ? true
        : drivingAnswer === 'no'
          ? false
          : profile.licences.length > 0
            ? true
            : null,
    physical_work_ability: physicalAnswer ?? null,
    customer_facing_comfort: customerComfort ?? null,
    urgency: ans(state, 'cb_urgency') ?? profile.urgencyLevel,
    willingness_to_train:
      trainAnswer === 'yes' ? true : trainAnswer === 'no' ? false : null,
    location_preference:
      ans(state, 'cb_location') ??
      ans(state, 'cb_creative_uk_location') ??
      profile.ukLocation ??
      'UK-wide',
    shift_flexibility: ans(state, 'cb_shift_flexibility') ?? null,
    constraints: profile.constraints,
    domain,
    has_portfolio: profile.hasPortfolio,
    tools: profile.toolsAndSkills,
  }
}

export function isColdStartProfile(d: DiscoveryProfile): boolean {
  return d.education_exists === null && d.work_experience_exists === null
}

export function hasNoEducationOrExperience(d: DiscoveryProfile): boolean {
  return d.education_exists === false && d.work_experience_exists === false
}

export function isEntryNoExperiencePath(state: CareerBrainState): boolean {
  return isGenericNoExperiencePath(state)
}

export function hasAnyBackground(d: DiscoveryProfile): boolean {
  return d.education_exists === true || d.work_experience_exists === true
}

export function inferChangeTrack(target: string | null): string {
  const t = (target ?? '').toLowerCase()
  if (/office|admin|reception|clerical|data\s*entry|customer\s*service|call\s*centre/.test(t)) {
    return 'office'
  }
  if (/animat|design|creative|video|motion|3d|graphic/.test(t)) return 'creative'
  if (/software|developer|it\s|tech|programming/.test(t)) return 'tech'
  if (/nurse|care|health|hospital/.test(t)) return 'care'
  if (/taxi|uber|driver|delivery|courier|logistics/.test(t)) return 'driving'
  return 'general'
}
